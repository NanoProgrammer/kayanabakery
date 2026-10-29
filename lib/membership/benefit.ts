/**
 * What a membership fee buys, and how a weekly box gets paid for.
 *
 * Until now the fee did two unrelated things at once: it turned into points at
 * face value AND a box was made every week and charged to the card in full. A
 * member paid the fee, got points they rarely spent, and was charged again for
 * every box on top. The points were decoration.
 *
 * Now the member chooses when they subscribe:
 *
 *   WEEKLY_BOX — the fee becomes a balance, the weekly box is paid out of it,
 *                and the card covers only what the balance cannot.
 *   POINTS     — no automatic order at all. The fee becomes points and they
 *                spend them on whatever they like, whenever they like.
 *
 * Splitting the payment is what makes the first option honest: the fee is
 * spent on bread rather than sitting next to a second charge for the same
 * bread.
 */
export type BenefitMode = "WEEKLY_BOX" | "POINTS";

/** 1 point = 1 cent. The fee converts at face value; no multiplier. */
export const POINT_CENTS = 1;

export function pointsForFee(feeCents: number): number {
  return Math.max(0, Math.floor(feeCents / POINT_CENTS));
}

/**
 * How many points to offer against one weekly box.
 *
 * The pricing function is what actually applies them — it takes points off the
 * subtotal, before GST, which is the correct tax treatment and the same path
 * the website's checkout uses. This only decides how many to hand it: never
 * more than the member has, and never more than the order is worth, so a $20
 * box cannot eat $30 of balance.
 */
export function pointsToSpend(subtotalCents: number, pointsBalance: number): number {
  const subtotal = Math.max(0, Math.round(subtotalCents));
  const balance = Math.max(0, Math.floor(pointsBalance));
  return Math.min(balance, Math.floor(subtotal / POINT_CENTS));
}

/** Whether this membership gets an automatic order each week. */
export function wantsWeeklyBox(benefitMode: string | null | undefined): boolean {
  // Anything unset is the box: that is what every existing member has, and
  // silently moving them to points-only would stop their bread.
  return benefitMode !== "POINTS";
}
