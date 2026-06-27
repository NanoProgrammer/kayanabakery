/**
 * Pricing engine for Karyana Bakery checkout.
 * Pure functions — no DB, no fetch. Same logic client + server.
 * All amounts in CENTS.
 *
 * CHANGE: Artesano free delivery is NO LONGER automatic.
 * Artesano members receive a coupon code via newsletter for free delivery.
 * Only Selecto, Legendario, and Embajador get automatic free delivery.
 */

import { TIERS, pointsToCents, type MembershipTier } from "@/lib/membership/tiers";

export type FulfillmentType = "PICKUP" | "DELIVERY";

export type PricingInput = {
  items: { price: number; quantity: number; productId: string }[];
  fulfillmentType: FulfillmentType;
  tier: MembershipTier;
  isSouthEastCalgary: boolean;
  hasUsedFirstFreeDelivery: boolean;
  isGuest?: boolean;
  coupon?: {
    code: string;
    discountType: "PERCENT" | "FIXED" | "FREE_SHIPPING";
    discountValue: number;
    minOrderCents?: number;
  } | null;
  pointsToRedeem?: number;
  tipCents?: number;
  baseDeliveryFeeCents?: number;
  gstRate?: number;
  /** Fee cents for the selected priority slot (0 = free for this tier) */
  prioritySlotFeeCents?: number;
};

export type PricingBreakdown = {
  subtotalCents: number;
  couponDiscountCents: number;
  pointsDiscountCents: number;
  deliveryFeeCents: number;
  freeDeliveryReason:
    | null
    | "MEMBER_FREE_DELIVERY"
    | "FIRST_SE_DELIVERY"
    | "COUPON_FREE_SHIPPING"
    | "PICKUP";
  /** Extra fee for priority (before-6-PM) delivery slot. 0 if standard slot or free tier */
  prioritySlotFeeCents: number;
  tipCents: number;
  taxableCents: number;
  gstCents: number;
  totalCents: number;
  pointsEarned: number;
  errors: string[];
};

const DEFAULT_DELIVERY_FEE = 700;
const DEFAULT_GST = 0.05;

export function computePricing(input: PricingInput): PricingBreakdown {
  const errors: string[] = [];
  const baseDelivery = input.baseDeliveryFeeCents ?? DEFAULT_DELIVERY_FEE;
  const gstRate = input.gstRate ?? DEFAULT_GST;
  const tierData = TIERS[input.tier];
  const isGuest = input.isGuest ?? false;
  const tipCents = Math.max(0, Math.round(input.tipCents ?? 0));
  const prioritySlotFeeCents = Math.max(0, input.prioritySlotFeeCents ?? 0);

  // 1. Subtotal
  const subtotalCents = input.items.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );

  // 2. Coupon
  let couponDiscountCents = 0;
  let couponIsFreeShipping = false;

  if (input.coupon) {
    if (input.coupon.discountType === "FREE_SHIPPING") {
      couponIsFreeShipping = true;
    } else if (
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
      couponDiscountCents = Math.min(input.coupon.discountValue, subtotalCents);
    }
  }

  // 3. Points
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

  // 4. Delivery fee
  let deliveryFeeCents = 0;
  let freeDeliveryReason: PricingBreakdown["freeDeliveryReason"] = null;

  if (input.fulfillmentType === "PICKUP") {
    freeDeliveryReason = "PICKUP";
  } else if (couponIsFreeShipping) {
    // This is how Artesano members get free delivery — via newsletter coupon
    freeDeliveryReason = "COUPON_FREE_SHIPPING";
  } else if (isGuest) {
    // Guests ALWAYS pay delivery
    deliveryFeeCents = baseDelivery;
  } else {
    // CHANGED: Only Selecto+ gets automatic free delivery
    // Artesano must use newsletter coupon code for FREE_SHIPPING
    if (
      tierData.freeDeliveryAutomatic &&
      tierData.freeDeliveryMinOrderCents &&
      subtotalAfterDiscounts >= tierData.freeDeliveryMinOrderCents
    ) {
      freeDeliveryReason = "MEMBER_FREE_DELIVERY";
    } else if (input.isSouthEastCalgary && !input.hasUsedFirstFreeDelivery) {
      freeDeliveryReason = "FIRST_SE_DELIVERY";
    } else {
      deliveryFeeCents = baseDelivery;
    }
  }

  // 5. Tax (GST on subtotal-after-discounts + delivery + priority slot fee, NOT on tips)
  const taxableCents = subtotalAfterDiscounts + deliveryFeeCents + prioritySlotFeeCents;
  const gstCents = Math.round(taxableCents * gstRate);

  // 6. Total (tip NOT taxed)
  const totalCents = taxableCents + gstCents + tipCents;

  // 7. Points earned (guests don't earn)
  const dollars = Math.floor(subtotalCents / 100);
  const pointsEarned = isGuest
    ? 0
    : Math.floor(dollars * tierData.pointsMultiplier);

  if (subtotalCents <= 0) errors.push("Cart is empty");
  if (totalCents < 0) errors.push("Total cannot be negative");

  return {
    subtotalCents,
    couponDiscountCents,
    pointsDiscountCents,
    deliveryFeeCents,
    freeDeliveryReason,
    prioritySlotFeeCents,
    tipCents,
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
