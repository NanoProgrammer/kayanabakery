/**
 * The one way an order's pickup or delivery time is written down.
 *
 * It used to be three. Checkout wrote a delivery label built straight from a
 * Date ("Sunday, Oct 25, 1:00 p.m."), checkout wrote a pickup one by gluing
 * strings together ("2026-10-25 · 10:00 AM - 12:00 PM"), and the Studio editor
 * wrote a third. Same field, three shapes, so nothing could read it back:
 * Studio showed empty boxes on an order that plainly had a date, and the list
 * could not sort or show it.
 *
 * The canonical shape carries everything any of them had, plus the year so
 * nothing downstream has to guess it:
 *
 *     Sunday, Oct 25, 2026, 10:00 a.m. - 12:00 p.m.
 *     Sunday, Oct 25, 2026, 1:00 p.m.
 *     Sunday, Oct 25, 2026
 *
 * parsePickupLabel still reads all the old shapes, because orders written in
 * them exist; orders:unify rewrites those in place.
 */
import { BAKERY_TIME_ZONE } from "@/lib/time/edmonton";

const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

export type PickupParts = {
  /** YYYY-MM-DD, as an <input type="date"> wants it. */
  date: string;
  /** HH:MM in 24h — the start of the window. */
  time: string;
  /** HH:MM in 24h — the end, when the order has a window rather than a moment. */
  endTime: string;
};

const EMPTY: PickupParts = { date: "", time: "", endTime: "" };

/** "1:00 p.m." / "13:00" / "10:00 AM" → "13:00". Null when there is no clock. */
function parseClock(text: string): string | null {
  const m = text.match(/(\d{1,2})\s*:\s*(\d{2})\s*(a\.?m\.?|p\.?m\.?)?/i);
  if (!m) return null;

  let hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return null;

  const period = m[3]?.toLowerCase().replace(/\./g, "");
  if (period === "pm" && hour < 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * Splits a window into its two halves.
 *
 * The dash must have space around it: "2026-10-25 · 10:00 AM - 12:00 PM" would
 * otherwise split on the date's own hyphens, leaving "2026" and no time at all.
 */
function splitWindow(text: string): [string, string | null] {
  const parts = text.split(/\s+[-–—]\s+/);
  return [parts[0], parts.length > 1 ? parts[parts.length - 1] : null];
}

/**
 * The year for a label that doesn't carry one ("Sunday, Oct 25").
 *
 * Bakery orders sit within weeks of today, so the right year is whichever puts
 * the date nearest now — which reads December correctly in January, and
 * January correctly in December.
 */
function nearestYear(month: number, day: number, now: Date): number {
  const thisYear = now.getFullYear();
  let best = thisYear;
  let bestGap = Infinity;
  for (const year of [thisYear - 1, thisYear, thisYear + 1]) {
    const gap = Math.abs(new Date(year, month, day).getTime() - now.getTime());
    if (gap < bestGap) {
      bestGap = gap;
      best = year;
    }
  }
  return best;
}

export function parsePickupLabel(
  value: string | null | undefined,
  now: Date = new Date()
): PickupParts {
  if (!value) return EMPTY;
  const text = String(value).trim();
  if (!text) return EMPTY;

  const [head, tail] = splitWindow(text);
  const time = parseClock(head) ?? "";
  const endTime = tail ? parseClock(tail) ?? "" : "";

  // "2026-10-25", however it is wrapped.
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { date: `${iso[1]}-${iso[2]}-${iso[3]}`, time, endTime };
    }
  }

  // "Oct 25" / "October 25", with or without a year after it.
  const named = text.match(/\b([A-Za-z]{3,})\.?\s+(\d{1,2})\b(?:,?\s*(\d{4}))?/);
  if (named) {
    const month = MONTHS.indexOf(named[1].slice(0, 3).toLowerCase());
    const day = Number(named[2]);
    if (month >= 0 && day >= 1 && day <= 31) {
      const year = named[3] ? Number(named[3]) : nearestYear(month, day, now);
      return {
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        time,
        endTime,
      };
    }
  }

  return EMPTY;
}

function clockLabel(time: string): string {
  const [hh, mm] = time.split(":").map(Number);
  const period = hh >= 12 ? "p.m." : "a.m.";
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${String(mm).padStart(2, "0")} ${period}`;
}

/** The canonical label. Everything that writes this field goes through here. */
export function formatPickupLabel(
  date: string,
  time: string,
  endTime = ""
): string {
  if (!date) return "";

  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return "";

  const dateLabel = new Date(y, m - 1, d).toLocaleDateString("en-CA", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const withYear = `${dateLabel}, ${y}`;

  if (!time) return withYear;
  if (!endTime) return `${withYear}, ${clockLabel(time)}`;
  return `${withYear}, ${clockLabel(time)} - ${clockLabel(endTime)}`;
}

/** The bakery's own wall clock for an instant, as the inputs want it. */
export function bakeryParts(at: Date): { date: string; time: string } {
  // Formatted in the bakery's zone rather than the server's. Built from a Date
  // with toLocaleString and no zone, a 1 p.m. Calgary delivery printed as
  // 7:00 p.m. on a server running in UTC.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BAKERY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(at);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  // Midnight comes back as "24" in some ICU versions.
  const hour = get("hour") === "24" ? "00" : get("hour");

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${hour}:${get("minute")}`,
  };
}

/** The canonical label for a delivery slot, or any start/end pair. */
export function formatPickupWindow(start: Date, end?: Date | null): string {
  const from = bakeryParts(start);
  const to = end ? bakeryParts(end) : null;
  // An end on another day is not a window the label can express; drop it
  // rather than print something that reads as the same day.
  const sameDay = to && to.date === from.date;
  return formatPickupLabel(from.date, from.time, sameDay ? to!.time : "");
}

/**
 * The canonical label for what the checkout form collected for a pickup: a
 * date string and a free-text window such as "10:00 AM - 12:00 PM".
 */
export function formatPickupFromForm(
  pickupDate: string,
  pickupTime?: string | null
): string {
  const parsed = parsePickupLabel(
    `${pickupDate}${pickupTime ? ` · ${pickupTime}` : ""}`
  );
  if (!parsed.date) return pickupDate ?? "";
  return formatPickupLabel(parsed.date, parsed.time, parsed.endTime);
}

/**
 * What the Studio editor should do with the field after someone edits a box.
 *
 * Pulled out of the component because it is the decision that lost data: the
 * boxes started empty, so touching the time submitted an empty date, which
 * formatted to an empty string and cleared the order's date and time. "keep"
 * is the case that used to be a silent wipe.
 */
export type PickupEdit =
  | { action: "set"; label: string }
  | { action: "unset" }
  | { action: "keep" };

export function pickupEdit(
  date: string,
  time: string,
  endTime = ""
): PickupEdit {
  // Emptying every box is the one deliberate way to clear the field.
  if (!date && !time && !endTime) return { action: "unset" };

  // A time with no date cannot make a label. Leave what is stored alone.
  if (!date) return { action: "keep" };

  // An end before the start is half-typed, not a window.
  const end = endTime && time && endTime > time ? endTime : "";

  return { action: "set", label: formatPickupLabel(date, time, end) };
}
