/**
 * Karyana — Delivery slot generator
 *
 * Rules:
 *  - Regular customers: Mondays 18:00–20:00 and Fridays 19:00–21:00
 *  - Members (Artesano, Selecto, Legendario): also weekdays 09:00–17:00
 *
 * Slots are generated in 1-hour increments where applicable, but for the
 * fixed evening windows we expose a single slot per night (the whole window).
 *
 * SE Calgary customers get free first delivery (handled at checkout, not here).
 */

import { addDays, format, isAfter, setHours, setMinutes, startOfDay } from "date-fns";
import type { MembershipTier } from "../membership/tiers";

export type SlotKind = "REGULAR_EVENING" | "MEMBER_WEEKDAY";

export interface DeliverySlotOption {
  id: string;            // YYYY-MM-DD_HH-MM (for matching with DB row)
  date: string;          // YYYY-MM-DD
  startTime: string;     // HH:MM
  endTime: string;       // HH:MM
  kind: SlotKind;
  label: string;         // human readable
  membersOnly: boolean;
}

const REGULAR_WINDOWS = {
  // 1 = Monday, 5 = Friday (date-fns getDay: 0=Sun…6=Sat)
  1: { start: "18:00", end: "20:00" }, // Monday 6-8pm
  5: { start: "19:00", end: "21:00" }, // Friday 7-9pm
} as const;

// Member weekday windows: 9-5 in 2-hour slots
const MEMBER_WEEKDAY_SLOTS = [
  { start: "09:00", end: "11:00" },
  { start: "11:00", end: "13:00" },
  { start: "13:00", end: "15:00" },
  { start: "15:00", end: "17:00" },
];

function isMember(tier: MembershipTier | null | undefined): boolean {
  return (
    tier === "ARTESANO" ||
    tier === "SELECTO" ||
    tier === "LEGENDARIO"
  );
}

/**
 * Generate available delivery slots from `from` for the next `daysAhead` days.
 *
 * The `kind` filtering:
 *   - non-members → only REGULAR_EVENING slots
 *   - members → both kinds
 */
export function generateDeliverySlots({
  from = new Date(),
  daysAhead = 21,
  membershipTier = null,
  minLeadHours = 24,
}: {
  from?: Date;
  daysAhead?: number;
  membershipTier?: MembershipTier | null;
  minLeadHours?: number;
} = {}): DeliverySlotOption[] {
  const slots: DeliverySlotOption[] = [];
  const earliestAllowed = new Date(from.getTime() + minLeadHours * 60 * 60 * 1000);
  const member = isMember(membershipTier);

  for (let i = 0; i < daysAhead; i++) {
    const day = startOfDay(addDays(from, i));
    const dow = day.getDay();

    // Regular evening windows (Mon / Fri)
    const reg = (REGULAR_WINDOWS as any)[dow];
    if (reg) {
      const [sh, sm] = reg.start.split(":").map(Number);
      const slotStart = setMinutes(setHours(day, sh), sm);
      if (isAfter(slotStart, earliestAllowed)) {
        const id = `${format(day, "yyyy-MM-dd")}_${reg.start.replace(":", "-")}`;
        slots.push({
          id,
          date: format(day, "yyyy-MM-dd"),
          startTime: reg.start,
          endTime: reg.end,
          kind: "REGULAR_EVENING",
          label: `${format(day, "EEE MMM d")} · ${reg.start}–${reg.end}`,
          membersOnly: false,
        });
      }
    }

    // Member-only weekday windows (Mon–Fri 9-5)
    if (member && dow >= 1 && dow <= 5) {
      for (const w of MEMBER_WEEKDAY_SLOTS) {
        const [sh, sm] = w.start.split(":").map(Number);
        const slotStart = setMinutes(setHours(day, sh), sm);
        if (!isAfter(slotStart, earliestAllowed)) continue;
        const id = `${format(day, "yyyy-MM-dd")}_${w.start.replace(":", "-")}`;
        slots.push({
          id,
          date: format(day, "yyyy-MM-dd"),
          startTime: w.start,
          endTime: w.end,
          kind: "MEMBER_WEEKDAY",
          label: `${format(day, "EEE MMM d")} · ${w.start}–${w.end} (members)`,
          membersOnly: true,
        });
      }
    }
  }

  return slots;
}

/** Validate that a chosen slot id is actually allowed for the user. */
export function canBookSlot(
  slotId: string,
  membershipTier: MembershipTier | null | undefined
): boolean {
  // Find from generated slots matching the id; if it's a member-only window
  // and the user isn't a member, deny.
  const slots = generateDeliverySlots({
    daysAhead: 30,
    membershipTier: membershipTier ?? null,
  });
  const slot = slots.find((s) => s.id === slotId);
  if (!slot) return false;
  if (slot.membersOnly && !isMember(membershipTier)) return false;
  return true;
}

/**
 * Determine if the customer qualifies for FREE first delivery.
 * Rule: SE-flagged address + has never had a delivery before.
 */
export function qualifiesForFreeFirstDelivery({
  isSE,
  hasPreviousDelivery,
}: {
  isSE: boolean;
  hasPreviousDelivery: boolean;
}): boolean {
  return isSE && !hasPreviousDelivery;
}
