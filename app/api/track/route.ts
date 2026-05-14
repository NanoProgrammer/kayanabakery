import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STATUS_LABEL: Record<string, { en: string; es: string }> = {
  PENDING: { en: "Order received", es: "Orden recibida" },
  CONFIRMED: { en: "Order confirmed", es: "Orden confirmada" },
  IN_PROGRESS: { en: "In preparation", es: "En preparación" },
  READY: { en: "Ready!", es: "¡Lista!" },
  OUT_FOR_DELIVERY: { en: "On its way", es: "En camino" },
  COMPLETED: { en: "Delivered", es: "Entregada" },
  CANCELLED: { en: "Cancelled", es: "Cancelada" },
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderNumber = url.searchParams.get("orderNumber");
  const email = url.searchParams.get("email");

  if (!orderNumber || !email) {
    return NextResponse.json(
      { error: "Missing params" },
      { status: 400 }
    );
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber: orderNumber.toUpperCase().trim(),
      OR: [
        { user: { email: email.toLowerCase().trim() } },
        { guestEmail: email.toLowerCase().trim() },
      ],
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      total: true,
      items: true,
      fulfillmentType: true,
      pickupDate: true,
      pickupTime: true,
      createdAt: true,
      inProgressAt: true,
      readyAt: true,
      outForDeliveryAt: true,
      completedAt: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      ...order,
      statusLabel: STATUS_LABEL[order.status] ?? { en: order.status, es: order.status },
    },
  });
}