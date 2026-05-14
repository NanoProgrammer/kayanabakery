import { prisma } from "@/lib/prisma";
import { DeliveriesTable } from "@/components/admin/DeliveriesTable";

export const dynamic = "force-dynamic";

export default async function AdminDeliveriesPage() {
  const deliveries = await prisma.ambassadorDelivery.findMany({
    where: {
      status: { in: ["DELIVERED", "PAID"] },
    },
    orderBy: [{ paidAt: "asc" }, { deliveredAt: "desc" }],
    take: 100,
    include: {
      ambassador: { select: { name: true, email: true } },
      order: { select: { orderNumber: true, total: true } },
    },
  });

  return (
    <div>
      <header className="mb-6">
        <h2 className="font-display text-2xl">Ambassador deliveries</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Mark deliveries as paid after sending Square payouts.
        </p>
      </header>
      <DeliveriesTable
        deliveries={deliveries.map((d) => ({
          id: d.id,
          status: d.status,
          payoutCents: d.payoutCents,
          ambassadorName: d.ambassador.name ?? d.ambassador.email,
          orderNumber: d.order.orderNumber,
          orderTotal: d.order.total,
          deliveredAt: d.deliveredAt?.toISOString() ?? null,
          paidAt: d.paidAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
