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
 *
 * NOTE: EVENING_ONLY below is currently on, so what is actually being offered
 * is 6 PM onwards. The definitions above are what comes back when it is off.
 */

import { isClosedDate } from "./closures";

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
  /** Priority "before 6 PM" slot — carries an extra fee for lower tiers */
  isPriority?: boolean;
  /** Fee in cents for BASICO tier. 0 = free. Only set when isPriority = true */
  feeCentsBasico?: number;
  /** Fee in cents for ARTESANO tier. 0 = free. Only set when isPriority = true */
  feeCentsArtesano?: number;
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
  isPriority: boolean;
  feeCentsBasico: number;
  feeCentsArtesano: number;
};

// ─── Constants ───────────────────────────────────────────────

// ─── TEMPORARY: evenings only ────────────────────────────────
//
// The bakery is only handing orders over from 6 PM for now. Everything
// earlier is withdrawn rather than deleted, so putting the normal schedule
// back is one line: set EVENING_ONLY to false.
//
// Pickup windows are MOVED rather than filtered. Every one of them starts
// before 6 PM, so filtering would leave no pickup times at all and the
// checkout would simply refuse every pickup order.
//
// Delivery windows ARE filtered, because 6–8 PM and 7–9 PM already exist on
// Tuesday to Saturday. Sunday's only window is an afternoon one, so Sunday
// delivery is withdrawn along with the rest — say the word and it moves to
// the evening instead.
const EVENING_ONLY = true;
const EVENING_FROM_HOUR = 18;
const EVENING_PICKUP_END_HOUR = 20;

const ALL_PICKUP_WINDOWS: PickupWindow[] = [
  { dayOfWeek: 1, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
  { dayOfWeek: 2, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
  { dayOfWeek: 3, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
  { dayOfWeek: 4, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
  { dayOfWeek: 5, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
  { dayOfWeek: 6, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
  { dayOfWeek: 0, startHour: 13, startMinute: 0, endHour: 15, endMinute: 0 },
];

export const PICKUP_WINDOWS: PickupWindow[] = EVENING_ONLY
  ? ALL_PICKUP_WINDOWS.map((w) => ({
      ...w,
      startHour: EVENING_FROM_HOUR,
      startMinute: 0,
      endHour: EVENING_PICKUP_END_HOUR,
      endMinute: 0,
    }))
  : ALL_PICKUP_WINDOWS;

/** Fee constants for priority (before-6-PM) delivery slots */
export const PRIORITY_SLOT_FEE_BASICO = 899;   // $8.99
export const PRIORITY_SLOT_FEE_ARTESANO = 499; // $4.99
// SELECTO, LEGENDARIO → FREE (0)

const PRIORITY = {
  isPriority: true,
  feeCentsBasico: PRIORITY_SLOT_FEE_BASICO,
  feeCentsArtesano: PRIORITY_SLOT_FEE_ARTESANO,
};

const ALL_DELIVERY_WINDOWS: DeliveryWindowDef[] = [
  // ── Priority daytime slots (before 6 PM) — Tue–Sat ───────────
  { dayOfWeek: 2, startHour: 13, startMinute: 0, endHour: 14, endMinute: 0, capacity: 5, label: "1–2 PM", ...PRIORITY },
  { dayOfWeek: 3, startHour: 13, startMinute: 0, endHour: 14, endMinute: 0, capacity: 5, label: "1–2 PM", ...PRIORITY },
  { dayOfWeek: 4, startHour: 13, startMinute: 0, endHour: 14, endMinute: 0, capacity: 5, label: "1–2 PM", ...PRIORITY },
  { dayOfWeek: 5, startHour: 13, startMinute: 0, endHour: 14, endMinute: 0, capacity: 5, label: "1–2 PM", ...PRIORITY },
  { dayOfWeek: 6, startHour: 13, startMinute: 0, endHour: 14, endMinute: 0, capacity: 5, label: "1–2 PM", ...PRIORITY },
  { dayOfWeek: 2, startHour: 14, startMinute: 0, endHour: 16, endMinute: 0, capacity: 5, label: "2–4 PM", ...PRIORITY },
  { dayOfWeek: 3, startHour: 14, startMinute: 0, endHour: 16, endMinute: 0, capacity: 5, label: "2–4 PM", ...PRIORITY },
  { dayOfWeek: 4, startHour: 14, startMinute: 0, endHour: 16, endMinute: 0, capacity: 5, label: "2–4 PM", ...PRIORITY },
  { dayOfWeek: 5, startHour: 14, startMinute: 0, endHour: 16, endMinute: 0, capacity: 5, label: "2–4 PM", ...PRIORITY },
  { dayOfWeek: 6, startHour: 14, startMinute: 0, endHour: 16, endMinute: 0, capacity: 5, label: "2–4 PM", ...PRIORITY },
  { dayOfWeek: 2, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0, capacity: 5, label: "4–6 PM", ...PRIORITY },
  { dayOfWeek: 3, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0, capacity: 5, label: "4–6 PM", ...PRIORITY },
  { dayOfWeek: 4, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0, capacity: 5, label: "4–6 PM", ...PRIORITY },
  { dayOfWeek: 5, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0, capacity: 5, label: "4–6 PM", ...PRIORITY },
  { dayOfWeek: 6, startHour: 16, startMinute: 0, endHour: 18, endMinute: 0, capacity: 5, label: "4–6 PM", ...PRIORITY },
  // ── Standard evening slots — Tue–Sat ─────────────────────────
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
  // ── Sunday ───────────────────────────────────────────────────
  { dayOfWeek: 0, startHour: 13, startMinute: 0, endHour: 15, endMinute: 0, capacity: 10, label: "1–3 PM" },
];

export const DELIVERY_WINDOWS: DeliveryWindowDef[] = EVENING_ONLY
  ? ALL_DELIVERY_WINDOWS.filter((w) => w.startHour >= EVENING_FROM_HOUR)
  : ALL_DELIVERY_WINDOWS;

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
    if (isClosedDate(format(day, "yyyy-MM-dd"))) continue;
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
    if (isClosedDate(format(day, "yyyy-MM-dd"))) continue;
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
        isPriority: w.isPriority ?? false,
        feeCentsBasico: w.feeCentsBasico ?? 0,
        feeCentsArtesano: w.feeCentsArtesano ?? 0,
      });
    }
  }
  return slots;
}
