import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chargeCardOnFile, tierPriceCents, nextRenewDate } from "@/lib/square/subscriptions";
import { syncMembershipChange } from "@/lib/brevo/sync";
import {
  graceEndsAt,
  renewalDecision,
  type RenewalCandidate,
} from "@/lib/membership/renewal";
import { sendRenewalFailedEmail, sendMembershipEndedEmail } from "@/lib/email/renewal";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Charges memberships that are due, and keeps trying the ones that failed.
 *
 * This used to give up on the first decline: it set PAST_DUE with endsAt =
 * now, so benefits stopped that second, and because it only ever queried
 * ACTIVE memberships it never looked at that member again. A card that worked
 * the next morning made no difference — the membership was simply over, and
 * nobody was told. Failures now open a grace window that is retried daily.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Due renewals and everything already in grace, because the point is to
  // keep trying the second group rather than leave them where they fell.
  const candidates = await prisma.membership.findMany({
    where: {
      tier: { in: ["ARTESANO", "SELECTO", "LEGENDARIO"] },
      OR: [
        { status: "ACTIVE", renewsAt: { lte: now } },
        { status: "PAST_DUE" },
      ],
    },
    include: {
      user: { select: { email: true, name: true, preferredLang: true, langChosenByUser: true } },
    },
  });

  const results = {
    renewed: 0,
    retried: 0,
    failed: 0,
    expired: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const m of candidates) {
    const candidate: RenewalCandidate = {
      tier: m.tier,
      status: m.status,
      renewsAt: m.renewsAt,
      endsAt: m.endsAt,
      hasCard: Boolean(m.squareCardId && m.squareCustomerId),
    };

    const decision = renewalDecision(candidate, now);

    if (decision.action === "skip") {
      results.skipped++;
      continue;
    }

    if (decision.action === "expire") {
      await prisma.membership.update({
        where: { id: m.id },
        data: { status: "EXPIRED" },
      });
      if (m.user?.email) {
        await sendMembershipEndedEmail({
          email: m.user.email,
          name: m.user.name,
          tier: m.tier,
          preferredLang: m.user.preferredLang,
          langChosenByUser: m.user.langChosenByUser,
        });
        syncMembershipChange({
          email: m.user.email,
          tier: m.tier,
          status: "EXPIRED",
          language: m.user.preferredLang,
        });
      }
      results.expired++;
      continue;
    }

    const priceCents = tierPriceCents(m.tier as any);

    try {
      await chargeCardOnFile({
        customerId: m.squareCustomerId!,
        cardId: m.squareCardId!,
        amountCents: priceCents,
        note: `Karyana ${m.tier} renewal`,
        // Keyed by the day, so a retry later the same day is not a second
        // charge but a retry tomorrow is a real attempt.
        idempotencyKey: `renewal-${m.id}-${now.toISOString().slice(0, 10)}`,
      });

      await prisma.membership.update({
        where: { id: m.id },
        data: {
          status: "ACTIVE",
          // A successful retry clears the grace window: the member is simply
          // paid up again, and leaving endsAt set would end them anyway.
          endsAt: null,
          cancelledAt: null,
          renewsAt: nextRenewDate(m.tier as any, now),
          isTrial: false,
          lastRenewedAt: now,
        },
      });

      // Selecto & Legendario only, 1 point = 1 cent, no multiplier.
      if (m.tier === "SELECTO" || m.tier === "LEGENDARIO") {
        await prisma.user.update({
          where: { id: m.userId },
          data: { pointsBalance: { increment: priceCents } },
        });
        await prisma.pointsTransaction.create({
          data: {
            userId: m.userId,
            amount: priceCents,
            type: "BONUS",
            note: `${m.tier} renewal — membership fee converted to points`,
          },
        });
      }

      if (m.user?.email) {
        syncMembershipChange({
          email: m.user.email,
          tier: m.tier,
          status: "ACTIVE",
          language: m.user.preferredLang,
        });
      }

      if (decision.attempt === "retry") results.retried++;
      else results.renewed++;
    } catch (err: any) {
      const reason = err?.errors?.[0]?.detail ?? err?.message ?? "Payment failed";
      console.error(`[cron] renewal failed for membership ${m.id}: ${reason}`);

      if (decision.attempt === "first") {
        // Benefits continue through the window — the access rule grants them
        // while endsAt is in the future — and the card is tried again daily.
        const endsAt = graceEndsAt(now);
        await prisma.membership.update({
          where: { id: m.id },
          data: { status: "PAST_DUE", endsAt },
        });

        if (m.user?.email) {
          await sendRenewalFailedEmail({
            email: m.user.email,
            name: m.user.name,
            tier: m.tier,
            endsAt,
            reason,
            preferredLang: m.user.preferredLang,
            langChosenByUser: m.user.langChosenByUser,
          });
          syncMembershipChange({
            email: m.user.email,
            tier: m.tier,
            status: "PAST_DUE",
            language: m.user.preferredLang,
          });
        }
      }
      // A failed retry changes nothing: the window is already open and
      // tomorrow's run will try again. Re-emailing daily would be nagging.

      results.failed++;
      results.errors.push(`${m.user?.email ?? m.id}: ${reason}`);
    }
  }

  console.log("[cron] renewal results:", results);
  return NextResponse.json(results);
}
