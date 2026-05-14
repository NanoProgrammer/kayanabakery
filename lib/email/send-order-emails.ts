/**
 * Send confirmation emails using React Email templates.
 * Replaces the stub from ZIP 4.
 */

import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL, OWNER_EMAIL } from "@/lib/email/resend";
import { render } from "@react-email/render";
import OrderConfirmation from "@/emails/OrderConfirmation";
import OwnerNewOrder from "@/emails/OwnerNewOrder";
import { formatCents } from "@/lib/checkout/pricing";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://karyanabakery.ca";

export async function sendOrderEmails(orderId: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log("[send-order-emails] RESEND_API_KEY missing — skipping");
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      address: true,
      deliverySlot: true,
      ambassadorDeliveries: {
        include: { ambassador: { select: { name: true } } },
      },
    },
  });

  if (!order) return;

  const customerEmail = order.user?.email ?? order.guestEmail ?? null;
  const customerName = order.user?.name ?? order.guestName ?? "Customer";
  const locale = (order.user?.preferredLang as "en" | "es") ?? "en";

  const items = ((order.items as any[]) || []).map((it) => ({
    name: locale === "es" && it.nameEs ? it.nameEs : it.name,
    quantity: it.quantity,
    lineTotal: formatCents(it.price * 100 * it.quantity, locale),
  }));

  let fulfillmentLabel: string;
  let fulfillmentDetail: string;
  if (order.fulfillmentType === "PICKUP") {
    fulfillmentLabel = locale === "es" ? "Recolección" : "Pickup";
    fulfillmentDetail = order.pickupDate
      ? `${order.pickupDate.toLocaleDateString(
          locale === "es" ? "es-MX" : "en-CA",
          { weekday: "long", month: "short", day: "numeric" }
        )} · ${order.pickupTime ?? ""}`
      : "";
  } else {
    fulfillmentLabel = locale === "es" ? "Envío" : "Delivery";
    fulfillmentDetail = order.deliverySlot
      ? order.deliverySlot.startTime.toLocaleString(
          locale === "es" ? "es-MX" : "en-CA",
          {
            weekday: "long",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }
        )
      : "";
  }

  const addressLine = order.address
    ? `${order.address.street}, ${order.address.city}, ${order.address.province} ${order.address.postalCode}`
    : null;

  const deliveryLineLabel =
    order.fulfillmentType === "PICKUP"
      ? locale === "es"
        ? "Recolección"
        : "Pickup"
      : locale === "es"
      ? "Envío"
      : "Delivery";

  const deliveryLineValue =
    order.deliveryFee > 0
      ? formatCents(order.deliveryFee, locale)
      : order.freeDeliveryReason === "MEMBER_FREE_DELIVERY"
      ? locale === "es"
        ? "GRATIS · MIEMBRO"
        : "FREE · MEMBER"
      : order.freeDeliveryReason === "FIRST_SE_DELIVERY"
      ? locale === "es"
        ? "GRATIS · 1RA SE"
        : "FREE · 1ST SE"
      : locale === "es"
      ? "GRATIS"
      : "FREE";

  if (customerEmail) {
    try {
      const html = await render(
        OrderConfirmation({
          appUrl: APP_URL,
          orderNumber: order.orderNumber,
          customerName,
          fulfillmentLabel,
          fulfillmentDetail,
          addressLine,
          items,
          subtotal: formatCents(order.subtotal, locale),
          couponLine: order.couponDiscount
            ? {
                label: `${locale === "es" ? "Cupón" : "Coupon"} (${order.couponCode})`,
                value: `−${formatCents(order.couponDiscount, locale)}`,
              }
            : undefined,
          pointsLine: order.pointsDiscount
            ? {
                label: locale === "es" ? "Puntos canjeados" : "Points redeemed",
                value: `−${formatCents(order.pointsDiscount, locale)}`,
              }
            : undefined,
          deliveryLine: { label: deliveryLineLabel, value: deliveryLineValue },
          gst: formatCents(order.gst, locale),
          total: formatCents(order.total, locale),
          pointsEarned: order.pointsEarned,
          locale,
        })
      );

      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject:
          locale === "es"
            ? `Orden ${order.orderNumber} confirmada — Karyana Bakery`
            : `Order ${order.orderNumber} confirmed — Karyana Bakery`,
        html,
      });
    } catch (err) {
      console.warn("[send-order-emails] customer send failed", err);
    }
  }

  try {
    const ambassadorName =
      order.ambassadorDeliveries[0]?.ambassador?.name ?? null;

    const html = await render(
      OwnerNewOrder({
        appUrl: APP_URL,
        orderNumber: order.orderNumber,
        customerName,
        customerEmail: customerEmail ?? "",
        customerPhone: (order.user as any)?.phone ?? order.guestPhone ?? null,
        fulfillmentLabel,
        fulfillmentDetail,
        addressBlock: order.address
          ? `${order.address.street}\n${order.address.city}, ${order.address.province} ${order.address.postalCode}${order.address.buzzer ? `\nBuzzer: ${order.address.buzzer}` : ""}`
          : null,
        addressNotes: order.address?.notes ?? null,
        items,
        subtotal: formatCents(order.subtotal, "en"),
        couponLine: order.couponDiscount
          ? {
              label: `Coupon (${order.couponCode})`,
              value: `−${formatCents(order.couponDiscount, "en")}`,
            }
          : null,
        pointsLine: order.pointsDiscount
          ? {
              label: "Points",
              value: `−${formatCents(order.pointsDiscount, "en")}`,
            }
          : null,
        deliveryLine: { label: deliveryLineLabel, value: deliveryLineValue },
        gst: formatCents(order.gst, "en"),
        total: formatCents(order.total, "en"),
        ambassadorName,
      })
    );

    await resend.emails.send({
      from: FROM_EMAIL,
      to: OWNER_EMAIL,
      subject: `[New Order] ${order.orderNumber} — ${formatCents(order.total, "en")}`,
      html,
    });
  } catch (err) {
    console.warn("[send-order-emails] owner send failed", err);
  }
}
