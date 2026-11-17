/**
 * Refusing an order the kitchen cannot make in time.
 *
 * An order came in for a 4:00–6:00 PM pickup on the same day, for items that
 * need hours of notice. Two things let it through:
 *
 *   1. The picker compared the lead time against the window's END, not its
 *      start — `if (windowEnd <= earliest) continue`. With four hours'
 *      notice at 1 PM the earliest is 5 PM, and a 4–6 PM window survives
 *      that test because it finishes at 6. The customer then collects at 4.
 *
 *   2. Nothing checked it on the server at all. The browser was the only
 *      guard, so a page left open, a stale cache or a direct request walked
 *      straight past it.
 *
 * This module is the check, and the checkout route applies it before taking
 * payment. The window is derived from the date here rather than read from
 * the label the browser sent, because that label is exactly what an order
 * built by hand would lie about.
 *
 * All times are America/Edmonton, like the rest of the schedule.
 */
const TZ = "America/Edmonton";

/** The pickup window for a given day. Sunday is early; the shop shuts Mon-Sat at 6. */
export type PickupWindow = { startHour: number; endHour: number };

export function pickupWindowFor(dateStr: string): PickupWindow | null {
  const dow = dayOfWeek(dateStr);
  if (dow === null) return null;
  if (dow === 0) return { startHour: 13, endHour: 15 };
  return { startHour: 16, endHour: 18 };
}

/** 0 = Sunday … 6 = Saturday, for a YYYY-MM-DD in bakery time. */
export function dayOfWeek(dateStr: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const at = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  if (Number.isNaN(at.getTime())) return null;
  return at.getUTCDay();
}

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

export function bakeryHour(date: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hour: "2-digit", hour12: false }).format(date)
  );
}

/**
 * A Date for a bakery-local day and hour, found by trying the offsets rather
 * than assuming one. Alberta changes offset twice a year and a hard-coded
 * -07:00 moves every window by an hour for half of it.
 */
export function atBakeryHour(dateStr: string, hour: number): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  for (const offset of [6, 7]) {
    const candidate = new Date(Date.UTC(y, m - 1, d, hour + offset, 0, 0, 0));
    if (bakeryDay(candidate) === dateStr && bakeryHour(candidate) === hour) return candidate;
  }
  return new Date(Date.UTC(y, m - 1, d, hour + 7, 0, 0, 0));
}

/** The soonest moment an order placed now may be handed over. */
export function earliestHandover(now: Date, leadHours: number): Date {
  return new Date(now.getTime() + Math.max(0, leadHours) * 3_600_000);
}

export type LeadTimeVerdict =
  | { ok: true }
  | {
      ok: false;
      reason: "too_soon" | "no_window" | "bad_date";
      /** Hours of notice the order needed. */
      leadHours: number;
      /** The first date that would have worked, when one exists. */
      earliestDate?: string;
    };

/**
 * Whether a pickup on this date respects the notice the order needs.
 *
 * Measured against when the window OPENS. A customer who picks the 4–6 PM
 * window collects at 4, so that is the moment the kitchen has to be ready
 * for — not 6.
 */
export function checkPickupLeadTime({
  dateStr,
  leadHours,
  now,
}: {
  dateStr: string;
  leadHours: number;
  now: Date;
}): LeadTimeVerdict {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { ok: false, reason: "bad_date", leadHours };
  }
  const window = pickupWindowFor(dateStr);
  if (!window) return { ok: false, reason: "no_window", leadHours };
  if (leadHours <= 0) return { ok: true };

  const opensAt = atBakeryHour(dateStr, window.startHour);
  const earliest = earliestHandover(now, leadHours);
  if (opensAt.getTime() >= earliest.getTime()) return { ok: true };

  return {
    ok: false,
    reason: "too_soon",
    leadHours,
    earliestDate: firstWorkableDate(earliest),
  };
}

/** The same check for a delivery slot, which carries its own start time. */
export function checkDeliveryLeadTime({
  slotStart,
  leadHours,
  now,
}: {
  slotStart: Date;
  leadHours: number;
  now: Date;
}): LeadTimeVerdict {
  if (leadHours <= 0) return { ok: true };
  const earliest = earliestHandover(now, leadHours);
  if (slotStart.getTime() >= earliest.getTime()) return { ok: true };
  return { ok: false, reason: "too_soon", leadHours, earliestDate: firstWorkableDate(earliest) };
}

/** The first day whose window opens at or after a moment. */
export function firstWorkableDate(earliest: Date, lookAheadDays = 21): string | undefined {
  for (let i = 0; i <= lookAheadDays; i++) {
    const day = bakeryDay(new Date(earliest.getTime() + i * 86_400_000));
    const window = pickupWindowFor(day);
    if (!window) continue;
    if (atBakeryHour(day, window.startHour).getTime() >= earliest.getTime()) return day;
  }
  return undefined;
}

/** What to tell the customer, naming the hours and the first date that works. */
export function leadTimeMessage(verdict: LeadTimeVerdict, locale: string): string | null {
  if (verdict.ok) return null;
  const es = locale === "es";
  if (verdict.reason === "bad_date") {
    return es ? "Esa fecha no es válida." : "That date is not valid.";
  }
  if (verdict.reason === "no_window") {
    return es ? "No hay recolección ese día." : "There is no pickup that day.";
  }
  const hours = verdict.leadHours;
  const asDays = hours % 24 === 0 ? hours / 24 : null;
  const span = asDays
    ? es
      ? `${asDays} día${asDays === 1 ? "" : "s"}`
      : `${asDays} day${asDays === 1 ? "" : "s"}`
    : es
    ? `${hours} horas`
    : `${hours} hours`;
  const when = verdict.earliestDate
    ? es
      ? ` El primer día disponible es ${verdict.earliestDate}.`
      : ` The first available day is ${verdict.earliestDate}.`
    : "";
  return es
    ? `Tu pedido necesita ${span} de preparación.${when}`
    : `Your order needs ${span} to prepare.${when}`;
}
