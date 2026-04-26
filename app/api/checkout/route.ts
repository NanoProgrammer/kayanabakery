import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { squareClient } from "@/lib/square/client";
import { sendOrderEmails } from "@/lib/email/send-order-emails";
import { generateOrderNumber } from "@/lib/utils";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    const body = await req.json();

    const {
      sourceId,
      items,
      subtotal,
      total,
      fulfillmentType,
      addressId,
      pickupDate,
      pickupTime,
      notes,
      guestEmail,
      guestName,
      guestPhone,
    } = body;

    if (!items?.length || !total) {
      return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
    }

    // Process Square payment
    let squarePaymentId: string | null = null;
    if (sourceId && process.env.SQUARE_ACCESS_TOKEN) {
      try {
        const result = await squareClient.payments.create({
          sourceId,
          idempotencyKey: randomUUID(),
          amountMoney: {
            amount: BigInt(total),
            currency: "CAD",
          },
          locationId: process.env.SQUARE_LOCATION_ID!,
          note: `Karyana order`,
        });
        squarePaymentId = result.payment?.id ?? null;
      } catch (e: any) {
        console.error("Square error:", e);
        return NextResponse.json(
          { error: e.message || "Payment failed" },
          { status: 402 }
        );
      }
    }

    const orderNumber = generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        guestEmail: userId ? null : guestEmail,
        guestName: userId ? null : guestName,
        guestPhone: userId ? null : guestPhone,
        items,
        subtotal,
        total,
        fulfillmentType,
        addressId: addressId || null,
        pickupDate: pickupDate ? new Date(pickupDate) : null,
        pickupTime,
        notes,
        squarePaymentId,
        status: "CONFIRMED",
        paymentStatus: squarePaymentId ? "PAID" : "PENDING",
      },
      include: { user: true, address: true },
    });

    // Fire & forget emails (don't block response)
    sendOrderEmails(order).catch((e) =>
      console.error("Email send failed:", e)
    );

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (e: any) {
    console.error("Checkout error:", e);
    return NextResponse.json(
      { error: e.message || "Checkout failed" },
      { status: 500 }
    );
  }
}
