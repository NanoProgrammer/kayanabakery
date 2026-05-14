/**
 * Karyana — Membership tiers source of truth
 *
 * All business rules for memberships live here. Other parts of the app
 * import from this file rather than hardcoding tier logic.
 *
 * Money values are in CENTS unless suffixed _DOLLARS.
 */

export type MembershipTier =
  | "BASICO"
  | "ARTESANO"
  | "SELECTO"
  | "LEGENDARIO"
  | "EMBAJADOR";

export type BillingCadence = "FREE" | "MONTHLY" | "YEARLY";

export interface TierBenefits {
  tier: MembershipTier;
  name: string;
  cadence: BillingCadence;
  priceCents: number;
  needsApproval: boolean;

  // Bread perks
  includedBreadWithPayment: boolean;
  firstBoxWith6FreePieces: boolean;
  weeklyOrderSkip: boolean;
  freeAdvanceSamples: boolean;

  // Catalog access
  outOfStockAccess: boolean;
  offSeasonAccess: boolean;
  preferralSeasonalAccess: boolean;

  // Delivery
  freeDelivery: boolean;
  freeDeliveryMinOrderCents: number | null;
  pickupOnly: boolean;

  // Birthday
  birthdayPoints: number;

  // Free new bread quota
  freeNewBreadPerMonth: number;
  freeNewBreadOnlyFirstOrder: boolean;

  // Coupons / promos
  autoMonthlyPromos: boolean;
  partnerDiscounts: boolean;

  // Points
  pointsMultiplier: number;

  // Ambassador-specific
  paidForDelivery: boolean;
  ambassadorPayoutCents: number; // 0 if not applicable
  personalizedService: boolean;
}

export const TIERS: Record<MembershipTier, TierBenefits> = {
  BASICO: {
    tier: "BASICO",
    name: "Básico",
    cadence: "FREE",
    priceCents: 0,
    needsApproval: false,

    includedBreadWithPayment: false,
    firstBoxWith6FreePieces: false,
    weeklyOrderSkip: false,
    freeAdvanceSamples: false,

    outOfStockAccess: false,
    offSeasonAccess: false,
    preferralSeasonalAccess: false,

    freeDelivery: false,
    freeDeliveryMinOrderCents: null,
    pickupOnly: false,

    birthdayPoints: 0,

    freeNewBreadPerMonth: 0,
    freeNewBreadOnlyFirstOrder: true,

    autoMonthlyPromos: false,
    partnerDiscounts: false,

    pointsMultiplier: 1,

    paidForDelivery: false,
    ambassadorPayoutCents: 0,
    personalizedService: false,
  },

  ARTESANO: {
    tier: "ARTESANO",
    name: "Artesano",
    cadence: "YEARLY",
    priceCents: 3900, // $39/year
    needsApproval: false,

    includedBreadWithPayment: false,
    firstBoxWith6FreePieces: false,
    weeklyOrderSkip: false,
    freeAdvanceSamples: false,

    outOfStockAccess: true,
    offSeasonAccess: true,
    preferralSeasonalAccess: true,

    freeDelivery: true,
    freeDeliveryMinOrderCents: 3200, // $32 minimum
    pickupOnly: false,

    birthdayPoints: 500,

    freeNewBreadPerMonth: 1,
    freeNewBreadOnlyFirstOrder: false,

    autoMonthlyPromos: true,
    partnerDiscounts: true,

    pointsMultiplier: 2,

    paidForDelivery: false,
    ambassadorPayoutCents: 0,
    personalizedService: true,
  },

  SELECTO: {
    tier: "SELECTO",
    name: "Selecto",
    cadence: "MONTHLY",
    priceCents: 3000, // $30/month
    needsApproval: false,

    includedBreadWithPayment: true,
    firstBoxWith6FreePieces: true,
    weeklyOrderSkip: true,
    freeAdvanceSamples: true,

    outOfStockAccess: true,
    offSeasonAccess: true,
    preferralSeasonalAccess: true,

    freeDelivery: true,
    freeDeliveryMinOrderCents: 2500, // $25
    pickupOnly: false,

    birthdayPoints: 500,

    freeNewBreadPerMonth: 2,
    freeNewBreadOnlyFirstOrder: false,

    autoMonthlyPromos: true,
    partnerDiscounts: true,

    pointsMultiplier: 4,

    paidForDelivery: false,
    ambassadorPayoutCents: 0,
    personalizedService: true,
  },

  LEGENDARIO: {
    tier: "LEGENDARIO",
    name: "Legendario",
    cadence: "MONTHLY",
    priceCents: 5000, // $50/month
    needsApproval: false,

    includedBreadWithPayment: true,
    firstBoxWith6FreePieces: true,
    weeklyOrderSkip: true,
    freeAdvanceSamples: true,

    outOfStockAccess: true,
    offSeasonAccess: true,
    preferralSeasonalAccess: true,

    freeDelivery: true,
    freeDeliveryMinOrderCents: 2500,
    pickupOnly: false,

    birthdayPoints: 500,

    freeNewBreadPerMonth: 4,
    freeNewBreadOnlyFirstOrder: false,

    autoMonthlyPromos: true,
    partnerDiscounts: true,

    pointsMultiplier: 5,

    paidForDelivery: false,
    ambassadorPayoutCents: 0,
    personalizedService: true,
  },

  EMBAJADOR: {
    tier: "EMBAJADOR",
    name: "Embajador",
    cadence: "FREE",
    priceCents: 0,
    needsApproval: true,

    includedBreadWithPayment: false,
    firstBoxWith6FreePieces: false,
    weeklyOrderSkip: true,
    freeAdvanceSamples: true,

    outOfStockAccess: true,
    offSeasonAccess: true,
    preferralSeasonalAccess: true,

    freeDelivery: false, // pickup only
    freeDeliveryMinOrderCents: null,
    pickupOnly: true,

    birthdayPoints: 500,

    freeNewBreadPerMonth: 4, // once per week ≈ 4/month
    freeNewBreadOnlyFirstOrder: false,

    autoMonthlyPromos: true,
    partnerDiscounts: true,

    pointsMultiplier: 10,

    paidForDelivery: true,
    ambassadorPayoutCents: 800, // $8 default; bumped to $10 by tier of recipient
    personalizedService: true,
  },
};

/**
 * Ambassador payout depends on the tier of the customer they delivered TO.
 * - Artesano / Selecto recipient → $8
 * - Legendario recipient → $10
 */
export function ambassadorPayoutCents(
  recipientTier: MembershipTier
): number {
  return recipientTier === "LEGENDARIO" ? 1000 : 800;
}

/**
 * Points earned for an order:
 *   floor(orderTotalDollars) × tier.pointsMultiplier
 * Points are NOT earned on the membership fee itself or on points-redeemed amount.
 */
export function calculatePointsEarned(
  eligibleSubtotalCents: number,
  tier: MembershipTier
): number {
  const dollars = Math.floor(eligibleSubtotalCents / 100);
  return dollars * TIERS[tier].pointsMultiplier;
}

/** Convert points to dollar value: 100 pts = $1 */
export function pointsToDollars(points: number): number {
  return points / 100;
}
export function pointsToCents(points: number): number {
  return points; // 100 pts = $1 = 100¢ → 1 pt = 1¢
}
export function dollarsToPoints(dollars: number): number {
  return Math.floor(dollars * 100);
}

/** Display label including price */
export function tierPriceLabel(tier: MembershipTier): string {
  const t = TIERS[tier];
  if (t.cadence === "FREE") return t.needsApproval ? "Free (approval)" : "Free";
  const dollars = (t.priceCents / 100).toFixed(0);
  return t.cadence === "YEARLY" ? `$${dollars}/year` : `$${dollars}/month`;
}

/** Tier hierarchy for "Selecto+" style checks */
const TIER_RANK: Record<MembershipTier, number> = {
  BASICO: 0,
  ARTESANO: 1,
  SELECTO: 2,
  LEGENDARIO: 3,
  EMBAJADOR: 2, // treat ambassador roughly = Selecto for catalog perks
};

export function tierMeets(
  userTier: MembershipTier,
  required: MembershipTier
): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[required];
}
