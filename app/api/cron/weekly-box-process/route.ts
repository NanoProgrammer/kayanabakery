import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, ORDERS_EMAIL, FROM_EMAIL } from "@/lib/email/resend";
import { weekStartOf } from "@/lib/membership/weekly";
import { createWeeklyOrder } from "@/lib/membership/weekly-order";

/**
 * Runs after the Thursday 11:59PM cutoff (e.g. Friday 00:15 local).
 * Finalizes any WeeklyOrderLog still PENDING (user never responded)
 * by applying that membership's default behavior:
 *   - MANUAL mode            -> always auto-skip
 *   - REPEAT_LAST / CURATED  -> auto-send if autoDeliveryEnabled, else auto-skip
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
      if (log.modeSnapshot === "MANUAL") {
        await prisma.weeklyOrderLog.update({
          where: { id: log.id },
          data: { status: "SKIPPED", decidedBy: "DEFAULT", decidedAt: new Date() },
        });
        results.autoSkipped++;
        continue;
      }

      if (!membership.autoDeliveryEnabled) {
        await prisma.weeklyOrderLog.update({
          where: { id: log.id },
          data: { status: "SKIPPED", decidedBy: "DEFAULT", decidedAt: new Date() },
        });
        results.autoSkipped++;
        continue;
      }

      if (log.modeSnapshot === "CURATED") {
        // Curated boxes need a human to pick contents — flag for staff instead
        // of auto-charging for an undefined cart.
        await prisma.weeklyOrderLog.update({
          where: { id: log.id },
          data: { status: "CONFIRMED", decidedBy: "DEFAULT", decidedAt: new Date() },
        });
        await resend.emails.send({
          from: FROM_EMAIL,
          to: ORDERS_EMAIL,
          subject: `[Weekly Box] Curate & charge for ${membership.user?.name ?? membership.userId}`,
          html: `<p>Auto-delivery is ON and the customer didn't respond by cutoff — please prepare their Curated Surprise Box and charge manually.</p><p>Membership ID: ${membership.id}<br/>User: ${membership.user?.email ?? membership.userId}</p>`,
        });
        results.curatedQueued++;
        continue;
      }

      // REPEAT_LAST + auto-delivery ON + no response -> auto-charge and create the order
      if (!membership.squareCustomerId || !membership.squareCardId) {
        await prisma.weeklyOrderLog.update({
          where: { id: log.id },
          data: { status: "FAILED", decidedBy: "DEFAULT", decidedAt: new Date(), failureNote: "No card on file" },
        });
        results.failed++;
        continue;
      }

      const result = await createWeeklyOrder({
        userId: log.userId,
        tier: membership.tier as any,
        squareCustomerId: membership.squareCustomerId,
        squareCardId: membership.squareCardId,
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
