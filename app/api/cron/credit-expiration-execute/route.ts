import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Runs daily. On February 1st, if an admin set a policy for this year
 * (Section 15 of the spec) and it hasn't executed yet, forfeits or
 * flags-for-donation every customer's unused points balance.
 *
 * Safety: nothing happens unless a CreditExpirationPolicy row exists
 * for the current year AND executedAt is still null. An admin who
 * never visits /admin/credits never triggers this.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  if (now.getMonth() !== 1 || now.getDate() !== 1) {
    return NextResponse.json({ skipped: true, reason: "Not February 1st" });
  }

  const year = now.getFullYear();
  const policy = await prisma.creditExpirationPolicy.findUnique({ where: { year } });
  if (!policy || policy.executedAt) {
    return NextResponse.json({ skipped: true, reason: "No pending policy for this year" });
  }

  const usersWithBalance = await prisma.user.findMany({
    where: { pointsBalance: { gt: 0 } },
    select: { id: true, pointsBalance: true },
  });

  let totalCents = 0;

  for (const u of usersWithBalance) {
    totalCents += u.pointsBalance;
    await prisma.$transaction([
      prisma.user.update({ where: { id: u.id }, data: { pointsBalance: 0 } }),
      prisma.pointsTransaction.create({
        data: {
          userId: u.id,
          amount: -u.pointsBalance,
          type: "REDEMPTION",
          note:
            policy.mode === "FORFEIT"
              ? `Annual credit expiration ${year} — forfeited`
              : `Annual credit expiration ${year} — converted to gift card donation`,
        },
      }),
    ]);
  }

  await prisma.creditExpirationPolicy.update({
    where: { year },
    data: {
      executedAt: now,
      totalCreditsProcessedCents: totalCents,
      usersAffected: usersWithBalance.length,
    },
  });

  return NextResponse.json({
    mode: policy.mode,
    usersAffected: usersWithBalance.length,
    totalCreditsProcessedCents: totalCents,
  });
}
