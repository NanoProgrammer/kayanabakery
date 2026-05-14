import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePDF, type InvoiceData } from "@/lib/pdf/invoice-pdf";
import { formatCents } from "@/lib/checkout/pricing";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://karyanabakery.ca";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: {
      id,
      // Customers see only their own; admins see any
      ...(role === "ADMIN" || role === "STAFF" ? {} : { userId }),
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      address: true,
      deliverySlot: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const items = ((order.items as any[]) || []).map((it) => ({
    name: it.name,
    quantity: it.quantity,
    price: formatCents(it.price * 100, "en"),
    lineTotal: formatCents(it.price * 100 * it.quantity, "en"),
  }));

  let fulfillmentDetail: string;
  if (order.fulfillmentType === "PICKUP") {
    fulfillmentDetail = order.pickupDate
      ? `${order.pickupDate.toLocaleDateString("en-CA", {
          weekday: "long",
          month: "short",
          day: "numeric",
        })} · ${order.pickupTime ?? ""}`
      : "Pickup";
  } else {
    fulfillmentDetail = order.deliverySlot
      ? order.deliverySlot.startTime.toLocaleString("en-CA", {
          weekday: "long",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "Delivery";
  }

  const data: InvoiceData = {
    orderNumber: order.orderNumber,
    date: order.createdAt.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    customerName: order.user?.name ?? order.guestName ?? "Customer",
    customerEmail: order.user?.email ?? order.guestEmail ?? "",
    customerPhone: order.user?.phone ?? order.guestPhone ?? null,
    fulfillmentType: order.fulfillmentType as "PICKUP" | "DELIVERY",
    fulfillmentDetail,
    address: order.address
      ? {
          street: order.address.street,
          city: order.address.city,
          province: order.address.province,
          postalCode: order.address.postalCode,
        }
      : null,
    items,
    subtotal: formatCents(order.subtotal, "en"),
    couponDiscount: order.couponDiscount
      ? formatCents(order.couponDiscount, "en")
      : null,
    couponCode: order.couponCode,
    pointsDiscount: order.pointsDiscount
      ? formatCents(order.pointsDiscount, "en")
      : null,
    deliveryFee:
      order.deliveryFee > 0
        ? formatCents(order.deliveryFee, "en")
        : "FREE",
    gst: formatCents(order.gst, "en"),
    total: formatCents(order.total, "en"),
    logoUrl: `${APP_URL}/logo.png`,
  };

  const stream = await renderToStream(<InvoicePDF data={data} />);

  // Convert stream to buffer for Next.js Response
  const chunks: Buffer[] = [];
  for await (const chunk of stream as any) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${order.orderNumber}.pdf"`,
    },
  });
}
