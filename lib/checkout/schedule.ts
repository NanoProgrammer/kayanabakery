/**
 * Karyana — Pickup & Delivery schedule constants.
 * Single source of truth. All times in America/Edmonton local.
 *
 * PICKUP:
 *   Mon–Sat: 4:00 PM – 6:00 PM
 *   Sunday:  1:00 PM – 3:00 PM
 *
 * DELIVERY:
 *   Tue–Sat: two windows → 6:00–8:00 PM, 7:00–9:00 PM (max 5 per slot)
 *   Sunday:  1:00–3:00 PM (max 10 per slot)
 */

import {
  addDays,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  isAfter,
  startOfDay,
  format,
} from "date-fns";

// ─── Types ───────────────────────────────────────────────────

export type PickupWindow = {
  dayOfWeek: number; // 0=Sun … 6=Sat
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
};

export type DeliveryWindowDef = {
  dayOfWeek: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  capacity: number;
  label: string;
};

export type PickupSlotOption = {
  date: string;
  dayLabel: string;
  windowLabel: string;
  startHour: number;
  endHour: number;
};

export type DeliverySlotOption = {
  id: string;
  date: string;
  dayLabel: string;
  windowLabel: string;
  startISO: string;
  endISO: string;
  capacity: number;
  label: string;
};

// ─── Constants ───────────────────────────────────────────────

export const PICKUP_WINDOWS: PickupWindow[] = [
  { dayOfWeek: 1, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
  { dayOfWeek: 2, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
  { dayOfWeek: 3, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
  { dayOfWeek: 4, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
  { dayOfWeek: 5, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
  { dayOfWeek: 6, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
  { dayOfWeek: 0, startHour: 13, startMinute: 0, endHour: 15, endMinute: 0 },
];

export const DELIVERY_WINDOWS: DeliveryWindowDef[] = [
  { dayOfWeek: 2, startHour: 18, startMinute: 0, endHour: 20, endMinute: 0, capacity: 5, label: "6–8 PM" },
  { dayOfWeek: 3, startHour: 18, startMinute: 0, endHour: 20, endMinute: 0, capacity: 5, label: "6–8 PM" },
  { dayOfWeek: 4, startHour: 18, startMinute: 0, endHour: 20, endMinute: 0, capacity: 5, label: "6–8 PM" },
  { dayOfWeek: 5, startHour: 18, startMinute: 0, endHour: 20, endMinute: 0, capacity: 5, label: "6–8 PM" },
  { dayOfWeek: 6, startHour: 18, startMinute: 0, endHour: 20, endMinute: 0, capacity: 5, label: "6–8 PM" },
  { dayOfWeek: 2, startHour: 19, startMinute: 0, endHour: 21, endMinute: 0, capacity: 5, label: "7–9 PM" },
  { dayOfWeek: 3, startHour: 19, startMinute: 0, endHour: 21, endMinute: 0, capacity: 5, label: "7–9 PM" },
  { dayOfWeek: 4, startHour: 19, startMinute: 0, endHour: 21, endMinute: 0, capacity: 5, label: "7–9 PM" },
  { dayOfWeek: 5, startHour: 19, startMinute: 0, endHour: 21, endMinute: 0, capacity: 5, label: "7–9 PM" },
  { dayOfWeek: 6, startHour: 19, startMinute: 0, endHour: 21, endMinute: 0, capacity: 5, label: "7–9 PM" },
  { dayOfWeek: 0, startHour: 13, startMinute: 0, endHour: 15, endMinute: 0, capacity: 10, label: "1–3 PM" },
];

// ─── Helpers ─────────────────────────────────────────────────

function makeDateTime(day: Date, hour: number, minute: number): Date {
  return setMilliseconds(setSeconds(setMinutes(setHours(day, hour), minute), 0), 0);
}

function formatTimeLabel(h: number, m: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${h12}:00 ${period}` : `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

// ─── Generators ──────────────────────────────────────────────

export function getPickupSlots({
  from = new Date(),
  daysAhead = 14,
  minLeadHours = 0,
}: {
  from?: Date;
  daysAhead?: number;
  minLeadHours?: number;
} = {}): PickupSlotOption[] {
  const earliest = new Date(from.getTime() + minLeadHours * 60 * 60 * 1000);
  const slots: PickupSlotOption[] = [];

  for (let i = 0; i < daysAhead; i++) {
    const day = startOfDay(addDays(from, i));
    const dow = day.getDay();

    for (const w of PICKUP_WINDOWS) {
      if (dow !== w.dayOfWeek) continue;
      const end = makeDateTime(day, w.endHour, w.endMinute);
      if (!isAfter(end, earliest)) continue;

      slots.push({
        date: format(day, "yyyy-MM-dd"),
        dayLabel: format(day, "EEEE, MMM d"),
        windowLabel: `${formatTimeLabel(w.startHour, w.startMinute)} – ${formatTimeLabel(w.endHour, w.endMinute)}`,
        startHour: w.startHour,
        endHour: w.endHour,
      });
    }
  }
  return slots;
}

export function getDeliverySlotDefs({
  from = new Date(),
  daysAhead = 14,
  minLeadHours = 24,
}: {
  from?: Date;
  daysAhead?: number;
  minLeadHours?: number;
} = {}): DeliverySlotOption[] {
  const earliest = new Date(from.getTime() + minLeadHours * 60 * 60 * 1000);
  const slots: DeliverySlotOption[] = [];

  for (let i = 0; i < daysAhead; i++) {
    const day = startOfDay(addDays(from, i));
    const dow = day.getDay();

    for (const w of DELIVERY_WINDOWS) {
      if (dow !== w.dayOfWeek) continue;
      const start = makeDateTime(day, w.startHour, w.startMinute);
      const end = makeDateTime(day, w.endHour, w.endMinute);
      if (!isAfter(end, earliest)) continue;

      const dateStr = format(day, "yyyy-MM-dd");
      const id = `${dateStr}_${String(w.startHour).padStart(2, "0")}-${String(w.startMinute).padStart(2, "0")}`;

      slots.push({
        id,
        date: dateStr,
        dayLabel: format(day, "EEEE, MMM d"),
        windowLabel: `${formatTimeLabel(w.startHour, w.startMinute)} – ${formatTimeLabel(w.endHour, w.endMinute)}`,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        capacity: w.capacity,
        label: w.label,
      });
    }
  }
  return slots;
}
