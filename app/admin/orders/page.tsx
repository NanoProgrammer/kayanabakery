import { prisma } from "@/lib/prisma";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { orderDeliveryAddress } from "@/lib/orders/delivery-address";

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
        // From the copy kept on the order, so the list keeps showing where a
        // past delivery went even after the customer edits or deletes that
        // saved address.
        addressLine: (() => {
          const d = orderDeliveryAddress(o as any);
          return d ? [d.street, d.postalCode].filter(Boolean).join(", ") : null;
        })(),
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
