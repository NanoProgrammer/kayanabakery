import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, ORDERS_EMAIL, FROM_EMAIL } from "@/lib/email/resend";
import { weekStartOf } from "@/lib/membership/weekly";
import { createWeeklyOrder } from "@/lib/membership/weekly-order";
import { weeklyDecision } from "@/lib/membership/weekly-decision";

/**
 * Runs Thursdays, after the Wednesday 11:59PM cutoff — in time for
 * Friday delivery. Finalizes any WeeklyOrderLog still PENDING (user
 * never responded).
 *
 * Silence means send. The box is a subscription: a member who doesn't open
 * their email still expects bread on Friday, so not answering is not the same
 * as declining. Only two things stop it — clicking skip in the email, or
 * choosing a mode / setting that says otherwise:
 *   - MANUAL mode            -> always skip (that mode exists to require a yes)
 *   - auto-delivery OFF      -> skip (the member deliberately opted out)
 *   - REPEAT_LAST / CURATED  -> send
 * No credits/points are granted on skip — the membership fee already
 * converts to points at payment time, so skipping does not double-pay.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekStart = weekStartOf(new Date());

  const pending = await prisma.weeklyOrderLog.findMany({
    where: { status: "PENDING", weekStart },
    include: { membership: { include: { user: { select: { email: true, name: true } } } } },
  });

  const results = { autoSkipped: 0, autoSent: 0, curatedQueued: 0, failed: 0, errors: [] as string[] };

  for (const log of pending) {
    const membership = log.membership;
    try {
      const decision = weeklyDecision({
        modeSnapshot: log.modeSnapshot as never,
        autoDeliveryEnabled: membership.autoDeliveryEnabled,
        hasCardOnFile: Boolean(membership.squareCustomerId && membership.squareCardId),
      });

      if (decision.action === "skip") {
        await prisma.weeklyOrderLog.update({
          where: { id: log.id },
          data: {
            status: "SKIPPED",
            decidedBy: "DEFAULT",
            decidedAt: new Date(),
            failureNote: decision.reason,
          },
        });
        results.autoSkipped++;
        continue;
      }

      if (decision.action === "fail") {
        await prisma.weeklyOrderLog.update({
          where: { id: log.id },
          data: {
            status: "FAILED",
            decidedBy: "DEFAULT",
            decidedAt: new Date(),
            failureNote: decision.reason,
          },
        });
        results.failed++;
        continue;
      }

      if (decision.action === "queue-for-staff") {
        await prisma.weeklyOrderLog.update({
          where: { id: log.id },
          data: { status: "CONFIRMED", decidedBy: "DEFAULT", decidedAt: new Date() },
        });
        await resend.emails.send({
          from: FROM_EMAIL,
          to: ORDERS_EMAIL,
          subject: `[Weekly Box] Curate & charge for ${membership.user?.name ?? membership.userId}`,
          html: `<p>The customer didn't respond by cutoff — please prepare their Curated Surprise Box and charge manually.</p><p>Membership ID: ${membership.id}<br/>User: ${membership.user?.email ?? membership.userId}</p>`,
        });
        results.curatedQueued++;
        continue;
      }

      // decision.action === "send". The card is non-null here because
      // weeklyDecision returns "fail" when it isn't — asserted rather than
      // re-checked so the two can't drift apart into different answers.
      const result = await createWeeklyOrder({
        userId: log.userId,
        tier: membership.tier as any,
        squareCustomerId: membership.squareCustomerId!,
        squareCardId: membership.squareCardId!,
      });

      if ("error" in result) {
        await prisma.weeklyOrderLog.update({
          where: { id: log.id },
          data: { status: "FAILED", decidedBy: "DEFAULT", decidedAt: new Date(), failureNote: result.error },
        });
        results.failed++;
        continue;
      }

      await prisma.weeklyOrderLog.update({
        where: { id: log.id },
        data: { status: "CONFIRMED", decidedBy: "DEFAULT", decidedAt: new Date(), orderId: result.orderId },
      });
      results.autoSent++;
    } catch (err: any) {
      console.error(`[cron] weekly-box-process failed for log ${log.id}:`, err.message);
      results.errors.push(`${log.id}: ${err.message}`);
    }
  }

  console.log("[cron] weekly-box-process results:", results);
  return NextResponse.json(results);
}
