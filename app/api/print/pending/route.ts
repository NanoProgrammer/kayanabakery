import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeClient as sanityClient } from "@/sanity/lib/client";
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

  // Orders typed into Studio by hand — phone and walk-in — never reach Prisma,
  // so a queue built only from the database left the kitchen's own orders to be
  // printed from a browser by hand. They carry their own printedAt and are
  // addressed with a "sanity:" prefix the agent just passes back.
  type QueueEntry = {
    id: string;
    orderNumber: string;
    customerName: string;
    fulfillmentType: string;
    when: string | null;
    createdAt: string;
    source: "checkout" | "studio";
    pdfUrl: string;
    ackUrl: string;
  };

  let manual: QueueEntry[] = [];
  try {
    const docs = await sanityClient.fetch<any[]>(
      `*[_type == "order" && !defined(prismaId) && !defined(printedAt)
          && defined(createdAt) && createdAt >= $since]
         | order(createdAt asc) [0...25] {
           _id, orderNumber, customerName, fulfillmentType, pickupDate, createdAt
         }`,
      { since: since.toISOString() }
    );

    manual = (docs ?? []).map((d) => ({
      id: `sanity:${d._id}`,
      orderNumber: d.orderNumber ?? "(no number)",
      customerName: d.customerName ?? "Customer",
      fulfillmentType: d.fulfillmentType ?? "PICKUP",
      when: d.pickupDate ?? null,
      createdAt: d.createdAt,
      source: "studio",
      pdfUrl: `/api/print/${encodeURIComponent(`sanity:${d._id}`)}/pdf`,
      ackUrl: `/api/print/${encodeURIComponent(`sanity:${d._id}`)}/ack`,
    }));
  } catch (err) {
    // Studio being unreachable must not take the checkout queue down with it —
    // the kitchen still needs the orders the database knows about.
    console.error(
      "[print] could not read manual Studio orders:",
      err instanceof Error ? err.message : err
    );
  }

  const fromCheckout: QueueEntry[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.user?.name ?? o.guestName ?? "Customer",
    fulfillmentType: o.fulfillmentType,
    when: o.pickupDate?.toISOString() ?? o.pickupTime ?? null,
    createdAt: o.createdAt.toISOString(),
    source: "checkout",
    pdfUrl: `/api/print/${o.id}/pdf`,
    ackUrl: `/api/print/${o.id}/ack`,
  }));

  // Oldest first across both, so the kitchen prints in the order things came in.
  const all = [...fromCheckout, ...manual].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );

  return NextResponse.json({
    count: all.length,
    // Echoed so an empty queue can be told apart from a cutoff set too late.
    since: since.toISOString(),
    configured: Boolean(process.env.PRINT_SINCE),
    orders: all,
  });
}
