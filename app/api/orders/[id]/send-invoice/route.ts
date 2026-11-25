import { NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/client";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import {
  invoiceBody,
  invoiceSubject,
  type InvoiceInput,
  type PaymentStatus,
} from "@/lib/orders/invoice-email";

/**
 * Email the customer their invoice, with where the payment stands.
 * Situación 7.
 *
 * Reads the Sanity order rather than Prisma, because the orders this is
 * for — taken by phone, typed into Studio — have no Prisma row at all.
 *
 * Like the packing-slip route, this is only ever called from inside the
 * Studio, which has its own login, and the document id is unguessable.
 * It sends to the address on the order and nowhere else, so it cannot be
 * turned into a way to mail a stranger.
 */
const VALID_STATUSES: PaymentStatus[] = ["UNPAID", "DEPOSIT", "PAID"];

/** Sanity stores money in dollars; the invoice works in cents. */
function toCents(dollars: unknown): number {
  const n = typeof dollars === "number" ? dollars : Number(dollars);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const docId = id.replace(/^drafts\./, "");

  const order = await writeClient.fetch<any>(
    `*[_type == "order" && _id == $id][0]{
      orderNumber, customerName, customerEmail, customerLanguage,
      total, paymentStatus, amountPaid, pickupDate,
      items[]{ name, options, quantity, price }
    }`,
    { id: docId }
  );

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const to = (order.customerEmail ?? "").trim();
  if (!to) {
    // Said precisely, because the Studio shows this back to whoever
    // pressed the button and "failed" would send them hunting.
    return NextResponse.json(
      { error: "This order has no email address. Add one and try again." },
      { status: 400 }
    );
  }

  const status: PaymentStatus = VALID_STATUSES.includes(order.paymentStatus)
    ? order.paymentStatus
    : "UNPAID";

  const input: InvoiceInput = {
    orderNumber: order.orderNumber ?? "—",
    customerName: order.customerName ?? null,
    locale: order.customerLanguage === "es" ? "es" : "en",
    lines: ((order.items as any[]) ?? []).map((it) => ({
      name: [it?.name, it?.options].filter(Boolean).join(" — "),
      quantity: it?.quantity ?? 1,
      priceCents: toCents(it?.price),
    })),
    totalCents: toCents(order.total),
    paymentStatus: status,
    amountPaidCents: toCents(order.amountPaid),
    pickupDate: order.pickupDate ?? null,
  };

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: invoiceSubject(input),
      text: invoiceBody(input),
    });
  } catch (err) {
    console.error("[invoice] could not send:", err);
    return NextResponse.json({ error: "The email could not be sent." }, { status: 502 });
  }

  // Recorded only after it actually went, so the Studio never shows a
  // timestamp for an email the customer never received.
  try {
    await writeClient.patch(docId).set({ invoiceSentAt: new Date().toISOString() }).commit();
  } catch (err) {
    console.error("[invoice] sent, but could not record it:", err);
  }

  return NextResponse.json({ ok: true, to });
}
