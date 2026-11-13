/**
 * Karyana Loyalty Credits (KLC) — the scoring engine.
 *
 * PROPOSAL, NOT LIVE. Nothing in this file is wired into the checkout, the
 * membership, or the tier a customer actually holds today. It exists so the
 * rules in docs/karyana-loyalty-club.md can be simulated and argued about
 * against real numbers before anyone decides to switch tiers from paid to
 * earned. Rubén and Karina have not approved deployment, and the thresholds
 * below are explicitly provisional.
 *
 * Three balances are kept apart and must never be exchanged for one another
 * (spec requirement F.2):
 *
 *   1. Prepaid money   — what members already bought. An obligation. Today
 *                        this is Membership fee → points at face value.
 *   2. Karyana Points  — redeemable at 1 point = 1 cent.
 *   3. KLC             — recognition only. Earns a tier. NOT spendable,
 *                        NOT convertible to points, NOT money.
 *
 * This file only ever computes KLC. It cannot grant points and must not be
 * given the ability to.
 */

/** Proposed thresholds. Not final — section 4 of the addendum. */
export const TIER_THRESHOLDS = {
  ARTESANO: 4,
  SELECTO: 10,
  LEGENDARIO: 18,
} as const;

/** Legendario also needs this many personal purchases, on distinct dates. */
export const LEGENDARIO_MIN_PERSONAL_PURCHASES = 4;

/** KLC for a referred person's FIRST VALID PURCHASE. Registering earns none. */
export const KLC_PER_CONVERTED_REFERRAL = 2;

/** KLC the first time a member buys from a product family. */
export const KLC_PER_NEW_FAMILY = 1;

/**
 * The ceiling on referral + exploration KLC over a rolling 365 days.
 * Independent of the operational limit of 10 referrals per cycle.
 */
export const BONUS_KLC_CAP_PER_YEAR = 6;

export const ROLLING_WINDOW_DAYS = 365;

/**
 * The four product families, as the addendum names them.
 *
 * The category slugs are a FIRST MAPPING and need confirming against the
 * catalog — the addendum says so explicitly. A product in no family earns no
 * exploration credit rather than being guessed into one.
 */
export const PRODUCT_FAMILIES = {
  CONCHAS_PAN_DULCE: ["conchas", "pan-dulce"],
  PAN_TRADICIONAL: ["pan", "pan-tradicional", "temporada", "seasonal"],
  PASTELES: ["cakes", "tres-leches", "gourmet", "clasicos", "celebraciones"],
  POSTRES: ["postres", "gelatinas-y-flanes", "especialidades", "desserts"],
} as const;

export type ProductFamily = keyof typeof PRODUCT_FAMILIES;

export function familyForCategories(
  categorySlugs: readonly string[] | null | undefined
): ProductFamily | null {
  if (!categorySlugs?.length) return null;
  const slugs = categorySlugs.map((s) => s.toLowerCase());
  for (const [family, members] of Object.entries(PRODUCT_FAMILIES) as [
    ProductFamily,
    readonly string[]
  ][]) {
    if (members.some((m) => slugs.includes(m))) return family;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Credit events                                                       */
/* ------------------------------------------------------------------ */

export type KlcKind = "PURCHASE" | "SPEND" | "TENURE" | "REFERRAL" | "EXPLORATION";

/** The bonus pillars, the two the yearly cap applies to. */
export const CAPPED_KINDS: KlcKind[] = ["REFERRAL", "EXPLORATION"];

export type KlcEvent = {
  kind: KlcKind;
  credits: number;
  at: Date;
  /**
   * What this credit is for, exactly once. A referred person's first
   * purchase, or a family first bought — the same key can never be credited
   * twice (spec requirement: idempotency).
   */
  idempotencyKey: string;
  /** The order or customer this came from, for the audit trail. */
  reference?: string;
};

/**
 * Removes anything already credited under the same key.
 *
 * The addendum requires that a first-purchase event cannot be credited
 * twice. Doing it here rather than relying on a database constraint means
 * the simulation behaves like the real thing, and the real thing gets a
 * constraint as well.
 */
export function dedupeEvents(events: readonly KlcEvent[]): KlcEvent[] {
  const seen = new Set<string>();
  const kept: KlcEvent[] = [];
  for (const event of [...events].sort((a, b) => a.at.getTime() - b.at.getTime())) {
    if (seen.has(event.idempotencyKey)) continue;
    seen.add(event.idempotencyKey);
    kept.push(event);
  }
  return kept;
}

export type CappedTotals = {
  /** Credits granted, after the yearly cap on the bonus pillars. */
  granted: number;
  /** Credits refused because the cap was already reached. */
  refused: number;
};

/**
 * Applies the 6-per-365-days ceiling to referral and exploration credits.
 *
 * Rolling, not calendar: each event is checked against the bonus credits
 * already granted in the 365 days before it. A credit over the ceiling is
 * NOT granted — the addendum says it is refused, not deferred, so it does
 * not come back later.
 */
export function applyBonusCap(
  events: readonly KlcEvent[],
  now: Date
): { events: KlcEvent[]; totals: CappedTotals } {
  const ordered = dedupeEvents(events);
  const kept: KlcEvent[] = [];
  const grantedBonus: KlcEvent[] = [];
  let granted = 0;
  let refused = 0;

  for (const event of ordered) {
    if (!CAPPED_KINDS.includes(event.kind)) {
      kept.push(event);
      continue;
    }
    const windowStart = event.at.getTime() - ROLLING_WINDOW_DAYS * 86_400_000;
    const inWindow = grantedBonus
      .filter((e) => e.at.getTime() > windowStart)
      .reduce((sum, e) => sum + e.credits, 0);
    const room = BONUS_KLC_CAP_PER_YEAR - inWindow;
    if (room <= 0) {
      refused += event.credits;
      continue;
    }
    if (event.credits > room) {
      // Partial grants are not described anywhere, and inventing one would
      // hand out a credit nobody approved. The whole event is refused.
      refused += event.credits;
      continue;
    }
    kept.push(event);
    grantedBonus.push(event);
    granted += event.credits;
  }

  return { events: kept, totals: { granted, refused } };
}

/* ------------------------------------------------------------------ */
/* The tier                                                            */
/* ------------------------------------------------------------------ */

export type PurchaseRecord = {
  /** The bakery-local date, YYYY-MM-DD. Distinct dates are what count. */
  day: string;
  /** Whether this order is valid and verifiable — see integrity rules. */
  valid: boolean;
};

/** Personal purchases on distinct days. Two orders in one day count once. */
export function countPersonalPurchases(purchases: readonly PurchaseRecord[]): number {
  return new Set(purchases.filter((p) => p.valid).map((p) => p.day)).size;
}

export type EarnedTier = "BASICO" | "ARTESANO" | "SELECTO" | "LEGENDARIO";

export type TierResult = {
  tier: EarnedTier;
  credits: number;
  personalPurchases: number;
  /** Set when the credits reach Legendario but the purchases do not. */
  heldBack: "NEEDS_PERSONAL_PURCHASES" | null;
};

/**
 * The tier a member has earned.
 *
 * The five pillars are ALTERNATIVE ways of accumulating credits, not five
 * requirements — tenure, referrals and exploration are optional bonuses. A
 * new customer can reach Legendario with no tenure at all, as long as both
 * Legendario conditions are met. (Clarified by email, 12 Nov 2026, 9:01 PM.)
 *
 * Legendario needs BOTH:
 *   - 18 KLC, and
 *   - at least 4 verified personal purchases on distinct dates.
 *
 * Referrals and exploration cannot substitute for those purchases, which is
 * why the second condition is checked against purchases and not credits.
 */
export function earnedTier(
  credits: number,
  purchases: readonly PurchaseRecord[]
): TierResult {
  const personalPurchases = countPersonalPurchases(purchases);
  const base = { credits, personalPurchases };

  if (credits >= TIER_THRESHOLDS.LEGENDARIO) {
    if (personalPurchases >= LEGENDARIO_MIN_PERSONAL_PURCHASES) {
      return { ...base, tier: "LEGENDARIO", heldBack: null };
    }
    // The credits are there, the purchases are not. They hold the highest
    // tier the credits alone can earn, and are told what is missing.
    return { ...base, tier: "SELECTO", heldBack: "NEEDS_PERSONAL_PURCHASES" };
  }
  if (credits >= TIER_THRESHOLDS.SELECTO) return { ...base, tier: "SELECTO", heldBack: null };
  if (credits >= TIER_THRESHOLDS.ARTESANO) return { ...base, tier: "ARTESANO", heldBack: null };
  return { ...base, tier: "BASICO", heldBack: null };
}

/** Total credits from a list of events, with the yearly cap applied. */
export function totalCredits(events: readonly KlcEvent[], now: Date): number {
  return applyBonusCap(events, now).events.reduce((sum, e) => sum + e.credits, 0);
}

/* ------------------------------------------------------------------ */
/* What the member is shown                                            */
/* ------------------------------------------------------------------ */

/**
 * Progress toward the next tier, without exposing the formula — the
 * addendum asks for recognition that is easy to understand, not an equation.
 */
export function describeProgress(result: TierResult, locale: string): string {
  const es = locale === "es";
  if (result.heldBack === "NEEDS_PERSONAL_PURCHASES") {
    const left = LEGENDARIO_MIN_PERSONAL_PURCHASES - result.personalPurchases;
    return es
      ? `Te ${left === 1 ? "falta" : "faltan"} ${left} ${left === 1 ? "compra" : "compras"} para Legendario`
      : `${left} more ${left === 1 ? "purchase" : "purchases"} to reach Legendario`;
  }
  if (result.tier === "LEGENDARIO") {
    return es ? "Eres Legendario" : "You are Legendario";
  }
  const next =
    result.tier === "BASICO"
      ? TIER_THRESHOLDS.ARTESANO
      : result.tier === "ARTESANO"
      ? TIER_THRESHOLDS.SELECTO
      : TIER_THRESHOLDS.LEGENDARIO;
  const nextName =
    result.tier === "BASICO" ? "Artesano" : result.tier === "ARTESANO" ? "Selecto" : "Legendario";
  const left = next - result.credits;
  return es
    ? `Cada compra, recomendación y nueva experiencia te acerca a ${nextName} — te ${left === 1 ? "falta" : "faltan"} ${left}`
    : `Every purchase, recommendation and new experience brings you closer to ${nextName} — ${left} to go`;
}

/* ------------------------------------------------------------------ */
/* Integrity                                                           */
/* ------------------------------------------------------------------ */

export type ReferralCandidate = {
  referrerId: string;
  referredUserId: string;
  /** Whether the referred person has made a first VALID purchase. */
  hasFirstValidPurchase: boolean;
  /** Same person behind two accounts — matched email, phone or card. */
  suspectedSameParty: boolean;
  /** An order marked as a test, a duplicate, or later refunded. */
  orderIsTest: boolean;
};

export type ReferralVerdict =
  | { creditable: true }
  | { creditable: false; reason: "no_purchase_yet" | "self_referral" | "same_party" | "test_order" };

/**
 * Whether a referral may be credited with KLC.
 *
 * Registering alone earns nothing: the addendum is explicit that the credit
 * follows a first VALID purchase. The Karyana Points reward for registering
 * is a separate system with its own rules and is deliberately untouched by
 * this function.
 */
export function isCreditableReferral(candidate: ReferralCandidate): ReferralVerdict {
  if (candidate.referrerId === candidate.referredUserId) {
    return { creditable: false, reason: "self_referral" };
  }
  if (candidate.suspectedSameParty) return { creditable: false, reason: "same_party" };
  if (candidate.orderIsTest) return { creditable: false, reason: "test_order" };
  if (!candidate.hasFirstValidPurchase) return { creditable: false, reason: "no_purchase_yet" };
  return { creditable: true };
}

/** The audit row every granted credit must write (addendum, integrity 3). */
export type KlcAuditRow = {
  at: Date;
  kind: KlcKind;
  credits: number;
  idempotencyKey: string;
  reference: string | null;
  outcome: "granted" | "refused";
  refusedReason?: string;
};

export function auditRowsFor(
  events: readonly KlcEvent[],
  now: Date
): KlcAuditRow[] {
  const { events: kept } = applyBonusCap(events, now);
  const keptKeys = new Set(kept.map((e) => e.idempotencyKey));
  const seen = new Set<string>();
  const rows: KlcAuditRow[] = [];

  for (const event of [...events].sort((a, b) => a.at.getTime() - b.at.getTime())) {
    const duplicate = seen.has(event.idempotencyKey);
    seen.add(event.idempotencyKey);
    const granted = !duplicate && keptKeys.has(event.idempotencyKey);
    rows.push({
      at: event.at,
      kind: event.kind,
      credits: event.credits,
      idempotencyKey: event.idempotencyKey,
      reference: event.reference ?? null,
      outcome: granted ? "granted" : "refused",
      ...(granted
        ? {}
        : { refusedReason: duplicate ? "duplicate" : "yearly_cap" }),
    });
  }
  return rows;
}
