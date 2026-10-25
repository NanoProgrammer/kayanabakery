/**
 * Reading and writing the "Pickup / delivery date & time" field in Studio.
 *
 * The field is a single free-text string because three different places write
 * it: checkout writes a formatted delivery label ("Sunday, Oct 25, 1:00 p.m."),
 * checkout writes a pickup one ("2026-10-25 · 10:00 AM - 12:00 PM"), and the
 * Studio editor writes its own. The editor's date and time boxes were never
 * filled in from any of them, so the bakery opened an order and saw two empty
 * boxes under a line telling them what the value was.
 *
 * Worse, the boxes started empty and the editor wrote whatever they held: on
 * an order with a date already set, touching only the time submitted an empty
 * date, which cleared the whole field. Setting the time erased the date.
 *
 * So this parses the shapes that exist back into real values, and the editor
 * refuses to write a label with no date in it.
 */
const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

export type PickupParts = {
  /** YYYY-MM-DD, as an <input type="date"> wants it. */
  date: string;
  /** HH:MM in 24h, as an <input type="time"> wants it. */
  time: string;
};

/** Minutes past midnight from "1:00 p.m.", "13:00", "10:00 AM"; null if absent. */
function parseClock(text: string): string | null {
  // A pickup window is "10:00 AM - 12:00 PM" — the start is what matters.
  // The dash must have space around it: "2026-10-25 · 10:00 AM - 12:00 PM"
  // splits on the date's own hyphens otherwise, leaving "2026" and no time.
  const first = text.split(/\s+[-–—]\s+/)[0];

  const m = first.match(/(\d{1,2})\s*:\s*(\d{2})\s*(a\.?m\.?|p\.?m\.?)?/i);
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
 * The year for a label that doesn't carry one ("Sunday, Oct 25").
 *
 * Bakery orders sit within weeks of today, so the right year is whichever puts
 * the date nearest to now — which picks December correctly when read in
 * January, and January correctly when read in December.
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
  const empty: PickupParts = { date: "", time: "" };
  if (!value) return empty;

  const text = String(value).trim();
  if (!text) return empty;

  const time = parseClock(text) ?? "";

  // "2026-10-25", however it is wrapped.
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { date: `${iso[1]}-${iso[2]}-${iso[3]}`, time };
    }
  }

  // "Oct 25" / "October 25", with or without a year.
  const named = text.match(/\b([A-Za-z]{3,})\.?\s+(\d{1,2})\b(?:,?\s*(\d{4}))?/);
  if (named) {
    const month = MONTHS.indexOf(named[1].slice(0, 3).toLowerCase());
    const day = Number(named[2]);
    if (month >= 0 && day >= 1 && day <= 31) {
      const year = named[3] ? Number(named[3]) : nearestYear(month, day, now);
      return {
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        time,
      };
    }
  }

  return { date: "", time };
}

/**
 * The label written back. Matches what checkout produces for a delivery slot,
 * so an order rescheduled in Studio reads the same as one that was never
 * touched — and so this round-trips through parsePickupLabel unchanged.
 */
export function formatPickupLabel(date: string, time: string): string {
  if (!date) return "";

  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return "";

  const dateLabel = new Date(y, m - 1, d).toLocaleDateString("en-CA", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  // The year is kept so the value survives being read in another one, and so
  // nothing downstream has to guess what "Oct 25" meant.
  const withYear = `${dateLabel}, ${y}`;

  if (!time) return withYear;

  const [hh, mm] = time.split(":").map(Number);
  const period = hh >= 12 ? "p.m." : "a.m.";
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${withYear}, ${hour12}:${String(mm).padStart(2, "0")} ${period}`;
}

/**
 * What the editor should do with the field after someone changes a box.
 *
 * Pulled out of the component because it is the decision that lost data: the
 * boxes started empty, so touching the time submitted an empty date, the
 * editor formatted that into an empty string, and the order's date and time
 * were gone. "keep" is the case that used to be a silent wipe.
 */
export type PickupEdit =
  | { action: "set"; label: string }
  | { action: "unset" }
  | { action: "keep" };

export function pickupEdit(date: string, time: string): PickupEdit {
  // Emptying both boxes is the one deliberate way to clear the field.
  if (!date && !time) return { action: "unset" };

  // A time with no date cannot make a label. Leave what is stored alone.
  if (!date) return { action: "keep" };

  return { action: "set", label: formatPickupLabel(date, time) };
}
