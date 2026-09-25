import { renderToStream } from "@react-pdf/renderer";
import { writeClient as sanityClient } from "@/sanity/lib/client";
import { PackingSlipPDF, type PackingSlipData } from "@/lib/pdf/packing-slip-pdf";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.karyanabakery.ca";

/**
 * Builds the kitchen packing slip.
 *
 * Shared by the Studio "Print packing slip" button and the kitchen printer
 * agent, so both produce the same sheet. Two callers rendering their own
 * version of the same document is how the printed ticket and the one on screen
 * start disagreeing.
 *
 * Reads from the Sanity order rather than Prisma because orders typed into
 * Studio by hand — phone and walk-in orders — have no Prisma record at all,
 * and those need to print too.
 */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

const ORDER_FIELDS = `{
  orderNumber, customerName, customerPhone, fulfillmentType,
  deliveryAddress, pickupDate, notes, items, createdAt
}`;

export type PackingSlipLookup =
  /** The Sanity document id, as the Studio button has it. */
  | { sanityId: string }
  /** The Prisma order id, which is all the printer agent knows. */
  | { prismaId: string };

export async function buildPackingSlipPdf(
  lookup: PackingSlipLookup
): Promise<{ buffer: Buffer; orderNumber: string } | null> {
  const order =
    "sanityId" in lookup
      ? await sanityClient.fetch(
          // Prefer the draft: a slip may be printed before anyone publishes.
          `*[_id == "drafts." + $id || _id == $id] | order(_updatedAt desc) [0] ${ORDER_FIELDS}`,
          { id: lookup.sanityId.replace(/^drafts\./, "") }
        )
      : await sanityClient.fetch(
          `*[_type == "order" && prismaId == $prismaId] | order(_updatedAt desc) [0] ${ORDER_FIELDS}`,
          { prismaId: lookup.prismaId }
        );

  if (!order) return null;

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
    items: (order.items || []).map((it: any) => ({
      name: it.name,
      quantity: it.quantity,
    })),
    note: order.notes ?? null,
    logoUrl: `${APP_URL}/logo-print.jpg`,
  };

  const stream = await renderToStream(<PackingSlipPDF data={data} />);
  const chunks: Buffer[] = [];
  for await (const chunk of stream as any) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return { buffer: Buffer.concat(chunks), orderNumber: data.orderNumber };
}
