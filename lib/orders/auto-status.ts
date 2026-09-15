import {
  bakeryHourOnSameDay,
  parsePickupWindowStart,
  bakeryDateString,
} from "@/lib/time/edmonton";

/**
 * Decides what status an order should be in right now, purely from its own
 * data. Kept free of Prisma and Twilio so the rules can be tested directly,
 * and so a run is idempotent: the answer depends on the clock, not on how
 * often the cron fires or whether the last run finished.
 */

export const PREP_DELAY_MS = 60 * 60 * 1000; // 1h after ordering → in preparation
export const READY_LEAD_MS = 60 * 60 * 1000; // 1h before the window → ready
export const OUT_DELAY_MS = 15 * 60 * 1000; // 15min into the window → out for delivery
export const CLOSING_HOUR = 23; // 11 PM Calgary → close out whatever is left

/** Orders only move forward, so a re-run can't walk a status backwards. */
export const STATUS_RANK: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  IN_PROGRESS: 2,
  READY: 3,
  OUT_FOR_DELIVERY: 4,
  COMPLETED: 5,
};

export type AutomatableOrder = {
  status: string;
  fulfillmentType: string;
  createdAt: Date;
  pickupDate: Date | null;
  pickupTime: string | null;
  deliverySlot: { startTime: Date } | null;
};

/**
 * When the customer expects the order: the delivery window's start, or the
 * start of the chosen pickup window. Null when an order carries no usable
 * schedule — those only ever get the "in preparation" bump, never an
 * automatic ready or completed, since there's no time to anchor them to.
 */
export function fulfillmentStart(order: AutomatableOrder): Date | null {
  if (order.deliverySlot?.startTime) return order.deliverySlot.startTime;
  if (!order.pickupDate) return null;
  return parsePickupWindowStart(
    bakeryDateString(order.pickupDate),
    order.pickupTime
  );
}

export function targetStatus(
  order: AutomatableOrder,
  now: Date
): string | null {
  const start = fulfillmentStart(order);

  if (start) {
    // Anything still open at 11 PM on the fulfillment day is closed out.
    if (now >= bakeryHourOnSameDay(start, CLOSING_HOUR)) return "COMPLETED";

    // "Out for delivery" is meaningless for pickup — those wait at the counter.
    if (
      order.fulfillmentType === "DELIVERY" &&
      now.getTime() >= start.getTime() + OUT_DELAY_MS
    ) {
      return "OUT_FOR_DELIVERY";
    }

    if (now.getTime() >= start.getTime() - READY_LEAD_MS) return "READY";
  }

  if (now.getTime() >= order.createdAt.getTime() + PREP_DELAY_MS) {
    return "IN_PROGRESS";
  }

  return null;
}

/** The status to move to, or null when the order is already at or past it. */
export function nextStatus(
  order: AutomatableOrder,
  now: Date
): string | null {
  const target = targetStatus(order, now);
  if (!target) return null;
  if (STATUS_RANK[target] <= STATUS_RANK[order.status]) return null;
  return target;
}
