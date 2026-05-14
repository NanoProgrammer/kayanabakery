import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Coins, Package, Truck, Crown } from "lucide-react";
import { formatCents } from "@/lib/checkout/pricing";
import { TIERS } from "@/lib/membership/tiers";

export default async function OverviewPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const [user, recentOrders, pointsHistory] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        membership: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.pointsTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  if (!user) redirect("/login");

  const tier =
    user.membership?.status === "ACTIVE" ? user.membership.tier : "BASICO";
  const tierData = TIERS[tier as keyof typeof TIERS];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={Coins}
          color="text-gold"
          label="Points"
          value={user.pointsBalance.toLocaleString()}
          sub={`= ${formatCents(user.pointsBalance, "en")}`}
        />
        <Stat
          icon={Package}
          color="text-canela-dark"
          label="Total orders"
          value={user._count.orders.toString()}
        />
        <Stat
          icon={Crown}
          color="text-gold"
          label="Plan"
          value={tierData.name}
          sub={`${tierData.pointsMultiplier}x points`}
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Recent orders</h2>
          <Link
            href="/account/orders"
            className="text-sm text-canela-dark underline"
          >
            See all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="rounded-2xl border border-canela/15 bg-cream p-8 text-center text-sm text-ink-soft">
            No orders yet.{" "}
            <Link href="/shop" className="text-canela-dark underline">
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {recentOrders.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-canela/15 bg-cream p-4"
              >
                <div className="flex items-center gap-3">
                  <Truck className="h-4 w-4 text-ink-soft" />
                  <div>
                    <Link
                      href={`/account/orders/${o.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                    <p className="text-xs text-ink-soft">
                      {new Date(o.createdAt).toLocaleDateString("en-CA")} ·{" "}
                      {o.status}
                    </p>
                  </div>
                </div>
                <p className="font-bold">{formatCents(o.total, "en")}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl">Points activity</h2>
        {pointsHistory.length === 0 ? (
          <p className="text-sm text-ink-soft">No activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {pointsHistory.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-2xl bg-cream p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{t.note ?? t.type}</p>
                  <p className="text-xs text-ink-soft">
                    {new Date(t.createdAt).toLocaleDateString("en-CA")}
                  </p>
                </div>
                <span
                  className={
                    t.amount > 0 ? "font-bold text-canela-dark" : "text-ink-soft"
                  }
                >
                  {t.amount > 0 ? "+" : ""}
                  {t.amount} pts
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  color,
  label,
  value,
  sub,
}: {
  icon: any;
  color: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-canela/15 bg-cream p-5">
      <Icon className={`h-5 w-5 ${color}`} />
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-ink-soft">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl">{value}</p>
      {sub && <p className="text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}
