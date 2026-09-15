import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeClient as sanityClient } from "@/sanity/lib/client";
import { sendCustomerMessage } from "@/lib/notifications/send";
import {
  orderStatusMessage,
  resolveCustomerLocale,
  type NotifiableStatus,
} from "@/lib/notifications/order-messages";
import { nextStatus, type AutomatableOrder } from "@/lib/orders/auto-status";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.karyanabakery.ca";

const TIMESTAMP_FIELD: Record<string, string> = {
  IN_PROGRESS: "inProgressAt",
  READY: "readyAt",
  OUT_FOR_DELIVERY: "outForDeliveryAt",
  COMPLETED: "completedAt",
};

type OrderForAutomation = AutomatableOrder & {
  id: string;
  orderNumber: string;
  guestName: string | null;
  guestPhone: string | null;
  user: { phone: string | null; preferredLang: string; name: string | null } | null;
};

async function notify(order: OrderForAutomation, status: NotifiableStatus) {
  const phone = order.user?.phone ?? order.guestPhone;
  if (!phone) return "none";

  const locale = resolveCustomerLocale({
    preferredLang: order.user?.preferredLang,
    name: order.user?.name ?? order.guestName,
  });

  const body = orderStatusMessage(status, locale, {
    orderNumber: order.orderNumber,
    isPickup: order.fulfillmentType !== "DELIVERY",
  });

  return sendCustomerMessage(phone, body, APP_URL);
}

/** Keeps Sanity Studio showing the same status the site does. */
async function syncToSanity(orderId: string, status: string) {
  try {
    await sanityClient.patch(`order-${orderId}`).set({ status }).commit();
  } catch (err) {
    // A missing Sanity doc (older order, manual entry) shouldn't fail the run.
    console.warn(
      `[cron/order-status] Sanity sync skipped for ${orderId}:`,
      err instanceof Error ? err.message : err
    );
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const orders = (await prisma.order.findMany({
    where: {
      status: { notIn: ["COMPLETED", "CANCELLED"] },
      paymentStatus: { notIn: ["FAILED", "REFUNDED"] },
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      fulfillmentType: true,
      createdAt: true,
      pickupDate: true,
      pickupTime: true,
      guestName: true,
      guestPhone: true,
      deliverySlot: { select: { startTime: true } },
      user: { select: { phone: true, preferredLang: true, name: true } },
    },
  })) as OrderForAutomation[];

  const changed: {
    orderNumber: string;
    from: string;
    to: string;
    notified?: string;
  }[] = [];

  for (const order of orders) {
    const target = nextStatus(order, now);
    if (!target) continue;

    try {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: target as never,
          [TIMESTAMP_FIELD[target]]: now,
        },
      });
    } catch (err) {
      console.error(
        `[cron/order-status] failed to update ${order.orderNumber}`,
        err
      );
      continue;
    }

    await syncToSanity(order.id, target);

    // The customer hears from us when the order is ready and when it's done.
    let notified: string | undefined;
    if (target === "READY" || target === "COMPLETED") {
      notified = await notify(order, target as NotifiableStatus);
    }

    changed.push({
      orderNumber: order.orderNumber,
      from: order.status,
      to: target,
      notified,
    });
  }

  console.log(
    `[cron/order-status] checked ${orders.length}, advanced ${changed.length}`
  );

  return NextResponse.json({
    ok: true,
    checked: orders.length,
    advanced: changed.length,
    changed,
  });
}
