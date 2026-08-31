import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeClient as sanityClient } from "@/sanity/lib/client";
import { createHmac } from "crypto";
import { render } from "@react-email/render";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import OrderCompleted from "@/emails/OrderCompleted";
import { sendSms } from "@/lib/sms/twilio";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://karyanabakery.ca";

const VALID_STATUSES = [
  "IN_PROGRESS",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
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
  }
) {
  if (status === "OUT_FOR_DELIVERY" && order.customerPhone) {
    try {
      await sendSms(
        order.customerPhone,
        `🚚 Karyana Bakery: ¡Tu pedido ${order.orderNumber} va en camino! / Your order is on its way!`
      );
    } catch (err) {
      console.error("[sanity-order webhook] SMS send failed", err);
    }
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
      orderNumber, prismaId, customerName, customerEmail, customerPhone
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

  await notifyCustomer(status as ValidStatus, order);

  console.log(`[sanity-order webhook] ${cleanId} → ${status}`);

  return NextResponse.json({ ok: true });
}
