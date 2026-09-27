import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { printerAuthorized, printerUnauthorized } from "../_auth";

export const dynamic = "force-dynamic";

/** Orders created before this are history and are never queued. */
const FALLBACK_WINDOW_DAYS = 7;

/**
 * The cutoff: nothing older than this is ever offered to the printer.
 *
 * printedAt starts null on every row that already existed, so without a floor
 * the queue is the entire order history — switching the printer on would print
 * every ticket since the bakery opened. Set PRINT_SINCE to the day the printer
 * goes live and that whole backlog simply isn't queued, rather than being
 * marked as printed when it never was.
 *
 * Unset falls back to a week, which is a guard rather than an answer: it stops
 * the flood, but an agent offline longer than that would miss real tickets.
 * The value used is returned with every response so it's visible either way.
 */
function printSince(): Date {
  const raw = process.env.PRINT_SINCE;
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    console.warn(`[print] PRINT_SINCE is not a valid date: ${raw} — using the ${FALLBACK_WINDOW_DAYS}-day fallback`);
  }
  return new Date(Date.now() - FALLBACK_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

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

  const since = printSince();

  const orders = await prisma.order.findMany({
    where: {
      printedAt: null,
      paymentStatus: "PAID",
      status: { notIn: ["CANCELLED"] },
      createdAt: { gte: since },
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
    // Echoed so an empty queue can be told apart from a cutoff set too late.
    since: since.toISOString(),
    configured: Boolean(process.env.PRINT_SINCE),
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
