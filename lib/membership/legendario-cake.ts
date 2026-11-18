/**
 * The Legendario promise: Karyana makes the cake herself.
 *
 * A promise the kitchen cannot see is a promise that does not happen. The
 * slip that comes off the Raspberry is the only thing anyone reads while
 * the order is being made, so the decision lives here and is printed there
 * — not just described on the Club page.
 *
 * Two triggers, because "birthday cake" is not something the catalogue
 * knows:
 *
 *   - BIRTHDAY: the customer's stored birthday falls within the window
 *     around the handover date. This is the actual promise.
 *   - CAKE: a Legendario ordering any cake. Printed as a quieter note, so
 *     nobody has to guess whether it counts. Over-delivering on a cake is
 *     cheaper than breaking the one promise the top tier was sold on.
 */
import { familyForProduct } from "@/lib/products/cake-families";

/** How close to the birthday still counts as the birthday cake. */
export const BIRTHDAY_WINDOW_DAYS = 7;

/** The tiers Karyana makes the cake for. */
export const TIERS_WITH_KARYANA_CAKE = ["LEGENDARIO", "EMBAJADOR"];

export type CakeSlipItem = { name: string; slug?: string | null };

export type KaryanaCakeVerdict =
  | { applies: false }
  | { applies: true; reason: "birthday" | "cake"; cakes: string[] };

export function hasCake(items: readonly CakeSlipItem[]): boolean {
  return items.some((i) => !!familyForProduct({ slug: i.slug ?? null, name: i.name }));
}

export function cakeNames(items: readonly CakeSlipItem[]): string[] {
  return items
    .filter((i) => !!familyForProduct({ slug: i.slug ?? null, name: i.name }))
    .map((i) => i.name);
}

/**
 * Whether the birthday falls within the window around a date, ignoring the
 * year — a birthday repeats, the stored date does not.
 */
export function isBirthdayNear(
  birthday: Date | null | undefined,
  handover: Date,
  windowDays = BIRTHDAY_WINDOW_DAYS
): boolean {
  if (!birthday) return false;
  const bMonth = birthday.getUTCMonth();
  const bDay = birthday.getUTCDate();

  // Checked against the year before, the year of, and the year after the
  // handover, so a birthday on 2 January still matches an order on 30
  // December.
  const year = handover.getUTCFullYear();
  for (const y of [year - 1, year, year + 1]) {
    const thisYear = Date.UTC(y, bMonth, bDay);
    const diffDays = Math.abs(thisYear - Date.UTC(
      handover.getUTCFullYear(),
      handover.getUTCMonth(),
      handover.getUTCDate()
    )) / 86_400_000;
    if (diffDays <= windowDays) return true;
  }
  return false;
}

export function karyanaMakesThisCake({
  tier,
  items,
  birthday,
  handover,
}: {
  tier: string | null | undefined;
  items: readonly CakeSlipItem[];
  birthday?: Date | null;
  handover?: Date | null;
}): KaryanaCakeVerdict {
  if (!tier || !TIERS_WITH_KARYANA_CAKE.includes(tier)) return { applies: false };
  const cakes = cakeNames(items);
  if (!cakes.length) return { applies: false };

  const birthdayCake = !!handover && isBirthdayNear(birthday, handover);
  return { applies: true, reason: birthdayCake ? "birthday" : "cake", cakes };
}

/** The line printed on the kitchen slip. Short, because it is read at a glance. */
export function slipNote(verdict: KaryanaCakeVerdict): string | null {
  if (!verdict.applies) return null;
  return verdict.reason === "birthday"
    ? "BIRTHDAY CAKE — KARYANA MAKES THIS ONE"
    : "LEGENDARIO — KARYANA MAKES THIS CAKE";
}
