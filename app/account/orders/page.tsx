import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPriceFromCents } from "@/lib/utils";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  PENDING: "bg-otomi-yellow/30 text-ink",
  CONFIRMED: "bg-otomi-teal/30 text-ink",
  IN_PROGRESS: "bg-otomi-orange/30 text-ink",
  READY: "bg-otomi-green/30 text-ink",
  COMPLETED: "bg-canela/20 text-canela",
  CANCELLED: "bg-ink/10 text-ink/60",
};

export default async function OrdersPage() {
  const session = await auth();
  const userId = (session!.user as any).id;

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="mb-8 font-display text-3xl text-ink">Your orders</h2>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-canela/15 bg-masa/30 p-10 text-center">
          <p className="text-ink/60">No orders yet.</p>
          <Link href="/shop" className="btn-primary mt-4 inline-flex">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/account/orders/${o.id}`}
              className="flex items-center justify-between rounded-2xl border border-canela/15 bg-masa/30 p-5 transition-colors hover:bg-masa/60"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-ink">
                    {o.orderNumber}
                  </span>
                  <span
                    className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                      statusColors[o.status] || "bg-ink/10 text-ink"
                    }`}
                  >
                    {o.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink/60">
                  {format(o.createdAt, "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              <span className="font-display text-lg text-canela">
                {formatPriceFromCents(o.total)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
