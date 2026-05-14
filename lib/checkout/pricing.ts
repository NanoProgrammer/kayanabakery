/**
 * Pricing engine for Karyana Bakery checkout.
 * Pure functions — no DB, no fetch. Use the same logic on client (preview)
 * and server (final calculation, source of truth).
 *
 * All amounts in CENTS (integers) to avoid float math.
 */

import { TIERS, pointsToCents, type MembershipTier } from "@/lib/membership/tiers";

export type FulfillmentType = "PICKUP" | "DELIVERY";

export type PricingInput = {
  /** Cart items with price (in cents) and quantity */
  items: { price: number; quantity: number; productId: string }[];
  fulfillmentType: FulfillmentType;
  /** Customer's tier (defaults BASICO) */
  tier: MembershipTier;
  /** Whether the delivery address is in Southeast Calgary */
  isSouthEastCalgary: boolean;
  /** Whether this customer has used their first-free-delivery already */
  hasUsedFirstFreeDelivery: boolean;
  /** Coupon if any (already validated). Discount applied to subtotal. */
  coupon?: {
    code: string;
    discountType: "PERCENT" | "FIXED";
    /** percent (0-100) or cents */
    discountValue: number;
    minOrderCents?: number;
  } | null;
  /** Points the customer wants to redeem */
  pointsToRedeem?: number;
  /** Pickup is free; delivery has a base fee */
  baseDeliveryFeeCents?: number;
  /** GST rate. Alberta = 5% */
  gstRate?: number;
};

export type PricingBreakdown = {
  subtotalCents: number;
  couponDiscountCents: number;
  pointsDiscountCents: number;
  deliveryFeeCents: number;
  /** Reason free delivery was applied (or null) */
  freeDeliveryReason:
    | null
    | "MEMBER_FREE_DELIVERY"
    | "FIRST_SE_DELIVERY"
    | "PICKUP";
  taxableCents: number;
  gstCents: number;
  totalCents: number;
  pointsEarned: number;
  /** Errors that prevent checkout */
  errors: string[];
};

const DEFAULT_DELIVERY_FEE_CENTS = 700; // $7
const DEFAULT_GST = 0.05;

export function computePricing(input: PricingInput): PricingBreakdown {
  const errors: string[] = [];
  const baseDelivery =
    input.baseDeliveryFeeCents ?? DEFAULT_DELIVERY_FEE_CENTS;
  const gstRate = input.gstRate ?? DEFAULT_GST;
  const tierData = TIERS[input.tier];

  // 1. Subtotal
  const subtotalCents = input.items.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );

  // 2. Coupon discount (apply against subtotal)
  let couponDiscountCents = 0;
  if (input.coupon) {
    if (
      input.coupon.minOrderCents &&
      subtotalCents < input.coupon.minOrderCents
    ) {
      errors.push(
        `Coupon requires min order of $${(input.coupon.minOrderCents / 100).toFixed(2)}`
      );
    } else if (input.coupon.discountType === "PERCENT") {
      couponDiscountCents = Math.floor(
        (subtotalCents * Math.min(100, input.coupon.discountValue)) / 100
      );
    } else {
      couponDiscountCents = Math.min(
        input.coupon.discountValue,
        subtotalCents
      );
    }
  }

  // 3. Points discount
  let pointsDiscountCents = 0;
  if (input.pointsToRedeem && input.pointsToRedeem > 0) {
    pointsDiscountCents = Math.min(
      pointsToCents(input.pointsToRedeem),
      subtotalCents - couponDiscountCents
    );
    if (pointsDiscountCents < 0) pointsDiscountCents = 0;
  }

  const subtotalAfterDiscounts =
    subtotalCents - couponDiscountCents - pointsDiscountCents;

  // 4. Delivery fee logic
  let deliveryFeeCents = 0;
  let freeDeliveryReason: PricingBreakdown["freeDeliveryReason"] = null;

  if (input.fulfillmentType === "PICKUP") {
    freeDeliveryReason = "PICKUP";
    deliveryFeeCents = 0;
  } else {
    // Member free delivery (with min order check)
    if (
      tierData.freeDelivery &&
      tierData.freeDeliveryMinOrderCents &&
      subtotalAfterDiscounts >= tierData.freeDeliveryMinOrderCents
    ) {
      freeDeliveryReason = "MEMBER_FREE_DELIVERY";
      deliveryFeeCents = 0;
    } else if (
      // First-time SE Calgary customer free delivery
      input.isSouthEastCalgary &&
      !input.hasUsedFirstFreeDelivery
    ) {
      freeDeliveryReason = "FIRST_SE_DELIVERY";
      deliveryFeeCents = 0;
    } else {
      deliveryFeeCents = baseDelivery;
    }
  }

  // 5. Tax (GST 5% on subtotal-after-discounts + delivery)
  const taxableCents = subtotalAfterDiscounts + deliveryFeeCents;
  const gstCents = Math.round(taxableCents * gstRate);

  // 6. Total
  const totalCents = taxableCents + gstCents;

  // 7. Points earned (1pt per dollar × tier multiplier, on subtotal pre-tax pre-discount)
  const dollars = Math.floor(subtotalCents / 100);
  const pointsEarned = Math.floor(dollars * tierData.pointsMultiplier);

  // 8. Validations
  if (subtotalCents <= 0) errors.push("Cart is empty");
  if (totalCents < 0) errors.push("Total cannot be negative");

  return {
    subtotalCents,
    couponDiscountCents,
    pointsDiscountCents,
    deliveryFeeCents,
    freeDeliveryReason,
    taxableCents,
    gstCents,
    totalCents,
    pointsEarned,
    errors,
  };
}

export function formatCents(cents: number, locale: string = "en"): string {
  return new Intl.NumberFormat(locale === "es" ? "es-MX" : "en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}
