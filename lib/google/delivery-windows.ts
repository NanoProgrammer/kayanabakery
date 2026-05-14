import { addDays, setHours, setMinutes, setSeconds, setMilliseconds, isAfter, startOfDay } from "date-fns";

export const SLOT_DURATION_MIN = 12;
export const MIN_LEAD_HOURS = 24;
export const DAYS_AHEAD = 21; // 3 weeks ahead

// Day-of-week: 0 Sun, 1 Mon, 2 Tue, 3 Wed, 4 Thu, 5 Fri, 6 Sat
type DeliveryWindow = {
  dayOfWeek: number;
  startHour: number; // local Edmonton time
  startMinute: number;
  endHour: number;
  endMinute: number;
  label: string;
};

export const DELIVERY_WINDOWS: DeliveryWindow[] = [
  {
    dayOfWeek: 1, // Monday
    startHour: 18,
    startMinute: 0,
    endHour: 20,
    endMinute: 0,
    label: "Monday evening",
  },
  {
    dayOfWeek: 5, // Friday
    startHour: 19,
    startMinute: 0,
    endHour: 21,
    endMinute: 0,
    label: "Friday evening",
  },
];

export type WindowSlot = {
  /** Stable id (ISO of window start) */
  id: string;
  /** Window start (local Edmonton) as ISO */
  windowStart: string;
  /** Window end as ISO */
  windowEnd: string;
  label: string;
  /** Total possible delivery slots in this window */
  capacity: number;
};

/**
 * Returns all upcoming delivery windows in the next DAYS_AHEAD days,
 * filtered to those that haven't passed AND meet MIN_LEAD_HOURS.
 */
export function getUpcomingWindows(now = new Date()): WindowSlot[] {
  const minDeliveryTime = new Date(
    now.getTime() + MIN_LEAD_HOURS * 60 * 60 * 1000
  );

  const windows: WindowSlot[] = [];

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const day = addDays(startOfDay(now), i);

    for (const w of DELIVERY_WINDOWS) {
      if (day.getDay() !== w.dayOfWeek) continue;

      const start = setMilliseconds(
        setSeconds(setMinutes(setHours(day, w.startHour), w.startMinute), 0),
        0
      );
      const end = setMilliseconds(
        setSeconds(setMinutes(setHours(day, w.endHour), w.endMinute), 0),
        0
      );

      // Skip if entire window is before minimum lead time
      if (!isAfter(end, minDeliveryTime)) continue;

      const totalMinutes =
        (end.getTime() - start.getTime()) / (1000 * 60);
      const capacity = Math.floor(totalMinutes / SLOT_DURATION_MIN);

      windows.push({
        id: `window-${start.toISOString()}`,
        windowStart: start.toISOString(),
        windowEnd: end.toISOString(),
        label: w.label,
        capacity,
      });
    }
  }

  return windows;
}

/**
 * Given a window and a list of busy 12-min sub-slots already taken,
 * returns the next available start time inside the window.
 * Returns null if window is full.
 */
export function findNextAvailableSlot(
  window: WindowSlot,
  busySlotStarts: Date[]
): Date | null {
  const start = new Date(window.windowStart);
  const end = new Date(window.windowEnd);

  const busyTimes = new Set(busySlotStarts.map((d) => d.getTime()));

  let cursor = start;
  while (cursor < end) {
    if (!busyTimes.has(cursor.getTime())) {
      return cursor;
    }
    cursor = new Date(cursor.getTime() + SLOT_DURATION_MIN * 60 * 1000);
  }

  return null;
}