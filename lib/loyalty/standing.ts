/**
 * Keeping a tier, and losing it.
 *
 * PROPOSAL. Nothing here changes a customer's tier today: the switch at the
 * bottom of this file is off, and lib/loyalty/klc.ts remains unwired. It
 * exists so the new scheme can be argued about and demonstrated with real
 * numbers at the meeting.
 *
 * The idea the paid membership never had: a tier is EARNED and has to be
 * kept. Credits count only while they are recent, so a customer who stops
 * buying slides back down on their own — no expiry job, no "your membership
 * has lapsed" email, just a number that stops being true.
 *
 * Two things stop that being cruel:
 *
 *   - A grace period. Dropping is delayed, so one quiet month after a year
 *     of loyalty does not cost someone their tier mid-celebration.
 *   - You never fall more than one step at a time.
 *
 * Both exist because the failure mode here is a regular walking in on their
 * birthday to find they are Básico.
 */
import {
  TIER_THRESHOLDS,
  LEGENDARIO_MIN_PERSONAL_PURCHASES,
  countPersonalPurchases,
  applyBonusCap,
  type EarnedTier,
  type KlcEvent,
  type PurchaseRecord,
} from "./klc";

/** Credits count for this long. After that they stop propping a tier up. */
export const CREDIT_LIFETIME_DAYS = 365;

/** How long a tier is held after the credits stop justifying it. */
export const GRACE_DAYS = 90;

export const TIER_ORDER: EarnedTier[] = ["BASICO", "ARTESANO", "SELECTO", "LEGENDARIO"];

export function tierRank(tier: EarnedTier): number {
  return Math.max(0, TIER_ORDER.indexOf(tier));
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / 86_400_000;
}

/**
 * Credits still counting: everything earned inside the window, with the
 * yearly cap on the bonus pillars applied as usual.
 */
export function liveCredits(events: readonly KlcEvent[], now: Date): number {
  const cutoff = now.getTime() - CREDIT_LIFETIME_DAYS * 86_400_000;
  const recent = events.filter((e) => e.at.getTime() > cutoff);
  return applyBonusCap(recent, now).events.reduce((sum, e) => sum + e.credits, 0);
}

/** Purchases still counting toward the Legendario requirement. */
export function livePurchases(purchases: readonly PurchaseRecord[], now: Date): number {
  const cutoff = new Date(now.getTime() - CREDIT_LIFETIME_DAYS * 86_400_000);
  const cutoffDay = cutoff.toISOString().slice(0, 10);
  return countPersonalPurchases(purchases.filter((p) => p.day >= cutoffDay));
}

/** The tier the numbers alone justify right now. */
export function tierFromCredits(credits: number, personalPurchases: number): EarnedTier {
  if (credits >= TIER_THRESHOLDS.LEGENDARIO && personalPurchases >= LEGENDARIO_MIN_PERSONAL_PURCHASES) {
    return "LEGENDARIO";
  }
  if (credits >= TIER_THRESHOLDS.SELECTO) return "SELECTO";
  if (credits >= TIER_THRESHOLDS.ARTESANO) return "ARTESANO";
  return "BASICO";
}

export type Standing = {
  /** What the customer actually holds. */
  tier: EarnedTier;
  /** What the numbers justify today. */
  earned: EarnedTier;
  credits: number;
  personalPurchases: number;
  /** True while a tier is being held above what the numbers justify. */
  inGrace: boolean;
  /** Days of grace left, or null when not in grace. */
  graceDaysLeft: number | null;
  /** The tier they will drop to when grace runs out, or null. */
  droppingTo: EarnedTier | null;
};

/**
 * Where a customer stands.
 *
 * `heldSince` is when the current tier was last confirmed — the last time
 * the numbers justified it. Grace is measured from there.
 */
export function standing({
  events,
  purchases,
  currentTier,
  heldSince,
  now,
}: {
  events: readonly KlcEvent[];
  purchases: readonly PurchaseRecord[];
  currentTier: EarnedTier;
  heldSince: Date | null;
  now: Date;
}): Standing {
  const credits = liveCredits(events, now);
  const personalPurchases = livePurchases(purchases, now);
  const earned = tierFromCredits(credits, personalPurchases);

  const base = { credits, personalPurchases, earned };

  // Going up is immediate. Nobody should have to wait to be rewarded.
  if (tierRank(earned) >= tierRank(currentTier)) {
    return { ...base, tier: earned, inGrace: false, graceDaysLeft: null, droppingTo: null };
  }

  // Going down waits. One quiet month after a year of loyalty should not
  // cost someone their tier in the middle of planning a birthday.
  const since = heldSince ?? now;
  const elapsed = daysBetween(since, now);
  if (elapsed < GRACE_DAYS) {
    return {
      ...base,
      tier: currentTier,
      inGrace: true,
      graceDaysLeft: Math.max(0, Math.ceil(GRACE_DAYS - elapsed)),
      droppingTo: oneStepDown(currentTier, earned),
    };
  }

  // Grace is up. Never more than one step at a time, so a long absence is
  // a slide rather than a fall.
  return {
    ...base,
    tier: oneStepDown(currentTier, earned),
    inGrace: false,
    graceDaysLeft: null,
    droppingTo: null,
  };
}

function oneStepDown(from: EarnedTier, floor: EarnedTier): EarnedTier {
  const next = Math.max(tierRank(floor), tierRank(from) - 1);
  return TIER_ORDER[next];
}

/* ------------------------------------------------------------------ */
/* What the customer sees                                              */
/* ------------------------------------------------------------------ */

export type Progress = {
  tier: EarnedTier;
  next: EarnedTier | null;
  /** Credits still needed for the next tier, or null at the top. */
  creditsToNext: number | null;
  /** 0–1, for a progress bar. */
  fraction: number;
};

export function progress(s: Standing): Progress {
  const rank = tierRank(s.tier);
  const next = rank >= TIER_ORDER.length - 1 ? null : TIER_ORDER[rank + 1];
  if (!next) return { tier: s.tier, next: null, creditsToNext: null, fraction: 1 };

  const target = TIER_THRESHOLDS[next as keyof typeof TIER_THRESHOLDS] ?? 0;
  const floor =
    rank === 0 ? 0 : TIER_THRESHOLDS[s.tier as keyof typeof TIER_THRESHOLDS] ?? 0;
  const span = Math.max(1, target - floor);
  const done = Math.min(span, Math.max(0, s.credits - floor));
  return {
    tier: s.tier,
    next,
    creditsToNext: Math.max(0, target - s.credits),
    fraction: done / span,
  };
}

/** Said plainly, without exposing a formula. */
export function describeStanding(s: Standing, locale: string): string {
  const es = locale === "es";
  if (s.inGrace) {
    const d = s.graceDaysLeft ?? 0;
    return es
      ? `Conservas ${s.tier} por ${d} día${d === 1 ? "" : "s"} más. Una compra lo renueva.`
      : `You keep ${s.tier} for ${d} more day${d === 1 ? "" : "s"}. One order renews it.`;
  }
  const p = progress(s);
  if (!p.next) {
    return es ? "Estás en lo más alto. Sigue así." : "You're at the top. Keep it going.";
  }
  return es
    ? `Cada compra, recomendación y nueva experiencia te acerca a ${p.next} — te ${p.creditsToNext === 1 ? "falta" : "faltan"} ${p.creditsToNext}.`
    : `Every purchase, recommendation and new experience brings you closer to ${p.next} — ${p.creditsToNext} to go.`;
}

/**
 * THE SWITCH.
 *
 * While this is false, nothing in the loyalty engine touches what a
 * customer is charged, shown, or given. Karina and Rubén have not approved
 * the change, and the open questions in docs/karyana-loyalty-club.md — how
 * points are earned against discounts, what `boxes` counts as, whether a
 * referral may stand in for a purchase — all have to be settled before it
 * can be anything but false.
 */
export const KLC_LIVE = false;
