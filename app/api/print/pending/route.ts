import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { printerAuthorized, printerUnauthorized } from "../_auth";

export const dynamic = "force-dynamic";

/**
 * What the kitchen printer still has to print.
 *
 * Only paid orders: an unpaid one can still fail or be abandoned, and paper is
 * the one thing you cannot un-print. Cancelled orders are excluded for the same
 * reason. printedAt is what keeps the agent from reprinting everything after a
 * restart — it asks for what's pending, not for everything.
 */
export async function GET(req: Request) {
  if (!printerAuthorized(req)) return printerUnauthorized();

  const orders = await prisma.order.findMany({
    where: {
      printedAt: null,
      paymentStatus: "PAID",
      status: { notIn: ["CANCELLED"] },
    },
    orderBy: { createdAt: "asc" },
    take: 25,
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
      fulfillmentType: true,
      pickupDate: true,
      pickupTime: true,
      guestName: true,
      user: { select: { name: true } },
    },
  });

  return NextResponse.json({
    count: orders.length,
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.user?.name ?? o.guestName ?? "Customer",
      fulfillmentType: o.fulfillmentType,
      when: o.pickupDate ?? o.pickupTime ?? null,
      createdAt: o.createdAt.toISOString(),
      pdfUrl: `/api/print/${o.id}/pdf`,
      ackUrl: `/api/print/${o.id}/ack`,
    })),
  });
}
