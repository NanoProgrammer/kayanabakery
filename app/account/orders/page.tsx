import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { OrderRow } from "@/components/account/OrderRow";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await auth();
  const userId = (session?.user as any).id;

  const raw = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      fulfillmentType: true,
      total: true,
      items: true,
      createdAt: true,
      pickupDate: true,
      pickupTime: true,
    },
  });

  const orders = raw.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    fulfillmentType: o.fulfillmentType,
    total: o.total,
    itemCount: Array.isArray(o.items) ? (o.items as any[]).length : 0,
    createdAt: o.createdAt.toISOString(),
    pickupDate: o.pickupDate?.toISOString() ?? null,
    pickupTime: o.pickupTime ?? null,
  }));

  return (
    <div>
      <h1 className="font-display text-3xl">My orders</h1>
      <div className="mt-8">
        <OrderRow orders={orders} />
      </div>
    </div>
  );
}