import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import {
  ensureSquareCustomer,
  saveCardOnFile,
  chargeCardOnFile,
  tierPriceCents,
  nextRenewDate,
} from "@/lib/square/subscriptions";
import { syncMembershipChange } from "@/lib/brevo/sync";
import { renewalDecision } from "@/lib/membership/renewal";

export const dynamic = "force-dynamic";

/**
 * Replaces the card a membership renews on.
 *
 * There was no way to do this. A declined renewal told the member their
 * benefits had stopped, and the only endpoint that touches a card is
 * /subscribe, which answers 409 for a tier they are already on — so the one
 * action that would fix the problem was the one they could not take.
 *
 * When the membership is already behind, the new card is charged immediately
 * rather than left for the next cron run: someone who has just fixed their
 * card expects to be a member again now, not tomorrow morning.
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { sourceId } = await req.json().catch(() => ({}));
  if (!sourceId || typeof sourceId !== "string") {
    return NextResponse.json({ error: "Card is required" }, { status: 400 });
  }

  const [user, membership] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, phone: true, preferredLang: true },
    }),
    prisma.membership.findUnique({ where: { userId } }),
  ]);

  if (!user || !membership) {
    return NextResponse.json({ error: "No membership to update" }, { status: 404 });
  }
  if (!["ARTESANO", "SELECTO", "LEGENDARIO"].includes(membership.tier)) {
    return NextResponse.json(
      { error: "This plan has no card to update" },
      { status: 400 }
    );
  }

  let squareCustomerId: string = membership.squareCustomerId ?? "";
  let cardId: string;

  try {
    // The stored customer id can be missing, or belong to a different Square
    // customer than the card — which is its own failure mode, and the reason
    // the card is always saved against a customer resolved here and now.
    if (!squareCustomerId) {
      const [givenName, ...rest] = (user.name ?? "").trim().split(/\s+/);
      squareCustomerId = await ensureSquareCustomer({
        email: user.email,
        givenName: givenName || undefined,
        familyName: rest.join(" ") || undefined,
        phone: user.phone ?? undefined,
      });
    }

    const saved = await saveCardOnFile({ customerId: squareCustomerId, sourceId });
    cardId = saved.cardId;
    // Square's answer wins: a card id stored next to the wrong customer id is
    // a renewal that fails forever with "Did not find matching card".
    squareCustomerId = saved.customerId;
  } catch (err: any) {
    const reason = err?.errors?.[0]?.detail ?? err?.message ?? "Could not save the card";
    console.error(`[membership/card] saving failed for ${user.email}:`, reason);
    return NextResponse.json({ error: reason }, { status: 402 });
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: { squareCustomerId, squareCardId: cardId },
  });

  // Nothing owed — the card is simply swapped for next time.
  const decision = renewalDecision(
    {
      tier: membership.tier,
      status: membership.status,
      renewsAt: membership.renewsAt,
      endsAt: membership.endsAt,
      hasCard: true,
    },
    new Date()
  );

  if (decision.action !== "charge") {
    return NextResponse.json({ ok: true, charged: false });
  }

  const now = new Date();
  const priceCents = tierPriceCents(membership.tier as any);

  try {
    await chargeCardOnFile({
      customerId: squareCustomerId,
      cardId,
      amountCents: priceCents,
      note: `Karyana ${membership.tier} renewal`,
      // Keyed on the card, so swapping cards is a fresh attempt rather than a
      // repeat of the charge that already failed today.
      idempotencyKey: `renewal-${membership.id}-${cardId}-${now.toISOString().slice(0, 10)}`,
    });
  } catch (err: any) {
    const reason = err?.errors?.[0]?.detail ?? err?.message ?? "Payment failed";
    console.error(`[membership/card] charge failed for ${user.email}:`, reason);
    // The card is saved, so the daily run will keep trying it. Say what
    // happened rather than pretend the problem is solved.
    return NextResponse.json({ ok: false, charged: false, error: reason }, { status: 402 });
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: {
      status: "ACTIVE",
      endsAt: null,
      cancelledAt: null,
      renewsAt: nextRenewDate(membership.tier as any, now),
      isTrial: false,
      lastRenewedAt: now,
    },
  });

  if (membership.tier === "SELECTO" || membership.tier === "LEGENDARIO") {
    await prisma.user.update({
      where: { id: userId },
      data: { pointsBalance: { increment: priceCents } },
    });
    await prisma.pointsTransaction.create({
      data: {
        userId,
        amount: priceCents,
        type: "BONUS",
        note: `${membership.tier} renewal — membership fee converted to points`,
      },
    });
  }

  syncMembershipChange({
    email: user.email,
    tier: membership.tier,
    status: "ACTIVE",
    language: user.preferredLang,
  });

  return NextResponse.json({ ok: true, charged: true });
}
