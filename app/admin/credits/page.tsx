import { prisma } from "@/lib/prisma";
import { CreditPolicyManager } from "@/components/admin/CreditPolicyManager";

export const dynamic = "force-dynamic";

export default async function AdminCreditsPage() {
  const policies = await prisma.creditExpirationPolicy.findMany({
    orderBy: { year: "desc" },
    take: 10,
  });

  const totalPointsOutstanding = await prisma.user.aggregate({
    _sum: { pointsBalance: true },
    _count: { _all: true },
  });

  const usersWithBalance = await prisma.user.count({
    where: { pointsBalance: { gt: 0 } },
  });

  return (
    <div>
      <h1 className="font-display text-3xl">Annual Credit Expiration Policy</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Decided once per year on Dec 2, executed Feb 1. Applies to every
        customer&apos;s points balance (order rewards + membership fee
        conversions are the same balance in this system).
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-canela/15 bg-cream p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">
            Total points outstanding
          </p>
          <p className="mt-1 font-display text-2xl">
            {(totalPointsOutstanding._sum.pointsBalance ?? 0).toLocaleString()} pts
            <span className="ml-2 text-sm text-ink-soft">
              (${((totalPointsOutstanding._sum.pointsBalance ?? 0) / 100).toFixed(2)})
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-canela/15 bg-cream p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">
            Customers with a balance
          </p>
          <p className="mt-1 font-display text-2xl">{usersWithBalance}</p>
        </div>
      </div>

      <CreditPolicyManager
        policies={policies.map((p) => ({
          year: p.year,
          mode: p.mode,
          decidedAt: p.decidedAt.toISOString(),
          executedAt: p.executedAt?.toISOString() ?? null,
          totalCreditsProcessedCents: p.totalCreditsProcessedCents,
          usersAffected: p.usersAffected,
        }))}
      />
    </div>
  );
}
