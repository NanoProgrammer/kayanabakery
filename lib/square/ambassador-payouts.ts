/**
 * Karyana — Pay ambassadors for completed deliveries.
 *
 * Square's Payouts API for sending money to a third party requires
 * Square Cash App or bank account on the recipient side. The simplest
 * MVP is to record the payout as INTERNAL CREDIT and have the owner
 * issue payment manually OR via Square's "Send invoice" / Cash App.
 *
 * This file marks the AmbassadorDelivery as PAID and stores a
 * `squarePayoutId` if a real payout is wired up later. For now, it
 * just records and lets admin pay manually.
 */

import { prisma } from "../prisma";

export async function markAmbassadorDeliveryPaid(input: {
  ambassadorDeliveryId: string;
  squarePayoutId?: string | null;
}) {
  return prisma.ambassadorDelivery.update({
    where: { id: input.ambassadorDeliveryId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      squarePayoutId: input.squarePayoutId ?? null,
    },
  });
}

export async function listUnpaidAmbassadorDeliveries(ambassadorId?: string) {
  return prisma.ambassadorDelivery.findMany({
    where: {
      status: { in: ["COMPLETED"] },
      ...(ambassadorId ? { ambassadorId } : {}),
    },
    include: { order: true, ambassador: true },
    orderBy: { completedAt: "desc" },
  });
}
