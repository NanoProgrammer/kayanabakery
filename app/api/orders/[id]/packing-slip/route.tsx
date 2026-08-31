import { NextResponse } from "next/server";
import { writeClient as sanityClient } from "@/sanity/lib/client";
import { renderToStream } from "@react-pdf/renderer";
import { PackingSlipPDF, type PackingSlipData } from "@/lib/pdf/packing-slip-pdf";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://karyanabakery.ca";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // No separate site-account login required — this link is only ever
  // generated and shown from inside Sanity Studio (which has its own
  // login), and the order id is an unguessable string, not a login gate.
  const { id } = await params;
  const cleanId = id.replace(/^drafts\./, "");

  // Read straight from the Sanity order document — it already has
  // everything needed (customer info, address, items, notes) for both
  // orders synced from the online checkout AND orders created by hand in
  // Studio, which have no Prisma record to join against at all. Prefer the
  // draft over the published version, in case it hasn't been published yet.
  const order = await sanityClient.fetch(
    `*[_id == "drafts." + $id || _id == $id] | order(_updatedAt desc) [0] {
      orderNumber, customerName, customerPhone, fulfillmentType,
      deliveryAddress, pickupDate, notes, items, createdAt
    }`,
    { id: cleanId }
  );

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const items = (order.items || []).map((it: any) => ({
    name: it.name,
    quantity: it.quantity,
  }));

  const isPickup = order.fulfillmentType === "PICKUP";

  let shippingAddress: string | null = order.deliveryAddress ?? null;
  if (isPickup) {
    const settings = await sanityClient.fetch(
      `*[_type == "siteSettings"][0]{ pickupAddress }`
    );
    shippingAddress = settings?.pickupAddress ?? null;
  }

  const data: PackingSlipData = {
    orderNumber: order.orderNumber ?? "—",
    date: order.pickupDate || formatDate(order.createdAt),
    fulfillmentType: isPickup ? "PICKUP" : "DELIVERY",
    customerName: order.customerName ?? "Customer",
    customerPhone: order.customerPhone ?? null,
    shippingAddress,
    items,
    note: order.notes ?? null,
    logoUrl: `${APP_URL}/logo-print.jpg`,
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
