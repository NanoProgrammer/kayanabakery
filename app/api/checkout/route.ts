import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { sanityFetch } from "@/sanity/lib/fetch";
import { squareClient, SQUARE_LOCATION_ID as locationId } from "@/lib/square/client";
import { computePricing } from "@/lib/checkout/pricing";
import { isSECalgary } from "@/lib/checkout/postal-codes";
import { generateOrderNumber } from "@/lib/checkout/order-number";
import { createDeliveryEvent } from "@/lib/gcal/client";
import { ambassadorPayoutCents } from "@/lib/membership/tiers";
import { sendOrderEmails } from "@/lib/email/send-order-emails";
import { randomUUID } from "crypto";
import { getCalendar, KARYANA_CALENDAR_ID, TIMEZONE } from "@/lib/google/calendar";
import { getUpcomingWindows, findNextAvailableSlot, SLOT_DURATION_MIN } from "@/lib/google/delivery-windows";

async function reserveDeliverySlot({
  windowId,
  customerName,
  customerPhone,
  customerEmail,
  address,
  itemsSummary,
  orderNumber,
}: {
  windowId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  itemsSummary: string;
  orderNumber: string;
}) {
  // Find the matching window
  const windows = getUpcomingWindows();
  const window = windows.find((w) => w.id === windowId);
  if (!window) {
    throw new Error("Selected delivery window is no longer available");
  }

  const calendar = getCalendar();

  // Pull existing events in this window
  const eventsRes = await calendar.events.list({
    calendarId: KARYANA_CALENDAR_ID,
    timeMin: window.windowStart,
    timeMax: window.windowEnd,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  });

  const busyStarts = (eventsRes.data.items || [])
    .map((ev) => ev.start?.dateTime)
    .filter(Boolean)
    .map((s) => new Date(s as string));

  const slotStart = findNextAvailableSlot(window, busyStarts);
  if (!slotStart) {
    throw new Error(
      "This delivery window just filled up. Please pick another."
    );
  }

  const slotEnd = new Date(
    slotStart.getTime() + SLOT_DURATION_MIN * 60 * 1000
  );

  // Create the event in Karyana's calendar
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
      start: {
        dateTime: slotStart.toISOString(),
        timeZone: TIMEZONE,
      },
      end: {
        dateTime: slotEnd.toISOString(),
        timeZone: TIMEZONE,
      },
    },
  });

  return {
    slotStart: slotStart.toISOString(),
    slotEnd: slotEnd.toISOString(),
    eventId: event.data.id,
  };
}

const schema = z.object({
  // Square Web Payments source ID (token from card form)
  paymentToken: z.string().min(1),
  fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
  // For pickup
  pickupDate: z.string().optional(),
  pickupTime: z.string().optional(),
  // For delivery
  deliverySlotId: z.string().optional(),
  addressId: z.string().optional(),
  // Or guest delivery details
  guestEmail: z.string().email().optional(),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
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
  // Discount inputs
  couponCode: z.string().optional(),
  pointsToRedeem: z.number().int().min(0).optional(),
  // Cart snapshot from client (we re-validate prices server-side)
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  // Idempotency
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
  const userId = (session?.user as any)?.id;

  // ============================================================
  // 1. Re-fetch products from Sanity to get authoritative prices
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
      _id,
      name,
      "slug": slug.current,
      price,
      inStock,
      membersOnly,
      isOffSeason,
      leadTime
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
            where: {
              fulfillmentType: "DELIVERY",
              status: { not: "CANCELLED" },
            },
            select: { id: true },
            take: 1,
          },
        },
      })
    : null;

  const tier = user?.membership?.tier ?? "BASICO";

  const hasUsedFirstFreeDelivery =
    (user?.orders?.length ?? 0) > 0;

  // ============================================================
  // 3. Product validation
  // ============================================================
  for (const p of products) {
    if (p.membersOnly && tier === "BASICO") {
      return NextResponse.json(
        { error: `${p.name} is for members only` },
        { status: 403 }
      );
    }

    if (!p.inStock && !p.isOffSeason) {
      return NextResponse.json(
        { error: `${p.name} is out of stock` },
        { status: 400 }
      );
    }

    if (p.isOffSeason && !p.inStock && tier === "BASICO") {
      return NextResponse.json(
        { error: `${p.name} is off-season — members only` },
        { status: 403 }
      );
    }
  }

  // ============================================================
  // 4. Build normalized items
  // ============================================================
  const items = data.items.map((it) => {
    const p = products.find((p) => p._id === it.productId)!;

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
      address = await prisma.address.findFirst({
        where: {
          id: data.addressId,
          userId,
        },
      });

      if (!address) {
        return NextResponse.json(
          { error: "Address not found" },
          { status: 404 }
        );
      }
    } else if (data.guestAddress) {
      address = data.guestAddress;
    } else {
      return NextResponse.json(
        { error: "Delivery address required" },
        { status: 400 }
      );
    }
  }

  const isSECustomer = address
    ? isSECalgary(address.postalCode)
    : false;

  // ============================================================
  // 6. Validate delivery slot
  // ============================================================
  let deliverySlot: any = null;

  if (data.fulfillmentType === "DELIVERY") {
    if (!data.deliverySlotId) {
      return NextResponse.json(
        { error: "Delivery slot required" },
        { status: 400 }
      );
    }

    deliverySlot = await prisma.deliverySlot.findUnique({
      where: { id: data.deliverySlotId },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!deliverySlot) {
      return NextResponse.json(
        { error: "Delivery slot not found" },
        { status: 404 }
      );
    }

    if (
      deliverySlot._count.orders >= deliverySlot.capacity ||
      !deliverySlot.isOpen
    ) {
      return NextResponse.json(
        { error: "Delivery slot is full" },
        { status: 409 }
      );
    }

    if (
      deliverySlot.membersOnly &&
      tier === "BASICO"
    ) {
      return NextResponse.json(
        { error: "This slot is for members only" },
        { status: 403 }
      );
    }
  }

  // ============================================================
  // 7. Validate coupon
  // ============================================================
  let coupon: any = null;

  if (data.couponCode) {
    coupon = await prisma.coupon.findUnique({
      where: {
        code: data.couponCode.toUpperCase(),
      },
    });

    if (!coupon || !coupon.active) {
      return NextResponse.json(
        { error: "Invalid coupon" },
        { status: 400 }
      );
    }

    const now = new Date();

    if (
      (coupon.startsAt && now < coupon.startsAt) ||
      (coupon.expiresAt && now > coupon.expiresAt)
    ) {
      return NextResponse.json(
        { error: "Coupon has expired" },
        { status: 400 }
      );
    }

    if (
      coupon.maxRedemptions &&
      coupon.redemptionCount >= coupon.maxRedemptions
    ) {
      return NextResponse.json(
        { error: "Coupon limit reached" },
        { status: 400 }
      );
    }

    if (coupon.maxPerUser && userId) {
      const used = await prisma.couponRedemption.count({
        where: {
          couponId: coupon.id,
          userId,
        },
      });

      if (used >= coupon.maxPerUser) {
        return NextResponse.json(
          { error: "You have already used this coupon" },
          { status: 400 }
        );
      }
    }

    if (
      coupon.requiredTier &&
      coupon.requiredTier !== "BASICO" &&
      tier === "BASICO"
    ) {
      return NextResponse.json(
        { error: "This coupon is for members only" },
        { status: 403 }
      );
    }
  }

  // ============================================================
  // 8. Validate points
  // ============================================================
  if (
    data.pointsToRedeem &&
    data.pointsToRedeem > 0
  ) {
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to redeem points" },
        { status: 401 }
      );
    }

    if (
      (user.pointsBalance ?? 0) <
      data.pointsToRedeem
    ) {
      return NextResponse.json(
        { error: "Not enough points" },
        { status: 400 }
      );
    }
  }

  // ============================================================
  // 9. Compute pricing
  // ============================================================
  const pricing = computePricing({
    items,
    fulfillmentType: data.fulfillmentType,
    tier,
    isSouthEastCalgary: isSECustomer,
    hasUsedFirstFreeDelivery,
    coupon: coupon
      ? {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderCents:
            coupon.minOrderCents ?? undefined,
        }
      : null,
    pointsToRedeem: data.pointsToRedeem ?? 0,
  });

  if (pricing.errors.length) {
    return NextResponse.json(
      { error: pricing.errors.join("; ") },
      { status: 400 }
    );
  }

  // ============================================================
  // 10. Reserve delivery slot in Google Calendar
  // ============================================================
  let deliveryReservation: {
  slotStart: string;
  slotEnd: string;
  eventId: string | null | undefined;
} | null = null;

  if (data.fulfillmentType === "DELIVERY") {
    const itemsSummary = items
      .map(
        (it) =>
          `• ${it.quantity}× ${it.name || it.productId}`
      )
      .join("\n");

    const fullAddress = `${address.street}, ${address.city}, ${address.postalCode}`;

    try {
      deliveryReservation = await reserveDeliverySlot({
        windowId: data.deliverySlotId,
        customerName:
          user?.name || data.guestName,
        customerPhone:
          (user as any)?.phone ||
          data.guestPhone,
        customerEmail:
          user?.email || data.guestEmail,
        address: fullAddress,
        itemsSummary,
        orderNumber: "PENDING",
      });
    } catch (err) {
      console.error(
        "[checkout] delivery reservation failed",
        err
      );

      return NextResponse.json(
        {
          error:
            "Unable to reserve delivery slot",
        },
        { status: 409 }
      );
    }
  }

  // ============================================================
  // 11. Charge Square
  // ============================================================
  const idempotencyKey =
    data.clientReferenceId || randomUUID();

  let paymentId: string | undefined;

  try {
    const { result } =
      await squareClient.paymentsApi.createPayment({
        sourceId: data.paymentToken,
        idempotencyKey,
        amountMoney: {
          amount: BigInt(pricing.totalCents),
          currency: "CAD",
        },
        locationId,
        buyerEmailAddress:
          user?.email ?? data.guestEmail,
        note: `Karyana order — ${
          pricing.totalCents / 100
        } CAD`,
        autocomplete: true,
      });

    paymentId =
      result.payment?.id ?? undefined;

    if (!paymentId) {
      throw new Error(
        "Square did not return payment id"
      );
    }
  } catch (err: any) {
    console.error("[checkout] Square error", err);

    return NextResponse.json(
      {
        error:
          err?.errors?.[0]?.detail ??
          err?.message ??
          "Payment failed",
      },
      { status: 402 }
    );
  }

  // ============================================================
  // 12. Create order transaction
  // ============================================================
  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(
    async (tx) => {
      let savedAddress = address;

      if (
        data.guestAddress &&
        !data.addressId &&
        userId
      ) {
        savedAddress = await tx.address.create({
          data: {
            userId,
            street: data.guestAddress.street,
            city: data.guestAddress.city,
            province:
              data.guestAddress.province,
            postalCode:
              data.guestAddress.postalCode,
            buzzer:
              data.guestAddress.buzzer,
            notes: data.guestAddress.notes,
            isSE: isSECustomer,
            isDefault: true,
          },
        });
      }

      // Ambassador assignment
      let ambassadorDelivery: any = null;

      if (
        data.fulfillmentType === "DELIVERY"
      ) {
        const ambassadors =
          await tx.user.findMany({
            where: {
              role: "AMBASSADOR",
              membership: {
                tier: "EMBAJADOR",
                status: "ACTIVE",
              },
            },
            select: {
              id: true,
              _count: {
                select: {
                  ambassadorDeliveries: {
                    where: {
                      status: {
                        in: [
                          "ASSIGNED",
                          "IN_PROGRESS",
                        ],
                      },
                    },
                  },
                },
              },
            },
          });

        const sorted = ambassadors.sort(
          (a, b) =>
            a._count
              .ambassadorDeliveries -
            b._count
              .ambassadorDeliveries
        );

        const assigned = sorted[0];

        if (assigned) {
          ambassadorDelivery = {
            ambassadorId: assigned.id,
            payoutCents:
              ambassadorPayoutCents(tier),
          };
        }
      }

      // Create order
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,

          guestEmail: !userId
            ? data.guestEmail
            : undefined,

          guestName: !userId
            ? data.guestName
            : undefined,

          guestPhone: !userId
            ? data.guestPhone
            : undefined,

          status: "CONFIRMED",
          paymentStatus: "PAID",
          paymentMethod: "SQUARE",
          squarePaymentId: paymentId,

          fulfillmentType:
            data.fulfillmentType,

          pickupDate: data.pickupDate
            ? new Date(data.pickupDate)
            : null,

          pickupTime: data.pickupTime,

          deliverySlotId:
            data.deliverySlotId,

          addressId:
            savedAddress?.id ?? null,

          items: items as any,

          subtotal: pricing.subtotalCents,

          couponId: coupon?.id,
          couponCode: coupon?.code,

          couponDiscount:
            pricing.couponDiscountCents,

          pointsRedeemed:
            data.pointsToRedeem ?? 0,

          pointsDiscount:
            pricing.pointsDiscountCents,

          deliveryFee:
            pricing.deliveryFeeCents,

          freeDeliveryReason:
            pricing.freeDeliveryReason,

          gst: pricing.gstCents,

          total: pricing.totalCents,

          pointsEarned:
            pricing.pointsEarned,

          confirmedAt: new Date(),

          // NEW FIELDS
          deliveryStartTime:
            deliveryReservation
              ? new Date(
                  deliveryReservation.slotStart
                )
              : null,

          deliveryEndTime:
            deliveryReservation
              ? new Date(
                  deliveryReservation.slotEnd
                )
              : null,

          googleCalendarEventId:
            deliveryReservation?.eventId ||
            null,
        },
      });

      // Points redemption
      if (
        data.pointsToRedeem &&
        data.pointsToRedeem > 0 &&
        userId
      ) {
        await tx.user.update({
          where: { id: userId },
          data: {
            pointsBalance: {
              decrement:
                data.pointsToRedeem,
            },
          },
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
      if (
        pricing.pointsEarned > 0 &&
        userId
      ) {
        await tx.user.update({
          where: { id: userId },
          data: {
            pointsBalance: {
              increment:
                pricing.pointsEarned,
            },
          },
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

      // Coupon redemption
      if (coupon) {
        await tx.couponRedemption.create({
          data: {
            couponId: coupon.id,
            userId: userId ?? null,
            orderId: created.id,
          },
        });

        await tx.coupon.update({
          where: { id: coupon.id },
          data: {
            redemptionCount: {
              increment: 1,
            },
          },
        });
      }

      // Ambassador assignment
      if (ambassadorDelivery) {
        await tx.ambassadorDelivery.create({
          data: {
            ambassadorId:
              ambassadorDelivery.ambassadorId,
            orderId: created.id,
            payoutCents:
              ambassadorDelivery.payoutCents,
            status: "ASSIGNED",
          },
        });
      }

      // Referral credit
      if (
        userId &&
        user?.referredById &&
        !user.firstOrderCompleted
      ) {
        await tx.user.update({
          where: { id: userId },
          data: {
            firstOrderCompleted: true,
          },
        });

        await tx.user.update({
          where: {
            id: user.referredById,
          },
          data: {
            referralCredit: {
              increment: 10,
            },
          },
        });
      }

      return created;
    }
  );

  // ============================================================
  // 13. Fire-and-forget emails
  // ============================================================
  sendOrderEmails(order.id).catch((err) =>
    console.warn(
      "[checkout] email send failed",
      err
    )
  );

  return NextResponse.json({
    ok: true,
    orderNumber,
    orderId: order.id,
    redirect: `/checkout/success?order=${orderNumber}`,
  });
}