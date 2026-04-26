import { render } from "@react-email/render";
import { renderToBuffer } from "@react-pdf/renderer";
import { resend } from "./resend";
import { OrderConfirmationEmail } from "@/emails/OrderConfirmation";
import { OwnerNewOrderEmail } from "@/emails/OwnerNewOrder";
import { InvoicePdf } from "./invoice-pdf";
import type { OrderItem } from "@/types";

type OrderWithRelations = {
  id: string;
  orderNumber: string;
  subtotal: number;
  total: number;
  createdAt: Date;
  fulfillmentType: string;
  pickupDate: Date | null;
  pickupTime: string | null;
  notes: string | null;
  items: any;
  guestEmail: string | null;
  guestName: string | null;
  guestPhone: string | null;
  user: { email: string; name: string | null; phone: string | null } | null;
  address: any;
};

export async function sendOrderEmails(order: OrderWithRelations) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping emails");
    return;
  }

  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const ownerEmail =
    process.env.OWNER_EMAIL || "karyana@karyanabakery.ca";

  const customerEmail = order.user?.email || order.guestEmail || "";
  const customerName =
    order.user?.name || order.guestName || "Valued customer";
  const customerPhone = order.user?.phone || order.guestPhone;

  const items = order.items as OrderItem[];

  // Customer email
  const customerHtml = await render(
    OrderConfirmationEmail({
      orderNumber: order.orderNumber,
      customerName,
      items,
      subtotal: order.subtotal,
      total: order.total,
      fulfillmentType: order.fulfillmentType,
      pickupDate: order.pickupDate?.toISOString() ?? null,
      pickupTime: order.pickupTime,
    })
  );

  await resend.emails.send({
    from,
    to: customerEmail,
    subject: `Order confirmed · ${order.orderNumber}`,
    html: customerHtml,
  });

  // Owner email + PDF invoice
  const ownerHtml = await render(
    OwnerNewOrderEmail({
      orderNumber: order.orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      items,
      total: order.total,
      fulfillmentType: order.fulfillmentType,
      pickupDate: order.pickupDate?.toISOString() ?? null,
      pickupTime: order.pickupTime,
      notes: order.notes,
      address: order.address,
    })
  );

  const pdfBuffer = await renderToBuffer(
    InvoicePdf({
      orderNumber: order.orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      items,
      subtotal: order.subtotal,
      total: order.total,
      createdAt: order.createdAt,
      fulfillmentType: order.fulfillmentType,
      pickupDate: order.pickupDate,
      pickupTime: order.pickupTime,
      notes: order.notes,
      address: order.address,
    }) as any
  );

  await resend.emails.send({
    from,
    to: ownerEmail,
    replyTo: customerEmail,
    subject: `🥖 New order · ${order.orderNumber} · $${(
      order.total / 100
    ).toFixed(2)}`,
    html: ownerHtml,
    attachments: [
      {
        filename: `${order.orderNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}
