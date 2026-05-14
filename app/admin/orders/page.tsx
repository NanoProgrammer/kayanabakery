import { prisma } from "@/lib/prisma";
import { OrdersTable } from "@/components/admin/OrdersTable";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const orders = await prisma.order.findMany({
    where: status ? { status: status as any } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      address: { select: { street: true, city: true, postalCode: true } },
      deliverySlot: true,
    },
  });

  return (
    <OrdersTable
      orders={orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        fulfillmentType: o.fulfillmentType,
        customerName: o.user?.name ?? o.guestName ?? "Guest",
        customerEmail: o.user?.email ?? o.guestEmail ?? "",
        addressLine: o.address
          ? `${o.address.street}, ${o.address.postalCode}`
          : null,
        slotLabel: o.deliverySlot
          ? o.deliverySlot.startTime.toISOString()
          : o.pickupDate
          ? `${o.pickupDate.toISOString()} ${o.pickupTime ?? ""}`
          : "",
        createdAt: o.createdAt.toISOString(),
        itemCount: ((o.items as any[]) || []).reduce(
          (s, it) => s + it.quantity,
          0
        ),
      }))}
      activeStatus={status ?? null}
    />
  );
}
