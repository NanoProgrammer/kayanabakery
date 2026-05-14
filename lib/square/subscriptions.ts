/**
 * Karyana — Square Subscriptions wrapper
 *
 * Used for paid memberships (Artesano $39/year, Selecto $30/month,
 * Legendario $50/month). Square requires a Catalog item + variation
 * (with a subscription plan) per tier. The variation IDs come from env.
 *
 * Required env:
 *   SQUARE_PLAN_ARTESANO_VARIATION_ID
 *   SQUARE_PLAN_SELECTO_VARIATION_ID
 *   SQUARE_PLAN_LEGENDARIO_VARIATION_ID
 *
 * To set up plans (one-time, in Square dashboard):
 *  1. Create a "Karyana Membership" item with three variations (one per paid tier)
 *  2. Create a subscription plan for each variation
 *  3. Copy the plan variation IDs into env vars
 */

import { squareClient, SQUARE_LOCATION_ID } from "./client";
import { randomUUID } from "crypto";
import type { MembershipTier } from "../membership/tiers";

function planVariationIdFor(tier: MembershipTier): string | null {
  switch (tier) {
    case "ARTESANO":
      return process.env.SQUARE_PLAN_ARTESANO_VARIATION_ID || null;
    case "SELECTO":
      return process.env.SQUARE_PLAN_SELECTO_VARIATION_ID || null;
    case "LEGENDARIO":
      return process.env.SQUARE_PLAN_LEGENDARIO_VARIATION_ID || null;
    default:
      return null; // BASICO and EMBAJADOR are free
  }
}

/**
 * Ensure a Square Customer exists for this Karyana user; return its id.
 * Caches by passing in the existing customerId if known.
 */
export async function ensureSquareCustomer(input: {
  existingCustomerId?: string | null;
  email: string;
  givenName?: string | null;
  familyName?: string | null;
  phone?: string | null;
}): Promise<string> {
  if (input.existingCustomerId) return input.existingCustomerId;

  const res = await squareClient.customers.create({
    idempotencyKey: randomUUID(),
    emailAddress: input.email,
    givenName: input.givenName ?? undefined,
    familyName: input.familyName ?? undefined,
    phoneNumber: input.phone ?? undefined,
  });
  const id = res.customer?.id;
  if (!id) throw new Error("Failed to create Square customer");
  return id;
}

/**
 * Create a subscription on a paid plan. Returns the Square subscription id.
 * The card on file (sourceId) must already be attached to the customer
 * via /v2/cards (we do that in the membership signup endpoint).
 */
export async function createSquareSubscription(input: {
  customerId: string;
  cardId: string;
  tier: MembershipTier;
}): Promise<{ subscriptionId: string; renewDate?: string | null }> {
  const planVariationId = planVariationIdFor(input.tier);
  if (!planVariationId) {
    throw new Error(`No Square plan configured for tier ${input.tier}`);
  }

  const res = await squareClient.subscriptions.create({
    idempotencyKey: randomUUID(),
    locationId: SQUARE_LOCATION_ID,
    planVariationId,
    customerId: input.customerId,
    cardId: input.cardId,
  });

  const subscriptionId = res.subscription?.id;
  if (!subscriptionId) throw new Error("Square subscription creation failed");
  return {
    subscriptionId,
    renewDate: res.subscription?.chargedThroughDate ?? null,
  };
}

export async function cancelSquareSubscription(
  subscriptionId: string
): Promise<void> {
  await squareClient.subscriptions.cancel({ subscriptionId });
}

/**
 * Save a payment source (card) onto a Square Customer for recurring billing.
 * Called from the membership signup form once we have a card token.
 */
export async function saveCardOnFile(input: {
  customerId: string;
  sourceId: string;
}): Promise<{ cardId: string }> {
  const res = await squareClient.cards.create({
    idempotencyKey: randomUUID(),
    sourceId: input.sourceId,
    card: { customerId: input.customerId },
  });
  const cardId = res.card?.id;
  if (!cardId) throw new Error("Failed to save card on file");
  return { cardId };
}
