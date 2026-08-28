import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { renderToStream } from "@react-pdf/renderer";
import { PackingSlipPDF, type PackingSlipData } from "@/lib/pdf/packing-slip-pdf";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://karyanabakery.ca";

function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  // Packing slips are a kitchen/staff document — no customer-facing use case,
  // unlike the invoice which a customer can pull for their own order.
  if (role !== "ADMIN" && role !== "STAFF") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
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
  }));

  const deliveryDate =
    order.fulfillmentType === "PICKUP"
      ? order.pickupDate
      : order.deliverySlot?.startTime ?? null;

  const note = [order.notes, order.address?.notes].filter(Boolean).join(" — ") || null;

  const data: PackingSlipData = {
    orderNumber: order.orderNumber,
    date: deliveryDate ? formatDate(deliveryDate) : formatDate(order.createdAt),
    customerName: order.user?.name ?? order.guestName ?? "Customer",
    customerEmail: order.user?.email ?? order.guestEmail ?? null,
    customerPhone: order.user?.phone ?? order.guestPhone ?? null,
    address: order.address
      ? {
          street: order.address.street,
          city: order.address.city,
          province: order.address.province,
          postalCode: order.address.postalCode,
          buzzer: order.address.buzzer,
        }
      : null,
    items,
    note,
    logoUrl: `${APP_URL}/logo-email.png`,
  };

  const stream = await renderToStream(<PackingSlipPDF data={data} />);

  const chunks: Buffer[] = [];
  for await (const chunk of stream as any) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="packing-slip-${order.orderNumber}.pdf"`,
    },
  });
}
