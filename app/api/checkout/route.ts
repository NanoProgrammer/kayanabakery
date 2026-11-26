import { NextResponse, after } from "next/server";
import { z } from "zod";
import * as field from "@/lib/validation/fields";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { sanityFetch } from "@/sanity/lib/fetch";
import { writeClient as sanityClient } from "@/sanity/lib/client";
import { createSanityOrder } from "@/lib/orders/sanity-sync";
import { effectiveTier } from "@/lib/membership/access";
import { formatPickupFromForm, formatPickupWindow } from "@/lib/studio/pickup-label";
import {
  describeChoices,
  resolveOptions,
  type ProductOption,
} from "@/lib/products/options";
import { isClosedDate } from "@/lib/checkout/closures";
import { bakeryDateString } from "@/lib/time/edmonton";

/**
 * Vercel's default is 10 seconds. A checkout is a Square round trip, a dozen
 * queries and a cold Neon start, and being cut off halfway through costs a
 * customer their money — so buy the time instead.
 */
export const maxDuration = 60;
import { squareClient, SQUARE_LOCATION_ID as locationId } from "@/lib/square/client";
import { computePricing } from "@/lib/checkout/pricing";
import { snapshotAddress } from "@/lib/orders/delivery-address";
import { isSECalgary } from "@/lib/checkout/postal-codes";
import { generateOrderNumber } from "@/lib/checkout/order-number";
import { ambassadorPayoutCents } from "@/lib/membership/tiers";
import { sendOrderEmails } from "@/lib/email/send-order-emails";
import { resend, FROM_EMAIL, ORDERS_EMAIL } from "@/lib/email/resend";
import { randomUUID } from "crypto";
import { getCalendar, KARYANA_CALENDAR_ID, TIMEZONE } from "@/lib/google/calendar";
import { syncOrderCompleted, syncGuestOrder } from "@/lib/brevo/sync";
import { getServerLocale } from "@/lib/i18n/server";
import { withBuiltInOptions } from "@/lib/products/built-in-options";
import { checkDeliveryLeadTime, leadTimeMessage } from "@/lib/checkout/lead-time";
import {
  findWindow,
  atBakeryHour,
  effectivePickupLeadHours,
} from "@/lib/checkout/pickup-windows";
import { orderLeadHours, orderIsReadyNow } from "@/lib/products/ready-now";
import { earnsCoupon, couponDocument } from "@/lib/coupons/discover-bread";
import { stockDecrements, needsClamp } from "@/lib/products/stock";

/**
 * The categories whose products follow the cake schedule. A cake in the
 * basket moves the whole pickup onto the cake windows, because the order
 * goes out in one handover.
 */
const CAKE_CATEGORY_SLUGS = [
  "cakes",
  "tres-leches",
  "gourmet",
  "clasicos",
  "gelatinas-y-flanes",
];

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
  paymentToken: z.string().min(1).optional(),
  fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
  pickupDate: z.string().optional(),
  pickupTime: z.string().optional(),
  deliverySlotId: z.string().optional(),
  addressId: z.string().optional(),
  // The same field rules the account pages use. A guest's details and address
  // reached the database and the delivery label unchecked: a postal code that
  // is not one cannot be matched to a delivery zone, and a phone number that
  // was never normalised is a customer who does not get their order texts.
  guestEmail: field.email.optional(),
  guestName: field.personName.optional(),
  guestPhone: field.optionalPhone,
  phone: field.optionalPhone, // logged-in user's phone, when missing from their profile
  guestAddress: z
    .object({
      street: field.street,
      city: field.city,
      province: field.province,
      postalCode: field.postalCode,
      buzzer: field.buzzer,
      notes: field.notes,
    })
    .optional(),
  couponCode: field.code.optional(),
  pointsToRedeem: z.number().int().min(0).optional(),
  tipCents: z.number().int().min(0).optional(),
  // What the customer wants the kitchen to know. The slip has printed a
  // "Customer note" box since it was built and it was always empty on web
  // orders, because the checkout never asked for one.
  orderNotes: field.notes,
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
        // Which size, which flavour. Labels only — the price for each comes
        // from Sanity below, never from the browser.
        options: z.record(z.string().max(48), z.string().max(80)).optional(),
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
      {
        // Name the field: the rules reject real mistakes now — a postal code
        // that is not one — and "Invalid input" leaves the customer stuck on a
        // page with their card already typed in.
        error: parsed.error.issues[0]?.message ?? "Invalid input",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  const guestLocale = await getServerLocale();

  const closedDateError = () => NextResponse.json(
    { error: guestLocale === "es"
      ? "La panadería está cerrada ese día. Elige otra fecha."
      : "The bakery is closed that day. Please choose another date." },
    { status: 409 }
  );

  if (data.fulfillmentType === "PICKUP" && data.pickupDate && isClosedDate(data.pickupDate.slice(0, 10))) {
    return closedDateError();
  }

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
      stockQuantity?: number;
      categorySlugs?: string[];
      options?: ProductOption[];
    }>
  >({
    query: `*[_type == "product" && _id in $ids]{
      _id, name, "slug": slug.current, price, inStock, membersOnly, isOffSeason, leadTime, stockQuantity,
      "categorySlugs": categories[]->slug.current,
      options[]{ name, nameEs, key, required, choices[]{ label, labelEs, priceDelta, soldOut } }
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

  const tier = effectiveTier(user?.membership);
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
  // Each line is priced from the catalog: the product's own price plus
  // whatever the chosen size or flavour adds. The browser only says which
  // choice was picked — a price it sent would be a price it could edit.
  const items: {
    productId: string;
    name: string;
    slug: string;
    price: number;
    quantity: number;
    categorySlugs?: string[];
    options?: Record<string, string>;
    optionsLabel?: string;
  }[] = [];

  for (const it of data.items) {
    const p = products.find((pr) => pr._id === it.productId)!;
    // The same fill-in the product page uses. If these two ever disagreed,
    // a customer would pick a flavour and be told it was invalid.
    const resolved = resolveOptions(withBuiltInOptions(p), it.options, p.name);

    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    items.push({
      productId: p._id,
      name: p.name,
      slug: p.slug,
      price: p.price * 100 + resolved.priceDeltaCents,
      quantity: it.quantity,
      // Read from the catalog, never from the browser: a coupon limited to
      // one category is only as safe as where its category comes from.
      categorySlugs: p.categorySlugs ?? [],
      ...(resolved.choices.length
        ? {
            options: Object.fromEntries(resolved.choices.map((c) => [c.key, c.label])),
            optionsLabel: describeChoices(resolved.choices),
          }
        : {}),
    });
  }

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
    if (isClosedDate(bakeryDateString(deliverySlot.startTime))) {
      return closedDateError();
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
        startsAt, expiresAt, active, membershipOnly, appliesTo
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
    // FREE_BREAD vale dos panes, no dinero. Se fuerza a cero aquí para
    // que un número escrito por accidente en el Studio no descuente
    // nada: los panes van en la caja, nunca en la cuenta.
    const discountValue =
      sanityCoupon.discountType === "FREE_BREAD"
        ? 0
        : sanityCoupon.discountType === "FIXED"
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

  // ── Production time ────────────────────────────────────────────────
  //
  // The kitchen needs notice, and until now nothing on the server checked
  // it: the browser was the only guard, so a page left open, a stale cache
  // or a request built by hand walked straight past. An order came in for a
  // same-day 4 PM pickup on items needing hours of preparation.
  //
  // The window is derived from the date here, never from the label the
  // browser sent — that label is exactly what a forged order would lie
  // about.
  // A product with a number in Studio's stock box is already baked, so it
  // needs no notice. Counted against what the customer actually asked for:
  // three on the shelf and four wanted means the fourth still has to be
  // made, and telling them otherwise sends someone over for bread that is
  // not there.
  const stocked = products.map((p) => ({
    leadTime: p.leadTime ?? 0,
    stockQuantity: p.stockQuantity ?? null,
    quantity: data.items
      .filter((it) => it.productId === p._id)
      .reduce((n, it) => n + it.quantity, 0),
  }));
  const leadHours = orderLeadHours(stocked);
  const readyNow = orderIsReadyNow(stocked);

  // Cakes have their own windows and their own notice; bread has the
  // eight-hour floor. Read from the catalog, never from what the browser
  // sent — the category is what decides which schedule applies.
  const hasCake = products.some((p) =>
    (p.categorySlugs ?? []).some((slug) => CAKE_CATEGORY_SLUGS.includes(slug))
  );

  if (data.fulfillmentType === "PICKUP") {
    const dateStr = (data.pickupDate ?? "").slice(0, 10);

    // The window the browser sent has to be one the bakery actually offers
    // that day. Checking only the date would let a request name any hours
    // it liked — Sunday has no 7-9 PM window, and nothing stopped an order
    // claiming one.
    const window = findWindow(dateStr, data.pickupTime, hasCake);
    if (!window) {
      return NextResponse.json(
        {
          error: "BAD_PICKUP_WINDOW",
          message: "That pickup time is not one we offer on that day.",
          messageEs: "Ese horario de recolección no existe ese día.",
        },
        { status: 400 }
      );
    }

    // Eight hours minimum on every pickup, or longer if something in the
    // basket needs it.
    // Nothing to make means nothing to wait for — the eight-hour pickup
    // floor is there for bread that still has to be baked.
    const required = effectivePickupLeadHours(leadHours, hasCake, readyNow);
    const opensAt = atBakeryHour(dateStr, window.startHour);
    const verdict = checkDeliveryLeadTime({ slotStart: opensAt, leadHours: required, now: new Date() });

    if (!verdict.ok) {
      return NextResponse.json(
        {
          error: "LEAD_TIME",
          message: leadTimeMessage(verdict, "en"),
          messageEs: leadTimeMessage(verdict, "es"),
          leadHours: required,
          earliestDate: (verdict as any).earliestDate ?? null,
        },
        { status: 409 }
      );
    }
  } else if (leadHours > 0) {
    const verdict = checkDeliveryLeadTime({
      slotStart: deliverySlot!.startTime,
      leadHours,
      now: new Date(),
    });
    if (!verdict.ok) {
      return NextResponse.json(
        {
          error: "LEAD_TIME",
          message: leadTimeMessage(verdict, "en"),
          messageEs: leadTimeMessage(verdict, "es"),
          leadHours,
          earliestDate: (verdict as any).earliestDate ?? null,
        },
        { status: 409 }
      );
    }
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
          // Without this a coupon limited to one category discounts the
          // whole order — which for a 100% one is the entire cart.
          appliesTo: coupon.appliesTo ?? null,
        }
      : null,
    pointsToRedeem: data.pointsToRedeem ?? 0,
    tipCents: data.tipCents ?? 0,
    prioritySlotFeeCents,
  });

  if (pricing.errors.length) {
    return NextResponse.json({ error: pricing.errors.join("; ") }, { status: 400 });
  }

  if (pricing.totalCents > 0 && !data.paymentToken) {
    return NextResponse.json({ error: "Payment card required" }, { status: 400 });
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

  if (pricing.totalCents > 0) {
    try {
      const result = await squareClient.payments.create({
        sourceId: data.paymentToken!,
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
  }

  // ============================================================
  // 12. Create order transaction
  // ============================================================
  const orderNumber = generateOrderNumber();

  let order: Awaited<ReturnType<typeof buildOrder>>;

  const buildOrder = () => prisma.$transaction(async (tx) => {
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
        paymentMethod: pricing.totalCents === 0 ? "POINTS" : "SQUARE",
        squarePaymentId: paymentId,
        fulfillmentType: data.fulfillmentType,
        pickupDate: data.pickupDate ? new Date(data.pickupDate) : null,
        pickupTime: data.pickupTime ?? null,
        deliverySlotId: data.deliverySlotId ?? null,
        addressId: savedAddress?.id ?? null,
        // A copy, not just the link. The saved address can be edited or
        // deleted later; where this order went cannot change afterwards.
        deliveryAddress: snapshotAddress(savedAddress) as any,
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
        notes: data.orderNotes || null,
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
      const debited = await tx.user.updateMany({
        where: { id: userId, pointsBalance: { gte: data.pointsToRedeem } },
        data: { pointsBalance: { decrement: data.pointsToRedeem } },
      });
      if (debited.count !== 1) throw new Error("Not enough points to complete this order");
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

    return created;
  },
  {
    // Prisma's defaults are maxWait 2s and timeout 5s. There are a dozen
    // round trips in here, and Neon suspends when the bakery is quiet, so the
    // first one after a lull can spend seconds just waking the database. At
    // the defaults that transaction is killed — after Square has already taken
    // the money. These are generous on purpose: a slow checkout beats a
    // customer charged for an order nobody ever saw.
    maxWait: 15_000,
    timeout: 30_000,
  });

  try {
    order = await buildOrder();
  } catch (err) {
    if (pricing.totalCents === 0) {
      console.error("[checkout] zero-dollar points order not saved", err);
      return NextResponse.json(
        { error: "We couldn't save your points order. Your card has not been charged." },
        { status: 503 }
      );
    }
    // The card has been charged at this point. Whatever happens, the customer
    // must not be handed a blank 500 — that reads as "it failed", they pay
    // again, and the bakery owes a refund it does not know about. Say plainly
    // that the money went through, and leave the payment id everywhere it can
    // be found: in the logs, and in the customer's own error message.
    console.error(
      `[checkout] PAID BUT NOT SAVED — Square payment ${paymentId} for ${pricing.totalCents} cents was taken and the order could not be written.`,
      err
    );
    return NextResponse.json(
      {
        code: "PAID_NOT_SAVED",
        paid: true,
        paymentId,
        error:
          "Your payment went through but we could not save the order. Please do not pay again — contact the bakery with this reference: " +
          paymentId,
      },
      { status: 500 }
    );
  }

  // ============================================================
  // 12.5 Sync order to Sanity Studio, CRM, and send emails after response
  // ============================================================
  const deliveryAddress = address
    ? `${address.street}, ${address.city}, ${address.province} ${address.postalCode}`
    : null;
  // One shape for both, through the same formatter Studio writes with, so the
  // field can be read back. These used to be two different hand-rolled strings
  // — and the delivery one was built with no time zone, so on a server running
  // in UTC a 1 p.m. Calgary slot was written down as 7:00 p.m.
  const slotLabel = deliverySlot
    ? formatPickupWindow(deliverySlot.startTime, deliverySlot.endTime)
    : data.pickupDate
    ? formatPickupFromForm(data.pickupDate, data.pickupTime)
    : null;

  // These run after the response is sent, but `after()` keeps the serverless
  // function alive until they finish — plain fire-and-forget promises here
  // can get cut off mid-flight the instant the response goes out, which is
  // how an order confirms and emails send but never lands in Sanity Studio.
  after(async () => {
    // Buy a cake, earn two breads. The code is derived from the order
    // number, so issuing it twice for the same order writes the same
    // document and the second write is a no-op rather than a second coupon.
    const lines = items.map((it) => ({
      name: it.name,
      slug: it.slug,
      categorySlugs: it.categorySlugs ?? [],
    }));
    if (earnsCoupon(lines)) {
      try {
        const { writeClient } = await import("@/sanity/lib/client");
        await writeClient.createIfNotExists(couponDocument(orderNumber));
      } catch (err) {
        // A coupon that fails to mint must not take the order with it. The
        // slip still prints the code, so the customer is not left short —
        // it can be created by hand from what is on the ticket.
        console.error("[discover-bread] could not create the coupon:", err);
      }
    }

    // Take what was sold off the shelf (Situación 13).
    //
    // Nothing used to do this. The checkout read stockQuantity to decide
    // a box needed no lead time and could be collected today, and then
    // left the number untouched — so after the six real boxes were gone,
    // the seventh customer was still promised same-day pickup on a box
    // that did not exist.
    //
    // `dec` is atomic on Sanity's side, which is the point: two orders
    // placed in the same second both reading "1" and both selling it is
    // exactly the race this has to survive.
    const decrements = stockDecrements(data.items, products);
    if (decrements.length) {
      try {
        const { writeClient } = await import("@/sanity/lib/client");
        let tx = writeClient.transaction();
        for (const d of decrements) {
          tx = tx.patch(d.productId, (p) => p.dec({ stockQuantity: d.by }));
        }
        await tx.commit();

        // An atomic decrement can land below zero. The code reads any
        // count at or below zero the same way, so this changes no
        // behaviour — but a negative number in the Studio reads as a bug
        // to whoever sees it, and Karyana has to trust this field.
        const after = await writeClient.fetch<{ _id: string; stockQuantity: number | null }[]>(
          `*[_id in $ids]{ _id, stockQuantity }`,
          { ids: decrements.map((d) => d.productId) }
        );
        const negative = after.filter((p) => needsClamp(p.stockQuantity));
        if (negative.length) {
          let fix = writeClient.transaction();
          for (const p of negative) {
            fix = fix.patch(p._id, (patch) => patch.set({ stockQuantity: 0 }));
          }
          await fix.commit();
        }
      } catch (err) {
        // Stock that fails to come down must not take the order with it:
        // the customer has paid. It is logged loudly because the result
        // is overselling same-day pickup, which someone has to notice.
        console.error("[stock] could not decrement after", orderNumber, err);
      }
    }

    await createSanityOrder({
      orderNumber,
      prismaId: order.id,
      customerName: user?.name ?? data.guestName ?? "Guest",
      customerEmail: user?.email ?? data.guestEmail ?? "",
      customerPhone: (user as any)?.phone ?? data.guestPhone ?? "",
      customerTier: tier,
      fulfillmentType: data.fulfillmentType,
      // The slip has printed a "Customer note" box all along; this is what
      // finally fills it. Without this the note reaches Prisma and the
      // kitchen never sees it.
      notes: data.orderNotes || null,
      couponCode: coupon?.code ?? null,
      totalCents: pricing.totalCents,
      items: items.map((it) => ({
        productId: it.productId,
        name: it.name,
        options: it.optionsLabel ?? null,
        quantity: it.quantity,
        price: it.price,
      })),
      deliveryAddress,
      pickupDate: slotLabel,
      status: "IN_PROGRESS",
      source: "checkout",
    });

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

    // No "ready" or "completed" message is scheduled here any more.
    //
    // Both used to be handed to Twilio at checkout for delivery at a guessed
    // time — an hour before the pickup window, 11 PM on the day — and a cron
    // moved the status on the same guesses. The guesses were wrong: customers
    // were told their bread was waiting when the kitchen hadn't started it,
    // and orders closed themselves out at 11 PM so customers got "your order
    // is complete" for bread still on the shelf. One drove over for nothing.
    //
    // Only the bakery knows when an order is really ready, so status changes
    // come from Studio now, and the Sanity webhook sends the message when a
    // person makes the change. Nothing here guesses.
  });

  return NextResponse.json({
    ok: true,
    orderNumber,
    orderId: order.id,
    redirect: `/checkout/success?order=${orderNumber}`,
  });
}
