/**
 * The free cake for referring ten people who join the Club.
 *
 * Separate from the per-referral points, which are paid for any verified
 * sign-up. This one counts only the referrals who actually took out a
 * membership — a referral who registers and never joins is worth points but
 * does not move this milestone, because the milestone is what Karyana said
 * it is: ten people who get a membership.
 *
 * The reward is a single-use coupon for one free cake rather than points,
 * so the member gets a cake and not a number that happens to be worth one.
 *
 * This module decides; issuing it is in the function below that writes the
 * coupon. The counting is kept pure because it is the part that can be wrong
 * in a way nobody notices for months.
 */
export const FREE_CAKE_AT = 10;

/** The tiers that count: a paid membership, not the free Básico default. */
export const QUALIFYING_TIERS = ["ARTESANO", "SELECTO", "LEGENDARIO", "EMBAJADOR"] as const;
export type QualifyingTier = (typeof QUALIFYING_TIERS)[number];

export type ReferredMember = {
  userId: string;
  /** Their effective tier, already resolved (expiry taken into account). */
  tier: string;
  /** Whether they confirmed their email. An unverified sign-up is not a
   *  person yet — this is the same bar the points reward uses. */
  verified: boolean;
};

export function countsTowardCake(referred: ReferredMember): boolean {
  if (!referred.verified) return false;
  return (QUALIFYING_TIERS as readonly string[]).includes(referred.tier);
}

export type CakeProgress = {
  /** Verified referrals who hold a paid membership. */
  qualified: number;
  /** How many more are needed. Zero once it is earned. */
  remaining: number;
  /** Whether the milestone is reached. */
  earned: boolean;
  /** Free cakes earned in total — a second ten earns a second cake. */
  cakesEarned: number;
};

export function cakeProgress(
  referred: readonly ReferredMember[],
  cakesAlreadyIssued = 0
): CakeProgress {
  const qualified = referred.filter(countsTowardCake).length;
  const cakesEarned = Math.floor(qualified / FREE_CAKE_AT);
  const towardNext = qualified % FREE_CAKE_AT;
  const earned = cakesEarned > cakesAlreadyIssued;
  return {
    qualified,
    remaining: earned ? 0 : FREE_CAKE_AT - towardNext,
    earned,
    cakesEarned,
  };
}

/** "7 of 10 — 3 more for a free cake". */
export function describeProgress(progress: CakeProgress, locale: string): string {
  const es = locale === "es";
  if (progress.earned) {
    return es ? "¡Ganaste un pastel gratis!" : "You've earned a free cake!";
  }
  const have = progress.qualified % FREE_CAKE_AT;
  return es
    ? `${have} de ${FREE_CAKE_AT} — te faltan ${progress.remaining} para un pastel gratis`
    : `${have} of ${FREE_CAKE_AT} — ${progress.remaining} more for a free cake`;
}

/**
 * The coupon code for one person's nth free cake. Deterministic, so issuing
 * the same milestone twice produces the same code and the unique index on
 * Coupon.code refuses the duplicate instead of handing out two cakes.
 */
export function freeCakeCode(userId: string, cakeNumber: number): string {
  const suffix = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();
  return `CAKE10-${suffix}-${cakeNumber}`;
}
