import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeClient as sanityClient } from "@/sanity/lib/client";
import { createHmac } from "crypto";
import { render } from "@react-email/render";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import OrderCompleted from "@/emails/OrderCompleted";
import { sendCustomerMessage } from "@/lib/notifications/send";
import {
  orderStatusMessage,
  resolveCustomerLocale,
} from "@/lib/notifications/order-messages";
import { cancelOrderNotifications } from "@/lib/notifications/schedule-order-messages";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://karyanabakery.ca";

// CANCELLED is accepted so a cancellation in Studio reaches Prisma and, more
// importantly, calls off the notifications Twilio is already holding — without
// it a cancelled order would still text the customer "your order is ready".
const VALID_STATUSES = [
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

async function notifyCustomer(
  status: ValidStatus,
  order: {
    orderNumber: string;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    preferredLang?: string | null;
    isPickup: boolean;
  }
) {
  // Ready, on the way, and completed all get a message — WhatsApp first,
  // SMS if that can't be delivered — written in the customer's language
  // instead of the old bilingual one-liner.
  if (
    (status === "READY" ||
      status === "OUT_FOR_DELIVERY" ||
      status === "COMPLETED") &&
    order.customerPhone
  ) {
    const locale = resolveCustomerLocale({
      preferredLang: order.preferredLang,
      name: order.customerName,
    });

    const channel = await sendCustomerMessage(
      order.customerPhone,
      orderStatusMessage(status, locale, {
        orderNumber: order.orderNumber,
        isPickup: order.isPickup,
      }),
      APP_URL
    );

    console.log(
      `[sanity-order webhook] ${order.orderNumber} → ${status} notified via ${channel}`
    );
  }

  if (status === "COMPLETED" && order.customerEmail) {
    try {
      const html = await render(
        OrderCompleted({
          appUrl: APP_URL,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
        })
      );
      await resend.emails.send({
        from: FROM_EMAIL,
        to: order.customerEmail,
        subject: `Tu pedido ${order.orderNumber} fue entregado — Karyana Bakery`,
        html,
      });
    } catch (err) {
      console.error("[sanity-order webhook] completion email failed", err);
    }
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
      orderNumber, prismaId, customerName, customerEmail, customerPhone,
      fulfillmentType
    }`,
    { id: cleanId }
  );

  if (!order) {
    return NextResponse.json({ error: "Order not found in Sanity" }, { status: 404 });
  }

  // Orders created by hand in Studio have no prismaId — nothing to sync
  // back to Prisma for those, but notifications still apply below.
  if (order.prismaId) {
    const timestampField: Record<ValidStatus, string> = {
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
  let scheduled: { readyMsgSid: string | null; completedMsgSid: string | null } =
    { readyMsgSid: null, completedMsgSid: null };

  if (order.prismaId) {
    const record = await prisma.order
      .findUnique({
        where: { id: order.prismaId },
        select: {
          readyMsgSid: true,
          completedMsgSid: true,
          user: { select: { preferredLang: true } },
        },
      })
      .catch(() => null);

    preferredLang = record?.user?.preferredLang ?? null;
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
    isPickup: order.fulfillmentType !== "DELIVERY",
  });

  console.log(`[sanity-order webhook] ${cleanId} → ${status}`);

  return NextResponse.json({ ok: true });
}
