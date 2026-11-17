/**
 * When an order can be collected. The single source of truth.
 *
 * These hours were written down in three separate places that had drifted
 * apart: lib/checkout/schedule.ts (with a temporary evenings-only override
 * on top), the hard-coded hours inside PickupSlotPicker, and again in
 * lib/checkout/lead-time.ts. Three copies meant the picker could offer a
 * time the server did not recognise, which is how a slot nobody meant to
 * sell gets sold. Everything reads from here now.
 *
 *   Monday to Saturday   4-6 PM, 6-8 PM, 7-9 PM
 *   Sunday               1-3 PM
 *
 * All times America/Edmonton.
 */
import { isClosedDate } from "./closures";

export type PickupWindowDef = {
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number;
  startHour: number;
  endHour: number;
};

export const PICKUP_WINDOWS: PickupWindowDef[] = [
  // Monday to Saturday: the original late-afternoon window, plus the two
  // evening ones Karyana added.
  ...[1, 2, 3, 4, 5, 6].flatMap((dayOfWeek) => [
    { dayOfWeek, startHour: 16, endHour: 18 },
    { dayOfWeek, startHour: 18, endHour: 20 },
    { dayOfWeek, startHour: 19, endHour: 21 },
  ]),
  // Sunday, early.
  { dayOfWeek: 0, startHour: 13, endHour: 15 },
];

/**
 * The least notice any pickup needs, whatever is in the basket.
 *
 * Eight hours. Cakes keep their own, longer times from Karyana's table; this
 * is the floor underneath everything, so a bag of conchas ordered at 3 PM
 * cannot be collected at 4.
 */
export const PICKUP_MIN_LEAD_HOURS = 8;

const TZ = "America/Edmonton";

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
 * A Date for a bakery-local day and hour, found by trying both offsets
 * rather than assuming one. Alberta changes offset twice a year and a
 * hard-coded -07:00 moves every window by an hour for half of it.
 */
export function atBakeryHour(dateStr: string, hour: number): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  for (const offset of [6, 7]) {
    const candidate = new Date(Date.UTC(y, m - 1, d, hour + offset, 0, 0, 0));
    if (bakeryDay(candidate) === dateStr && bakeryHour(candidate) === hour) return candidate;
  }
  return new Date(Date.UTC(y, m - 1, d, hour + 7, 0, 0, 0));
}

export function dayOfWeek(dateStr: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const at = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return Number.isNaN(at.getTime()) ? null : at.getUTCDay();
}

/** Every window that day has, in order, regardless of the time now. */
export function windowsForDate(dateStr: string): PickupWindowDef[] {
  const dow = dayOfWeek(dateStr);
  if (dow === null) return [];
  return PICKUP_WINDOWS.filter((w) => w.dayOfWeek === dow).sort(
    (a, b) => a.startHour - b.startHour
  );
}

/** "4:00 PM – 6:00 PM" */
export function windowLabel(w: PickupWindowDef): string {
  const fmt = (h: number) => {
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:00 ${suffix}`;
  };
  return `${fmt(w.startHour)} – ${fmt(w.endHour)}`;
}

/** The notice a pickup actually needs: the floor, or the basket, whichever is more. */
export function effectivePickupLeadHours(itemLeadHours: number): number {
  const items = Number.isFinite(itemLeadHours) && itemLeadHours > 0 ? itemLeadHours : 0;
  return Math.max(PICKUP_MIN_LEAD_HOURS, items);
}

export type OfferedWindow = PickupWindowDef & {
  date: string;
  label: string;
  opensAt: Date;
};

/**
 * The windows a customer may actually choose, soonest first.
 *
 * Measured from when a window OPENS, never when it closes: someone who picks
 * the 4-6 PM slot collects at 4, so that is the moment the kitchen has to be
 * ready for. Comparing against the close is what let a same-day 4 PM pickup
 * through for an order needing four hours.
 */
export function offeredPickupWindows({
  now,
  itemLeadHours = 0,
  days = 14,
}: {
  now: Date;
  itemLeadHours?: number;
  days?: number;
}): OfferedWindow[] {
  const leadHours = effectivePickupLeadHours(itemLeadHours);
  const earliest = new Date(now.getTime() + leadHours * 3_600_000);
  const out: OfferedWindow[] = [];

  for (let i = 0; i <= days; i++) {
    const date = bakeryDay(new Date(now.getTime() + i * 86_400_000));
    if (isClosedDate(date)) continue;
    for (const w of windowsForDate(date)) {
      const opensAt = atBakeryHour(date, w.startHour);
      if (opensAt.getTime() < earliest.getTime()) continue;
      out.push({ ...w, date, label: windowLabel(w), opensAt });
    }
  }
  return out.sort((a, b) => a.opensAt.getTime() - b.opensAt.getTime());
}

/**
 * Whether a date and window label the browser sent is one we actually offer.
 *
 * The label is checked against the day's real windows rather than trusted,
 * because a request built by hand would send whatever label it liked.
 */
export function findWindow(dateStr: string, label: string | null | undefined): PickupWindowDef | null {
  if (!label) return null;
  const wanted = label.replace(/\s+/g, " ").replace(/[–—]/g, "-").trim().toLowerCase();
  return (
    windowsForDate(dateStr).find(
      (w) => windowLabel(w).replace(/\s+/g, " ").replace(/[–—]/g, "-").trim().toLowerCase() === wanted
    ) ?? null
  );
}
