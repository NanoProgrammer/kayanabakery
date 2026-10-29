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
import { createSanityOrder } from "@/lib/orders/sanity-sync";
import type { MembershipTier } from "@/lib/membership/tiers";
import { pointsToSpend } from "@/lib/membership/benefit";

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

  const priceable = items.map((it) => ({
    productId: it.productId,
    price: it.price,
    quantity: it.quantity,
  }));

  // The membership fee already became points, so the box is paid out of that
  // balance first and the card covers only what is left. Charging the full
  // price on top of a fee that had already been converted meant the member
  // paid twice for the same bread, and the points were decoration.
  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: { pointsBalance: true },
  });

  // Priced twice: once to learn what the box is worth, then again with the
  // points applied. computePricing is what spends them, because it takes them
  // off the subtotal before GST — the same path the website's checkout uses,
  // and the correct tax treatment.
  const base = computePricing({
    items: priceable,
    fulfillmentType: "PICKUP",
    tier,
    isSouthEastCalgary: false,
    hasUsedFirstFreeDelivery,
    isGuest: false,
  });

  if (base.errors.length > 0) {
    return { error: base.errors.join("; ") };
  }

  const spend = pointsToSpend(base.subtotalCents, member?.pointsBalance ?? 0);

  const pricing = spend > 0
    ? computePricing({
        items: priceable,
        fulfillmentType: "PICKUP",
        tier,
        isSouthEastCalgary: false,
        hasUsedFirstFreeDelivery,
        isGuest: false,
        pointsToRedeem: spend,
      })
    : base;

  if (pricing.errors.length > 0) {
    return { error: pricing.errors.join("; ") };
  }

  const payment = {
    pointsSpent: spend,
    pointsValueCents: pricing.pointsDiscountCents,
    chargeCents: pricing.totalCents,
  };

  let paymentId: string | undefined;
  if (payment.chargeCents > 0) {
    try {
      const result = await chargeCardOnFile({
        customerId: squareCustomerId,
        cardId: squareCardId,
        amountCents: payment.chargeCents,
        note: `Karyana weekly box — ${tier}`,
        idempotencyKey: `weekly-${userId}-${new Date().toISOString().slice(0, 10)}`,
      });
      paymentId = result.paymentId;
    } catch (err: any) {
      // Nothing has been written yet, so a declined card leaves the balance
      // untouched rather than spending points on an order that never existed.
      return { error: err?.errors?.[0]?.detail ?? err?.message ?? "Payment failed" };
    }
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
      pointsRedeemed: payment.pointsSpent,
      confirmedAt: new Date(),
      notes:
        payment.pointsSpent > 0
          ? `Auto-created from Weekly Bread Delivery. ${payment.pointsSpent} points covered $${(
              payment.pointsValueCents / 100
            ).toFixed(2)}${
              payment.chargeCents > 0
                ? `; $${(payment.chargeCents / 100).toFixed(2)} charged to the card.`
                : "; nothing was charged."
            }`
          : "Auto-created from Weekly Bread Delivery (Repeat Last Order)",
    },
  });

  // Spent only once the order exists, so a crash cannot take someone's points
  // without giving them bread.
  if (payment.pointsSpent > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { pointsBalance: { decrement: payment.pointsSpent } },
    });
    await prisma.pointsTransaction.create({
      data: {
        userId,
        amount: -payment.pointsSpent,
        type: "REDEMPTION",
        orderId: order.id,
        note: `Spent on weekly order ${orderNumber}`,
      },
    });
  }

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

  // Mirror it into Studio. Without this the bakery never sees the order:
  // it was charged and emailed but stayed invisible in the Orders list, which
  // looks exactly like the weekly automation being broken.
  const customer = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, phone: true },
  });

  await createSanityOrder({
    orderNumber,
    prismaId: order.id,
    customerName: customer?.name ?? "Member",
    customerEmail: customer?.email ?? "",
    customerPhone: customer?.phone ?? "",
    customerTier: tier,
    fulfillmentType: "PICKUP",
    totalCents: pricing.totalCents,
    items: items.map((it) => ({
      productId: it.productId,
      name: it.name,
      quantity: it.quantity,
      price: it.price,
    })),
    deliveryAddress: null,
    pickupDate: "Weekly auto-order — contact member to schedule",
    status: "IN_PROGRESS",
    source: "weekly-auto",
  });

  sendOrderEmails(order.id).catch((err) =>
    console.warn("[weekly-order] email send failed", err)
  );

  return { orderId: order.id };
}
