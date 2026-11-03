/**
 * Deciding who to ask for a review, and when.
 *
 * The ask used to ride along with the "your order is complete" message, which
 * arrives while the customer is still in the shop or just back in the car —
 * the worst possible moment to ask someone to write something. It goes out the
 * middle of the day after instead, once they have actually eaten the bread.
 *
 * Which means it cannot be inferred from the order's status: by the time it is
 * due, the order has looked completed for hours. It needs its own record of
 * having been asked, which is what reviewRequestedAt is.
 */
import { bakeryDateString } from "@/lib/time/edmonton";

/**
 * How far back a first run reaches.
 *
 * Without a limit, turning this on messages every customer who ever completed
 * an order — months of people, at once, asking about bread they have long
 * forgotten. The printer queue learned this the same way.
 */
export const OLDEST_DAYS = 3;

export type ReviewCandidate = {
  status: string;
  completedAt: Date | null;
  reviewRequestedAt: Date | null;
  /** Something to reach them on. Neither means there is nothing to send. */
  hasEmail: boolean;
  hasPhone: boolean;
};

export type ReviewDecision =
  | { ask: true }
  | { ask: false; reason: string };

export function dueForReview(
  order: ReviewCandidate,
  now: Date = new Date()
): ReviewDecision {
  if (order.status !== "COMPLETED") {
    return { ask: false, reason: `order is ${order.status}` };
  }
  if (order.reviewRequestedAt) {
    return { ask: false, reason: "already asked" };
  }
  if (!order.completedAt) {
    return { ask: false, reason: "no completion time to count from" };
  }
  if (!order.hasEmail && !order.hasPhone) {
    return { ask: false, reason: "no email or phone" };
  }

  // Compared as bakery calendar days, not as a span of hours: "the day after"
  // is what was asked for, and an order completed at 11 PM should be asked
  // about at midday — not at 11 PM the following night.
  const completedDay = bakeryDateString(order.completedAt);
  const today = bakeryDateString(now);

  if (completedDay >= today) {
    return { ask: false, reason: "completed today — ask tomorrow" };
  }

  const ageDays = daysBetween(completedDay, today);
  if (ageDays > OLDEST_DAYS) {
    return { ask: false, reason: `completed ${ageDays} days ago — too old to ask` };
  }

  return { ask: true };
}

/** Whole days between two YYYY-MM-DD strings. */
function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

function toUtc(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  // Date.UTC counts months from zero. Leaving the correction out does not
  // cancel between the two dates the way it looks like it should: it shifts
  // each one into a month of a different length, so October 27 to November 3
  // came out as six days instead of seven.
  return Date.UTC(y, m - 1, d);
}
