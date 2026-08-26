import { NextResponse, after } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { sanityFetch } from "@/sanity/lib/fetch";
import { writeClient as sanityClient } from "@/sanity/lib/client";
import { squareClient, SQUARE_LOCATION_ID as locationId } from "@/lib/square/client";
import { computePricing } from "@/lib/checkout/pricing";
import { isSECalgary } from "@/lib/checkout/postal-codes";
import { generateOrderNumber } from "@/lib/checkout/order-number";
import { ambassadorPayoutCents } from "@/lib/membership/tiers";
import { sendOrderEmails } from "@/lib/email/send-order-emails";
import { randomUUID } from "crypto";
import { getCalendar, KARYANA_CALENDAR_ID, TIMEZONE } from "@/lib/google/calendar";
import { syncOrderCompleted, syncGuestOrder } from "@/lib/brevo/sync";
import { getServerLocale } from "@/lib/i18n/server";

async function reserveDeliverySlot({
  slotStartTime,
  slotEndTime,
  customerName,
  customerPhone,
  customerEmail,
  address,
  itemsSummary,
  orderNumber,
}: {
  slotStartTime: Date;
  slotEndTime: Date;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  itemsSummary: string;
  orderNumber: string;
}): Promise<{ slotStart: string; slotEnd: string; eventId: string | null }> {
  const calendar = getCalendar();

  const event = await calendar.events.insert({
    calendarId: KARYANA_CALENDAR_ID,
    requestBody: {
      summary: `Delivery: ${customerName} — ${orderNumber}`,
      description: [
        `Customer: ${customerName}`,
        `Phone: ${customerPhone}`,
        `Email: ${customerEmail}`,
        `Address: ${address}`,
        ``,
        `Items:`,
        itemsSummary,
        ``,
        `Order: ${orderNumber}`,
      ].join("\n"),
      location: address,
      start: { dateTime: slotStartTime.toISOString(), timeZone: TIMEZONE },
      end: { dateTime: slotEndTime.toISOString(), timeZone: TIMEZONE },
    },
  });

  return {
    slotStart: slotStartTime.toISOString(),
    slotEnd: slotEndTime.toISOString(),
    eventId: event.data.id ?? null,
  };
}

const schema = z.object({
  paymentToken: z.string().min(1),
  fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
  pickupDate: z.string().optional(),
  pickupTime: z.string().optional(),
  deliverySlotId: z.string().optional(),
  addressId: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  phone: z.string().optional(), // logged-in user's phone, when missing from their profile
  guestAddress: z
    .object({
      street: z.string(),
      city: z.string(),
      province: z.string(),
      postalCode: z.string(),
      buzzer: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  couponCode: z.string().optional(),
  pointsToRedeem: z.number().int().min(0).optional(),
  tipCents: z.number().int().min(0).optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  clientReferenceId: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  const guestLocale = await getServerLocale();

  // ============================================================
  // 1. Re-fetch products from Sanity
  // ============================================================
  const productIds = data.items.map((i) => i.productId);

  const products = await sanityFetch<
    Array<{
      _id: string;
      name: string;
      slug: string;
      price: number;
      inStock: boolean;
      membersOnly?: boolean;
      isOffSeason?: boolean;
      leadTime?: number;
    }>
  >({
    query: `*[_type == "product" && _id in $ids]{
      _id, name, "slug": slug.current, price, inStock, membersOnly, isOffSeason, leadTime
    }`,
    params: { ids: productIds },
    tags: ["product"],
  });

  if (products.length !== productIds.length) {
    return NextResponse.json(
      { error: "Some products are no longer available" },
      { status: 400 }
    );
  }

  // ============================================================
  // 2. Load user, membership, address
  // ============================================================
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        include: {
          membership: true,
          orders: {
            where: { fulfillmentType: "DELIVERY", status: { not: "CANCELLED" } },
            select: { id: true },
            take: 1,
          },
        },
      })
    : null;

  const tier = user?.membership?.tier ?? "BASICO";
  const hasUsedFirstFreeDelivery = (user?.orders?.length ?? 0) > 0;

  // Persist the phone number a logged-in user just entered (no phone on file yet)
  // so it's saved for future orders and shows up in the owner notification email.
  if (userId && user && !user.phone && data.phone) {
    await prisma.user.update({ where: { id: userId }, data: { phone: data.phone } });
    (user as any).phone = data.phone;
  }

  // ============================================================
  // 3. Product validation
  // ============================================================
  for (const p of products) {
    if (p.membersOnly && tier === "BASICO") {
      return NextResponse.json({ error: `${p.name} is for members only` }, { status: 403 });
    }
    if (!p.inStock && !p.isOffSeason) {
      return NextResponse.json({ error: `${p.name} is out of stock` }, { status: 400 });
    }
    if (p.isOffSeason && !p.inStock && tier === "BASICO") {
      return NextResponse.json({ error: `${p.name} is off-season — members only` }, { status: 403 });
    }
  }

  // ============================================================
  // 4. Build normalized items
  // ============================================================
  const items = data.items.map((it) => {
    const p = products.find((pr) => pr._id === it.productId)!;
    return {
      productId: p._id,
      name: p.name,
      slug: p.slug,
      price: p.price * 100,
      quantity: it.quantity,
    };
  });

  // ============================================================
  // 5. Address & SE Calgary detection
  // ============================================================
  let address: any = null;

  if (data.fulfillmentType === "DELIVERY") {
    if (data.addressId && userId) {
      address = await prisma.address.findFirst({ where: { id: data.addressId, userId } });
      if (!address) {
        return NextResponse.json({ error: "Address not found" }, { status: 404 });
      }
    } else if (data.guestAddress) {
      address = data.guestAddress;
    } else {
      return NextResponse.json({ error: "Delivery address required" }, { status: 400 });
    }
  }

  const isSECustomer = address ? isSECalgary(address.postalCode) : false;

  // ============================================================
  // 6. Validate delivery slot
  // ============================================================
  let deliverySlot: any = null;

  if (data.fulfillmentType === "DELIVERY") {
    if (!data.deliverySlotId) {
      return NextResponse.json({ error: "Delivery slot required" }, { status: 400 });
    }

    deliverySlot = await prisma.deliverySlot.findUnique({
      where: { id: data.deliverySlotId },
      include: { _count: { select: { orders: true } } },
    });

    if (!deliverySlot) {
      return NextResponse.json({ error: "Delivery slot not found" }, { status: 404 });
    }
    if (deliverySlot._count.orders >= deliverySlot.capacity || !deliverySlot.isOpen) {
      return NextResponse.json({ error: "Delivery slot is full" }, { status: 409 });
    }
    if (deliverySlot.membersOnly && tier === "BASICO") {
      return NextResponse.json({ error: "This slot is for members only" }, { status: 403 });
    }
  }

  // ============================================================
  // 7. Validate coupon (source of truth: Sanity)
  // ============================================================
  let coupon: any = null;
  let prismaIoupon: any = null; // for redemption tracking only

  if (data.couponCode) {
    const sanityCoupon = await sanityClient.fetch(
      `*[_type == "coupon" && code == $code][0]{
        code, discountType, discountValue,
        minOrderDollars, maxUses, perUserLimit,
        startsAt, expiresAt, active, membershipOnly
      }`,
      { code: data.couponCode.toUpperCase() }
    );

    if (!sanityCoupon || !sanityCoupon.active) {
      return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
    }

    const now = new Date();
    if (sanityCoupon.startsAt && new Date(sanityCoupon.startsAt) > now) {
      return NextResponse.json({ error: "Coupon is not active yet" }, { status: 400 });
    }
    if (sanityCoupon.expiresAt && new Date(sanityCoupon.expiresAt) < now) {
      return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
    }
    if (sanityCoupon.membershipOnly && tier === "BASICO") {
      return NextResponse.json({ error: "This coupon is for members only" }, { status: 403 });
    }

    // Per-user limit (cross-check Prisma redemption log if coupon tracked there)
    prismaIoupon = await prisma.coupon.findUnique({ where: { code: sanityCoupon.code } }).catch(() => null);
    if (prismaIoupon && sanityCoupon.perUserLimit > 0 && userId) {
      const used = await prisma.couponRedemption.count({ where: { couponId: prismaIoupon.id, userId } });
      if (used >= sanityCoupon.perUserLimit) {
        return NextResponse.json({ error: "You have already used this coupon" }, { status: 400 });
      }
    }

    // Normalize for pricing engine
    const discountValue =
      sanityCoupon.discountType === "FIXED"
        ? Math.round((sanityCoupon.discountValue ?? 0) * 100)
        : sanityCoupon.discountValue ?? 0;
    const minOrderCents = sanityCoupon.minOrderDollars
      ? Math.round(sanityCoupon.minOrderDollars * 100)
      : null;

    coupon = {
      id: prismaIoupon?.id ?? null,
      code: sanityCoupon.code,
      discountType: sanityCoupon.discountType,
      discountValue,
      minOrderCents,
    };
  }

  // ============================================================
  // 8. Validate points
  // ============================================================
  if (data.pointsToRedeem && data.pointsToRedeem > 0) {
    if (!user) {
      return NextResponse.json({ error: "Sign in to redeem points" }, { status: 401 });
    }
    if ((user.pointsBalance ?? 0) < data.pointsToRedeem) {
      return NextResponse.json({ error: "Not enough points" }, { status: 400 });
    }
  }

  // ============================================================
  // 9. Compute pricing
  // ============================================================
  // Priority slot fee based on tier (free for SELECTO/LEGENDARIO)
  let prioritySlotFeeCents = 0;
  if (deliverySlot?.isPriority) {
    if (tier === "ARTESANO") prioritySlotFeeCents = deliverySlot.feeCentsArtesano ?? 0;
    else if (tier === "BASICO") prioritySlotFeeCents = deliverySlot.feeCentsBasico ?? 0;
    // SELECTO, LEGENDARIO, EMBAJADOR: 0
  }

  const pricing = computePricing({
    items,
    fulfillmentType: data.fulfillmentType,
    tier,
    isSouthEastCalgary: isSECustomer,
    hasUsedFirstFreeDelivery,
    isGuest: !userId,
    coupon: coupon
      ? {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderCents: coupon.minOrderCents ?? undefined,
        }
      : null,
    pointsToRedeem: data.pointsToRedeem ?? 0,
    tipCents: data.tipCents ?? 0,
    prioritySlotFeeCents,
  });

  if (pricing.errors.length) {
    return NextResponse.json({ error: pricing.errors.join("; ") }, { status: 400 });
  }

  // ============================================================
  // 10. Reserve delivery slot in Google Calendar
  // ============================================================
  let deliveryReservation: {
    slotStart: string;
    slotEnd: string;
    eventId: string | null;
  } | null = null;

  if (data.fulfillmentType === "DELIVERY") {
    const itemsSummary = items
      .map((it) => `• ${it.quantity}× ${it.name || it.productId}`)
      .join("\n");

    const fullAddress = `${address.street}, ${address.city}, ${address.postalCode}`;

    try {
      deliveryReservation = await reserveDeliverySlot({
        slotStartTime: deliverySlot.startTime,
        slotEndTime: deliverySlot.endTime,
        customerName: user?.name ?? data.guestName ?? "Customer",
        customerPhone: (user as any)?.phone ?? data.guestPhone ?? "",
        customerEmail: user?.email ?? data.guestEmail ?? "",
        address: fullAddress,
        itemsSummary,
        orderNumber: "PENDING",
      });
    } catch (err) {
      console.error("[checkout] delivery reservation failed", err);
      return NextResponse.json({ error: "Unable to reserve delivery slot" }, { status: 409 });
    }
  }

  // ============================================================
  // 11. Charge Square
  // ============================================================
  const idempotencyKey = data.clientReferenceId || randomUUID();
  let paymentId: string | undefined;

  try {
    const result = await squareClient.payments.create({
  sourceId: data.paymentToken,
  idempotencyKey,
  amountMoney: {
    amount: BigInt(pricing.totalCents),
    currency: "CAD",
  },
  locationId,
  buyerEmailAddress: user?.email ?? data.guestEmail ?? undefined,
  note: `Karyana order — ${pricing.totalCents / 100} CAD`,
  autocomplete: true,
});

paymentId = result.payment?.id ?? undefined;

    if (!paymentId) {
      throw new Error("Square did not return payment id");
    }
  } catch (err: any) {
    console.error("[checkout] Square error", err);
    return NextResponse.json(
      { error: err?.errors?.[0]?.detail ?? err?.message ?? "Payment failed" },
      { status: 402 }
    );
  }

  // ============================================================
  // 12. Create order transaction
  // ============================================================
  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    let savedAddress = address;

    if (data.guestAddress && !data.addressId && userId) {
      savedAddress = await tx.address.create({
        data: {
          userId,
          street: data.guestAddress.street,
          city: data.guestAddress.city,
          province: data.guestAddress.province,
          postalCode: data.guestAddress.postalCode,
          buzzer: data.guestAddress.buzzer,
          notes: data.guestAddress.notes,
          isSE: isSECustomer,
          isDefault: true,
        },
      });
    }

    // Ambassador assignment
    let ambassadorDelivery: { ambassadorId: string; payoutCents: number } | null = null;

    if (data.fulfillmentType === "DELIVERY") {
      const ambassadors = await tx.user.findMany({
        where: {
          role: "AMBASSADOR",
          membership: { tier: "EMBAJADOR", status: "ACTIVE" },
        },
        select: {
          id: true,
          _count: {
            select: {
              ambassadorDeliveries: {
                where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
              },
            },
          },
        },
      });

      const sorted = ambassadors.sort(
        (a, b) => a._count.ambassadorDeliveries - b._count.ambassadorDeliveries
      );

      const assigned = sorted[0];
      if (assigned) {
        ambassadorDelivery = {
          ambassadorId: assigned.id,
          payoutCents: ambassadorPayoutCents(tier),
        };
      }
    }

    // Create order
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: userId ?? undefined,
        guestEmail: !userId ? (data.guestEmail ?? undefined) : undefined,
        guestName: !userId ? (data.guestName ?? undefined) : undefined,
        guestPhone: !userId ? (data.guestPhone ?? undefined) : undefined,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        paymentMethod: "SQUARE",
        squarePaymentId: paymentId,
        fulfillmentType: data.fulfillmentType,
        pickupDate: data.pickupDate ? new Date(data.pickupDate) : null,
        pickupTime: data.pickupTime ?? null,
        deliverySlotId: data.deliverySlotId ?? null,
        addressId: savedAddress?.id ?? null,
        items: items as any,
        subtotal: pricing.subtotalCents,
        couponId: coupon?.id ?? null,
        couponCode: coupon?.code ?? null,
        couponDiscount: pricing.couponDiscountCents,
        pointsRedeemed: data.pointsToRedeem ?? 0,
        pointsDiscount: pricing.pointsDiscountCents,
        deliveryFee: pricing.deliveryFeeCents,
        freeDeliveryReason: pricing.freeDeliveryReason,
        gst: pricing.gstCents,
        tipCents: pricing.tipCents,
        total: pricing.totalCents,
        pointsEarned: pricing.pointsEarned,
        confirmedAt: new Date(),
        deliveryStartTime: deliveryReservation ? new Date(deliveryReservation.slotStart) : null,
        deliveryEndTime: deliveryReservation ? new Date(deliveryReservation.slotEnd) : null,
        googleCalendarEventId: deliveryReservation?.eventId ?? null,
      },
    });

    

    // Points redemption
    if (data.pointsToRedeem && data.pointsToRedeem > 0 && userId) {
      await tx.user.update({
        where: { id: userId },
        data: { pointsBalance: { decrement: data.pointsToRedeem } },
      });
      await tx.pointsTransaction.create({
        data: {
          userId,
          amount: -data.pointsToRedeem,
          type: "REDEMPTION",
          orderId: created.id,
          note: `Redeemed for order ${orderNumber}`,
        },
      });
    }

    // Award points
    if (pricing.pointsEarned > 0 && userId) {
      await tx.user.update({
        where: { id: userId },
        data: { pointsBalance: { increment: pricing.pointsEarned } },
      });
      await tx.pointsTransaction.create({
        data: {
          userId,
          amount: pricing.pointsEarned,
          type: "EARNED",
          orderId: created.id,
          note: `Earned from order ${orderNumber}`,
        },
      });
    }

    // Coupon redemption (only tracked if coupon exists in Prisma DB)
    if (coupon?.id) {
      await tx.couponRedemption.create({
        data: { couponId: coupon.id, userId: userId ?? null, orderId: created.id },
      });
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { redemptionCount: { increment: 1 } },
      });
    }

    // Ambassador assignment
    if (ambassadorDelivery) {
      await tx.ambassadorDelivery.create({
        data: {
          ambassadorId: ambassadorDelivery.ambassadorId,
          orderId: created.id,
          payoutCents: ambassadorDelivery.payoutCents,
          status: "ASSIGNED",
        },
      });
    }

    // Referral credit
    if (userId && user?.referredById && !user.firstOrderCompleted) {
      await tx.user.update({ where: { id: userId }, data: { firstOrderCompleted: true } });
      await tx.user.update({
        where: { id: user.referredById },
        data: { referralCredit: { increment: 10 } },
      });
    }

    return created;
  });
  // ============================================================
  // 12.5 Sync order to Sanity Studio, CRM, and send emails after response
  // ============================================================
  const deliveryAddress = address
    ? `${address.street}, ${address.city}, ${address.province} ${address.postalCode}`
    : null;
  const slotLabel = deliverySlot
    ? deliverySlot.startTime.toLocaleString("en-CA", {
        weekday: "long", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
      })
    : data.pickupDate
    ? `${data.pickupDate}${data.pickupTime ? " · " + data.pickupTime : ""}`
    : null;

  // These run after the response is sent, but `after()` keeps the serverless
  // function alive until they finish — plain fire-and-forget promises here
  // can get cut off mid-flight the instant the response goes out, which is
  // how an order confirms and emails send but never lands in Sanity Studio.
  after(async () => {
    try {
      await sanityClient.create({
        _type: "order",
        orderNumber,
        prismaId: order.id,
        customerName: user?.name ?? data.guestName ?? "Guest",
        customerEmail: user?.email ?? data.guestEmail ?? "",
        customerPhone: (user as any)?.phone ?? data.guestPhone ?? "",
        fulfillmentType: data.fulfillmentType,
        total: pricing.totalCents / 100,
        items: items.map((it) => ({
          _key: it.productId,
          name: it.name,
          quantity: it.quantity,
          price: it.price / 100,
        })),
        deliveryAddress,
        pickupDate: slotLabel,
        status: "IN_PROGRESS",
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("[checkout] sanity sync failed:", err?.message, err?.statusCode);
    }

    if (userId && user?.email) {
      const orderCount = await prisma.order.count({
        where: { userId, paymentStatus: "PAID" },
      });
      const totalSpent = await prisma.order.aggregate({
        where: { userId, paymentStatus: "PAID" },
        _sum: { total: true },
      });
      syncOrderCompleted({
        email: user.email,
        name: user.name,
        totalOrders: orderCount,
        totalSpentCents: totalSpent._sum.total ?? 0,
        lastOrderDate: new Date().toISOString(),
        language: (user as any).preferredLang,
      });
    } else if (data.guestEmail) {
      syncGuestOrder({
        email: data.guestEmail,
        name: data.guestName,
        phone: data.guestPhone,
        totalCents: pricing.totalCents,
        language: guestLocale,
      });
    }

    // ============================================================
    // 13. Emails
    // ============================================================
    await sendOrderEmails(order.id).catch((err) =>
      console.warn("[checkout] email send failed", err)
    );
  });

  return NextResponse.json({
    ok: true,
    orderNumber,
    orderId: order.id,
    redirect: `/checkout/success?order=${orderNumber}`,
  });
}