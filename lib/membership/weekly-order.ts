/**
 * Creates the automatic weekly order for Selecto/Legendario members
 * on "Repeat Last Order" mode. Charges the same card on file used for
 * their membership subscription.
 *
 * Scope note: auto-created weekly orders default to PICKUP — no
 * delivery slot exists to auto-select, and the Google Calendar
 * reservation flow isn't safe to run unattended. Staff should follow
 * up with delivery members to schedule the actual handoff.
 */
import { prisma } from "@/lib/prisma";
import { chargeCardOnFile } from "@/lib/square/subscriptions";
import { computePricing } from "@/lib/checkout/pricing";
import { generateOrderNumber } from "@/lib/checkout/order-number";
import { sendOrderEmails } from "@/lib/email/send-order-emails";
import type { MembershipTier } from "@/lib/membership/tiers";

export async function createWeeklyOrder({
  userId,
  tier,
  squareCustomerId,
  squareCardId,
}: {
  userId: string;
  tier: MembershipTier;
  squareCustomerId: string;
  squareCardId: string;
}): Promise<{ orderId: string } | { error: string }> {
  const lastOrder = await prisma.order.findFirst({
    where: { userId, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
  });

  if (!lastOrder) {
    return { error: "No previous order on file to repeat" };
  }

  const items = (lastOrder.items as any[]) || [];
  if (items.length === 0) {
    return { error: "Last order has no items" };
  }

  const hasUsedFirstFreeDelivery =
    (await prisma.order.count({
      where: { userId, fulfillmentType: "DELIVERY", status: { not: "CANCELLED" } },
    })) > 0;

  const pricing = computePricing({
    items: items.map((it) => ({ productId: it.productId, price: it.price, quantity: it.quantity })),
    fulfillmentType: "PICKUP",
    tier,
    isSouthEastCalgary: false,
    hasUsedFirstFreeDelivery,
    isGuest: false,
  });

  if (pricing.errors.length > 0) {
    return { error: pricing.errors.join("; ") };
  }

  let paymentId: string | undefined;
  try {
    const result = await chargeCardOnFile({
      customerId: squareCustomerId,
      cardId: squareCardId,
      amountCents: pricing.totalCents,
      note: `Karyana weekly box — ${tier}`,
      idempotencyKey: `weekly-${userId}-${new Date().toISOString().slice(0, 10)}`,
    });
    paymentId = result.paymentId;
  } catch (err: any) {
    return { error: err?.errors?.[0]?.detail ?? err?.message ?? "Payment failed" };
  }

  const orderNumber = generateOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      paymentMethod: "SQUARE",
      squarePaymentId: paymentId,
      fulfillmentType: "PICKUP",
      pickupTime: "Contact you to schedule — weekly auto-order",
      items,
      subtotal: pricing.subtotalCents,
      deliveryFee: pricing.deliveryFeeCents,
      freeDeliveryReason: pricing.freeDeliveryReason,
      gst: pricing.gstCents,
      total: pricing.totalCents,
      pointsEarned: pricing.pointsEarned,
      confirmedAt: new Date(),
      notes: "Auto-created from Weekly Bread Delivery (Repeat Last Order)",
    },
  });

  if (pricing.pointsEarned > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { pointsBalance: { increment: pricing.pointsEarned } },
    });
    await prisma.pointsTransaction.create({
      data: {
        userId,
        amount: pricing.pointsEarned,
        type: "EARNED",
        orderId: order.id,
        note: `Earned from weekly order ${orderNumber}`,
      },
    });
  }

  sendOrderEmails(order.id).catch((err) =>
    console.warn("[weekly-order] email send failed", err)
  );

  return { orderId: order.id };
}
