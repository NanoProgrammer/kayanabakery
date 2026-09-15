/**
 * The bakery operates on Calgary time. Pickup slots are stored as a plain
 * date ("2026-09-16") plus a human window label ("4:00 PM – 6:00 PM"), so the
 * automation has to turn local wall-clock times into real instants — and do it
 * correctly across daylight saving, since a fixed -6/-7 offset would drift the
 * status changes by an hour for half the year.
 */

export const BAKERY_TIME_ZONE = "America/Edmonton";

/** How far the given zone is ahead of UTC at that instant, in milliseconds. */
function zoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  const hour = get("hour");
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    hour === 24 ? 0 : hour,
    get("minute"),
    get("second")
  );

  return asUtc - date.getTime();
}

/**
 * Converts a Calgary wall-clock time to the matching UTC instant.
 * Runs the offset correction twice so times sitting right on a DST boundary
 * still land on the correct instant.
 */
export function bakeryWallClockToUtc(
  dateStr: string,
  hour: number,
  minute = 0
): Date {
  const naive = Date.UTC(
    Number(dateStr.slice(0, 4)),
    Number(dateStr.slice(5, 7)) - 1,
    Number(dateStr.slice(8, 10)),
    hour,
    minute
  );

  let instant = new Date(naive);
  for (let i = 0; i < 2; i++) {
    instant = new Date(naive - zoneOffsetMs(instant, BAKERY_TIME_ZONE));
  }
  return instant;
}

/** The Calgary-local calendar date ("YYYY-MM-DD") of an instant. */
export function bakeryDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BAKERY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** The instant of `hour`:00 Calgary time on the same local day as `date`. */
export function bakeryHourOnSameDay(date: Date, hour: number): Date {
  return bakeryWallClockToUtc(bakeryDateString(date), hour);
}

/**
 * Start of a pickup window from its stored label, e.g. "4:00 PM – 6:00 PM".
 * Returns null when the label isn't in that shape, so callers can fall back
 * rather than guess a time and move an order early.
 */
export function parsePickupWindowStart(
  pickupDate: string,
  pickupTime: string | null
): Date | null {
  if (!pickupTime) return null;

  const match = pickupTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  return bakeryWallClockToUtc(pickupDate, hour, minute);
}
