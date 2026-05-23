/**
 * Karyana — Membership tiers source of truth
 *
 * CHANGE: Artesano free delivery is NO LONGER automatic.
 * Artesano members receive a FREE_SHIPPING coupon code via newsletter.
 * Only Selecto, Legendario get automatic free delivery with min order.
 * New field: freeDeliveryAutomatic (boolean) — true only for Selecto+.
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
  /** NEW: Whether free delivery is automatic or requires a coupon */
  freeDeliveryAutomatic: boolean;
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
  ambassadorPayoutCents: number;
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
    freeDeliveryAutomatic: false,
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
    priceCents: 3900,
    needsApproval: false,

    includedBreadWithPayment: false,
    firstBoxWith6FreePieces: false,
    weeklyOrderSkip: false,
    freeAdvanceSamples: false,

    outOfStockAccess: true,
    offSeasonAccess: true,
    preferralSeasonalAccess: true,

    // CHANGED: freeDelivery is technically available but NOT automatic
    // Artesano must use a newsletter coupon code for free shipping
    freeDelivery: true,
    freeDeliveryAutomatic: false, // <-- KEY CHANGE
    freeDeliveryMinOrderCents: 3200,
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
    priceCents: 3000,
    needsApproval: false,

    includedBreadWithPayment: true,
    firstBoxWith6FreePieces: true,
    weeklyOrderSkip: true,
    freeAdvanceSamples: true,

    outOfStockAccess: true,
    offSeasonAccess: true,
    preferralSeasonalAccess: true,

    freeDelivery: true,
    freeDeliveryAutomatic: true, // Selecto gets it automatically
    freeDeliveryMinOrderCents: 2500,
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
    priceCents: 5000,
    needsApproval: false,

    includedBreadWithPayment: true,
    firstBoxWith6FreePieces: true,
    weeklyOrderSkip: true,
    freeAdvanceSamples: true,

    outOfStockAccess: true,
    offSeasonAccess: true,
    preferralSeasonalAccess: true,

    freeDelivery: true,
    freeDeliveryAutomatic: true, // Legendario gets it automatically
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

    freeDelivery: false,
    freeDeliveryAutomatic: false,
    freeDeliveryMinOrderCents: null,
    pickupOnly: true,

    birthdayPoints: 500,

    freeNewBreadPerMonth: 4,
    freeNewBreadOnlyFirstOrder: false,

    autoMonthlyPromos: true,
    partnerDiscounts: true,

    pointsMultiplier: 10,

    paidForDelivery: true,
    ambassadorPayoutCents: 800,
    personalizedService: true,
  },
};

/**
 * Ambassador payout depends on the tier of the customer they delivered TO.
 */
export function ambassadorPayoutCents(
  recipientTier: MembershipTier
): number {
  return recipientTier === "LEGENDARIO" ? 1000 : 800;
}

export function calculatePointsEarned(
  eligibleSubtotalCents: number,
  tier: MembershipTier
): number {
  const dollars = Math.floor(eligibleSubtotalCents / 100);
  return dollars * TIERS[tier].pointsMultiplier;
}

export function pointsToDollars(points: number): number {
  return points / 100;
}
export function pointsToCents(points: number): number {
  return points;
}
export function dollarsToPoints(dollars: number): number {
  return Math.floor(dollars * 100);
}

export function tierPriceLabel(tier: MembershipTier): string {
  const t = TIERS[tier];
  if (t.cadence === "FREE") return t.needsApproval ? "Free (approval)" : "Free";
  const dollars = (t.priceCents / 100).toFixed(0);
  return t.cadence === "YEARLY" ? `$${dollars}/year` : `$${dollars}/month`;
}

const TIER_RANK: Record<MembershipTier, number> = {
  BASICO: 0,
  ARTESANO: 1,
  SELECTO: 2,
  LEGENDARIO: 3,
  EMBAJADOR: 2,
};

export function tierMeets(
  userTier: MembershipTier,
  required: MembershipTier
): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[required];
}
