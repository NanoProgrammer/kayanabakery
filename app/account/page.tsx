import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPriceFromCents } from "@/lib/utils";
import { format } from "date-fns";

export default async function AccountPage() {
  const session = await auth();
  const userId = (session!.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 3 },
      _count: { select: { orders: true, referrals: true, addresses: true } },
    },
  });

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Total orders" value={user._count.orders} />
        <Stat
          label="Referral credit"
          value={formatPriceFromCents(user.referralCredit)}
        />
        <Stat label="Friends referred" value={user._count.referrals} />
      </div>

      <div className="rounded-3xl border border-canela/15 bg-masa/30 p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">Recent orders</h2>
          <Link
            href="/account/orders"
            className="text-sm text-canela hover:underline"
          >
            View all
          </Link>
        </div>
        {user.orders.length === 0 ? (
          <p className="mt-4 text-sm text-ink/60">
            You haven&apos;t placed any orders yet.{" "}
            <Link href="/shop" className="text-canela hover:underline">
              Start shopping
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-canela/10">
            {user.orders.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between py-4"
              >
                <div>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="font-mono text-sm text-ink hover:text-canela"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="text-xs text-ink/60">
                    {format(order.createdAt, "MMM d, yyyy")} ·{" "}
                    {order.status.toLowerCase()}
                  </p>
                </div>
                <span className="font-display text-base text-canela">
                  {formatPriceFromCents(order.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <QuickLink
          href="/account/addresses"
          title="Saved addresses"
          count={user._count.addresses}
          cta="Manage"
        />
        <QuickLink
          href="/account/preferences"
          title="Preferences"
          description="Notifications, dietary, language"
          cta="Update"
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-canela/15 bg-masa/30 p-6">
      <div className="text-xs uppercase tracking-widest text-ink/50">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl text-canela">{value}</div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
  count,
  cta,
}: {
  href: string;
  title: string;
  description?: string;
  count?: number;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-canela/15 bg-masa/30 p-6 transition-colors hover:bg-masa/60"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg text-ink">{title}</h3>
          <p className="mt-1 text-xs text-ink/60">
            {count !== undefined ? `${count} saved` : description}
          </p>
        </div>
        <span className="text-sm font-medium text-canela">{cta} →</span>
      </div>
    </Link>
  );
}
