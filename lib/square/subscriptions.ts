import { squareClient, SQUARE_LOCATION_ID } from "./client";
import { randomUUID } from "crypto";
import type { MembershipTier } from "../membership/tiers";

// Precio en centavos por tier
export function tierPriceCents(tier: MembershipTier): number {
  switch (tier) {
    case "ARTESANO":   return 3900;  // $39/año
    case "SELECTO":    return 3000;  // $30/mes
    case "LEGENDARIO": return 5000;  // $50/mes
    default:           return 0;
  }
}

// Artesano = anual, los demás = mensual
export function tierBillingCycle(tier: MembershipTier): "YEARLY" | "MONTHLY" {
  return tier === "ARTESANO" ? "YEARLY" : "MONTHLY";
}

// Fecha de próxima renovación
export function nextRenewDate(tier: MembershipTier, from = new Date()): Date {
  const d = new Date(from);
  if (tier === "ARTESANO") {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

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

/**
 * Charge a saved card for a membership renewal.
 * Used by the subscribe endpoint (first charge) and the cron job (renewals).
 */
export async function chargeCardOnFile(input: {
  customerId: string;
  cardId: string;
  amountCents: number;
  note: string;
  idempotencyKey?: string;
}): Promise<{ paymentId: string }> {
  const res = await squareClient.payments.create({
    sourceId: input.cardId,
    idempotencyKey: input.idempotencyKey ?? randomUUID(),
    amountMoney: {
      amount: BigInt(input.amountCents),
      currency: "CAD",
    },
    customerId: input.customerId,
    locationId: SQUARE_LOCATION_ID,
    note: input.note,
    autocomplete: true,
  });

  const paymentId = res.payment?.id;
  if (!paymentId) throw new Error("Square payment failed");
  return { paymentId };
}