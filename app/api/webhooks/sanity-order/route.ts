import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeClient as sanityClient } from "@/sanity/lib/client";
import { createHmac } from "crypto";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { sendOrderCompletedEmail } from "@/lib/email/order-completed";
import { sendCustomerMessage } from "@/lib/notifications/send";
import {
  orderStatusMessage,
  resolveCustomerLocale,
} from "@/lib/notifications/order-messages";
import { cancelOrderNotifications } from "@/lib/notifications/schedule-order-messages";
import { shouldNotify, optOutDocId } from "@/lib/notifications/consent";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://karyanabakery.ca";

// CANCELLED is accepted so a cancellation in Studio reaches Prisma and, more
// importantly, calls off the notifications Twilio is already holding — without
// it a cancelled order would still text the customer "your order is ready".
const VALID_STATUSES = [
  // "Confirmado" — the first of the four states the meeting asked
  // customers to be told about (Situación 10). It was missing entirely.
  "CONFIRMED",
  "IN_PROGRESS",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const;

type ValidStatus = (typeof VALID_STATUSES)[number];

function verify(req: Request, body: string): boolean {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret) return true; // skip in dev if not set
  const sig = req.headers.get("sanity-webhook-signature") || "";
  const [, hash] = sig.split("=");
  const expected = createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return hash === expected;
}

/**
 * Has this number asked us to stop?
 *
 * Read per message rather than cached: an opt-out that takes effect in
 * an hour is an opt-out that failed. A failed lookup is treated as NOT
 * opted out, because the alternative is an outage silently stopping
 * every "your order is ready" text in the bakery.
 */
async function hasOptedOut(phone: string | null): Promise<boolean> {
  const docId = optOutDocId(phone);
  if (!docId) return false;
  try {
    const found = await sanityClient.fetch<string | null>(
      `*[_type == "smsOptOut" && _id == $id][0]._id`,
      { id: docId }
    );
    return !!found;
  } catch (err) {
    console.error("[sanity-order webhook] opt-out check failed:", err);
    return false;
  }
}

async function notifyCustomer(
  status: ValidStatus,
  order: {
    _id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    notifiedStatuses?: unknown;
    preferredLang?: string | null;
    langChosenByUser?: boolean | null;
    isPickup: boolean;
  }
) {
  // All four states the meeting named — confirmado, en preparación, en
  // camino, entregado — plus READY, which is what "on its way" means for
  // a pickup. WhatsApp first, SMS if that cannot be delivered, in the
  // customer's own language.
  //
  // One decision, made in lib/notifications/consent.ts, so that a
  // customer who did not get a message can be explained rather than
  // guessed about.
  const decision = shouldNotify({
    status,
    phone: order.customerPhone,
    optedOut: await hasOptedOut(order.customerPhone),
    alreadySent: order.notifiedStatuses,
  });

  if (decision.send) {
    const locale = resolveCustomerLocale({
      preferredLang: order.preferredLang,
      langChosenByUser: order.langChosenByUser,
      name: order.customerName,
    });

    // Recorded BEFORE sending. A crash between the two costs one
    // message; recording after would cost a duplicate on every retried
    // webhook delivery, and a customer who gets "your order is ready"
    // three times stops reading them.
    try {
      await sanityClient
        .patch(order._id)
        .setIfMissing({ notifiedStatuses: [] })
        .append("notifiedStatuses", [status])
        .commit();
    } catch (err) {
      console.error("[sanity-order webhook] could not record the send:", err);
    }

    const channel = await sendCustomerMessage(
      order.customerPhone!,
      orderStatusMessage(status as never, locale, {
        orderNumber: order.orderNumber,
        isPickup: order.isPickup,
      }),
      APP_URL
    );

    console.log(
      `[sanity-order webhook] ${order.orderNumber} → ${status} notified via ${channel}`
    );
  } else {
    console.log(
      `[sanity-order webhook] ${order.orderNumber} → ${status} not notified (${decision.reason})`
    );
  }

  if (status === "COMPLETED") {
    await sendOrderCompletedEmail({
      email: order.customerEmail,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      locale: resolveCustomerLocale({
        preferredLang: order.preferredLang,
      langChosenByUser: order.langChosenByUser,
        name: order.customerName,
      }),
    });
  }
}

export async function POST(req: Request) {
  const raw = await req.text();

  if (!verify(req, raw)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const { _id, status } = payload;

  if (!_id) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  if (!VALID_STATUSES.includes(status as ValidStatus)) {
    return NextResponse.json(
      { error: `Invalid status: ${status}` },
      { status: 400 }
    );
  }

  // Fetch the current order document straight from Sanity rather than
  // trusting whatever fields the webhook payload happens to include — this
  // way it works no matter how the Sanity webhook's payload is configured,
  // and gives us customer contact info for notifications either way.
  const cleanId = String(_id).replace(/^drafts\./, "");
  const order = await sanityClient.fetch(
    `*[_id == "drafts." + $id || _id == $id] | order(_updatedAt desc) [0] {
      _id, orderNumber, prismaId, customerName, customerEmail, customerPhone,
      fulfillmentType, notes, notifiedStatuses
    }`,
    { id: cleanId }
  );

  if (!order) {
    return NextResponse.json({ error: "Order not found in Sanity" }, { status: 404 });
  }

  // Corrections the bakery made in Studio — a mistyped email, a phone that
  // changed, a note the customer called in — land on the order itself, which
  // the notification code now prefers over the account. Writing them to the
  // account instead would change the customer's login.
  if (order.prismaId) {
    try {
      await prisma.order.update({
        where: { id: order.prismaId },
        data: {
          guestName: order.customerName || null,
          guestEmail: order.customerEmail || null,
          guestPhone: order.customerPhone || null,
          notes: order.notes || null,
        },
      });
    } catch (err) {
      console.error(
        `[sanity-order webhook] could not save contact edits for ${order.prismaId}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  // Orders created by hand in Studio have no prismaId — nothing to sync
  // back to Prisma for those, but notifications still apply below.
  if (order.prismaId) {
    const timestampField: Record<ValidStatus, string> = {
      CONFIRMED: "confirmedAt",
      IN_PROGRESS: "inProgressAt",
      READY: "readyAt",
      OUT_FOR_DELIVERY: "outForDeliveryAt",
      COMPLETED: "completedAt",
      CANCELLED: "cancelledAt",
    };

    try {
      await prisma.order.update({
        where: { id: order.prismaId },
        data: {
          status: status as any,
          [timestampField[status as ValidStatus]]: new Date(),
        },
      });
    } catch (err) {
      console.error(`[sanity-order webhook] Prisma update failed for ${order.prismaId}`, err);
    }
  }

  // The customer's language and the pending Twilio message SIDs live in
  // Prisma, not in the Sanity mirror.
  let preferredLang: string | null = null;
  let langChosenByUser = false;
  let scheduled: { readyMsgSid: string | null; completedMsgSid: string | null } =
    { readyMsgSid: null, completedMsgSid: null };

  if (order.prismaId) {
    const record = await prisma.order
      .findUnique({
        where: { id: order.prismaId },
        select: {
          readyMsgSid: true,
          completedMsgSid: true,
          user: { select: { preferredLang: true, langChosenByUser: true } },
        },
      })
      .catch(() => null);

    preferredLang = record?.user?.preferredLang ?? null;
    langChosenByUser = record?.user?.langChosenByUser ?? false;
    scheduled = {
      readyMsgSid: record?.readyMsgSid ?? null,
      completedMsgSid: record?.completedMsgSid ?? null,
    };
  }

  if (status === "CANCELLED") {
    // Call off whatever Twilio is still holding for this order instead of
    // texting the customer about a cancelled one.
    await cancelOrderNotifications(scheduled);
    console.log(`[sanity-order webhook] ${cleanId} cancelled — pending texts called off`);
    return NextResponse.json({ ok: true, cancelled: true });
  }

  await notifyCustomer(status as ValidStatus, {
    ...order,
    preferredLang,
    langChosenByUser,
    isPickup: order.fulfillmentType !== "DELIVERY",
  });

  console.log(`[sanity-order webhook] ${cleanId} → ${status}`);

  return NextResponse.json({ ok: true });
}
