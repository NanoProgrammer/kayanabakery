/**
 * When a cake can be picked up or delivered.
 *
 * Cakes do not follow the bakery's ordinary slots. They come out of the
 * kitchen through the day, so they are offered on their own two-hourly
 * schedule from 11 AM, with 8 PM the last handover of the day.
 *
 * And they need notice. A member's notice is Karyana's table
 * (lib/products/cake-lead-times.ts); someone ordering without an account
 * waits a flat 24 hours, which is the thing a membership most visibly buys
 * and so is worth saying at the checkout rather than hiding in a FAQ.
 *
 * All times are America/Edmonton, like the rest of the schedule.
 */
import type { LeadTimeAudience } from "@/lib/products/cake-lead-times";
import { leadTimeHours, leadTimeFor } from "@/lib/products/cake-lead-times";

/** Every handover time offered for a cake, in 24-hour local time. */
export const CAKE_SLOT_HOURS = [11, 13, 15, 17, 19, 20];

/** The last handover of the day. Nothing is offered after it. */
export const CAKE_LAST_HOUR = 20;

/** What someone with no account waits, whatever the cake is. */
export const GUEST_CAKE_NOTICE_HOURS = 24;

export type CakeSlot = {
  /** Local hour, 24-hour clock. */
  hour: number;
  /** The day, as YYYY-MM-DD in bakery time. */
  day: string;
  /** Exact moment the handover happens. */
  at: Date;
};

const TZ = "America/Edmonton";

/** YYYY-MM-DD in bakery time, whatever the server's own clock is set to. */
export function bakeryDay(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** The bakery-local hour of a moment. */
export function bakeryHour(date: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hour: "2-digit", hour12: false }).format(date)
  );
}

/**
 * The notice this order needs: the slowest cake in it, by the customer's
 * tier. Someone with no account waits 24 hours regardless — and never less
 * than the cake itself needs, so the guest rule can only ever add time.
 */
export function noticeHoursFor(
  cakeNames: readonly string[],
  audience: LeadTimeAudience | "GUEST",
  isSignedIn: boolean
): number {
  // The guest wait is a rule about CAKES. Applied to any order it would make
  // a bag of conchas wait a day because the customer has no account, and
  // would put the "join and get it sooner" line on a cart with no cake in
  // it. So it only bites when the order actually contains one.
  const hasCake = cakeNames.some((name) => leadTimeFor(name) !== null);
  if (!hasCake) return 0;

  const fromTable = cakeNames.reduce((max, name) => {
    const hours = leadTimeHours(name, audience as LeadTimeAudience) ?? 0;
    return Math.max(max, hours);
  }, 0);
  if (!isSignedIn) return Math.max(fromTable, GUEST_CAKE_NOTICE_HOURS);
  return fromTable;
}

/**
 * The slots a cake order can actually be given, soonest first.
 *
 * `now` plus the notice is the earliest moment; anything before it is not
 * offered. A slot exactly at that moment is allowed — the notice is a
 * minimum, not a gap to clear.
 */
export function cakeSlots({
  now,
  noticeHours,
  days = 14,
}: {
  now: Date;
  noticeHours: number;
  days?: number;
}): CakeSlot[] {
  const earliest = new Date(now.getTime() + Math.max(0, noticeHours) * 3600_000);
  const slots: CakeSlot[] = [];

  for (let dayOffset = 0; dayOffset <= days; dayOffset++) {
    const dayStart = new Date(now.getTime() + dayOffset * 86_400_000);
    const day = bakeryDay(dayStart);
    for (const hour of CAKE_SLOT_HOURS) {
      const at = atBakeryHour(day, hour);
      if (at.getTime() < earliest.getTime()) continue;
      slots.push({ hour, day, at });
    }
  }
  return slots.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/**
 * A Date for a given bakery-local day and hour. Built by searching the
 * offset rather than assuming one, because Alberta changes offset twice a
 * year and a hard-coded -07:00 silently moves every slot by an hour for half
 * of it.
 */
export function atBakeryHour(day: string, hour: number): Date {
  const [y, m, d] = day.split("-").map(Number);
  for (const offset of [6, 7]) {
    const candidate = new Date(Date.UTC(y, m - 1, d, hour + offset, 0, 0, 0));
    if (bakeryDay(candidate) === day && bakeryHour(candidate) === hour) {
      return candidate;
    }
  }
  // Neither offset lands on it (the hour does not exist, which happens once a
  // year when the clocks go forward). Fall back to the standard offset rather
  // than returning nothing.
  return new Date(Date.UTC(y, m - 1, d, hour + 7, 0, 0, 0));
}

/** "11:00 AM" / "8:00 PM" — how the slot is labelled. */
export function formatSlotHour(hour: number, locale: string): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return locale === "es" ? `${h12}:00 ${suffix}` : `${h12}:00 ${suffix}`;
}

/**
 * What a guest is missing, for the line that offers them a membership at the
 * checkout. Null when they are already getting the best time available —
 * there is nothing to sell them and the line should not appear.
 */
export function membershipSaving(
  cakeNames: readonly string[],
  tierIfTheyJoined: LeadTimeAudience
): { guestHours: number; memberHours: number; hoursSaved: number } | null {
  const guestHours = noticeHoursFor(cakeNames, "GUEST", false);
  const memberHours = noticeHoursFor(cakeNames, tierIfTheyJoined, true);
  const hoursSaved = guestHours - memberHours;
  if (hoursSaved <= 0) return null;
  return { guestHours, memberHours, hoursSaved };
}
