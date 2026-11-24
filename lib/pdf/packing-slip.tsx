import { renderToStream } from "@react-pdf/renderer";
import { writeClient as sanityClient } from "@/sanity/lib/client";
import { PackingSlipPDF, type PackingSlipData } from "@/lib/pdf/packing-slip-pdf";
import { karyanaMakesThisCake, slipNote } from "@/lib/membership/legendario-cake";
import {
  earnsCoupon,
  isDiscoverBreadCode,
  slipNoteForEarned,
  slipNoteForRedeemed,
} from "@/lib/coupons/discover-bread";

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
  orderNumber, customerName, customerPhone, customerEmail, customerTier,
  fulfillmentType, deliveryAddress, pickupDate, notes, items, createdAt,
  couponCode
}`;

/**
 * The customer's birthday, for the Legendario cake promise.
 *
 * Not on the Sanity order — looked up by email, the same way the tier is.
 * No account, or no birthday on file, simply means the quieter note.
 */
async function resolveBirthday(order: {
  customerEmail?: string | null;
}): Promise<Date | null> {
  if (!order.customerEmail) return null;
  try {
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { email: order.customerEmail.toLowerCase() },
      select: { birthday: true },
    });
    return user?.birthday ?? null;
  } catch {
    // A slip that prints without the birthday beats one that does not print.
    return null;
  }
}

/**
 * The handover date as a real Date.
 *
 * `pickupDate` on the Sanity order is a human label — "Friday, Nov 13 ·
 * 4:00 PM" — which Date() cannot read. Falling back to when the order was
 * placed keeps the birthday check working instead of silently never firing.
 */
function handoverDate(order: { pickupDate?: string | null; createdAt?: string | null }): Date | null {
  for (const candidate of [order.pickupDate, order.createdAt]) {
    if (!candidate) continue;
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

/**
 * The customer's plan, for the badge the kitchen reads priority off.
 *
 * Orders placed since the field existed carry it. Anything older, and every
 * order typed into Studio by hand, does not — so for those the account is
 * looked up by email. A walk-in with no account is simply Básico, which is
 * true and is also what the kitchen needs to know.
 */
async function resolveTier(order: {
  customerTier?: string | null;
  customerEmail?: string | null;
}): Promise<string> {
  if (order.customerTier) return order.customerTier;
  if (!order.customerEmail) return "BASICO";

  try {
    const { prisma } = await import("@/lib/prisma");
    const { effectiveTier } = await import("@/lib/membership/access");
    const user = await prisma.user.findUnique({
      where: { email: order.customerEmail.toLowerCase() },
      select: { membership: { select: { tier: true, status: true, endsAt: true } } },
    });
    return effectiveTier(user?.membership);
  } catch (err) {
    // A slip that prints without the badge beats a slip that does not print.
    console.error("[packing-slip] could not resolve the tier:", err);
    return "BASICO";
  }
}

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
    customerTier: await resolveTier(order),
    orderNumber: order.orderNumber ?? "—",
    date: order.pickupDate || formatDate(order.createdAt),
    fulfillmentType: isPickup ? "PICKUP" : "DELIVERY",
    customerName: order.customerName ?? "Customer",
    customerPhone: order.customerPhone ?? null,
    shippingAddress,
    items: (order.items || []).map((it: any) => ({
      name: it.name,
      quantity: it.quantity,
      options: it.options ?? null,
    })),
    note: order.notes ?? null,
    // Worked out here, where the tier and the items are both already in
    // hand, so the printer agent needs to know nothing about memberships.
    // Buy a cake, earn two breads: the code goes on the cake's own slip so
    // whoever packs the box can hand it over. Using one is an instruction to
    // add bread, not a discount to work out.
    discoverBreadNote: (() => {
      const lines = (order.items || []).map((it: any) => ({
        name: it.name,
        slug: it.slug ?? null,
        categorySlugs: it.categorySlugs ?? null,
      }));
      if (isDiscoverBreadCode(order.couponCode)) return slipNoteForRedeemed("en");
      if (earnsCoupon(lines)) return slipNoteForEarned(order.orderNumber ?? "", "en");
      return null;
    })(),
    karyanaCakeNote: slipNote(
      karyanaMakesThisCake({
        tier: await resolveTier(order),
        items: (order.items || []).map((it: any) => ({ name: it.name, slug: it.slug ?? null })),
        birthday: await resolveBirthday(order),
        handover: handoverDate(order),
      })
    ),
    logoUrl: `${APP_URL}/logo-print.jpg`,
  };

  const stream = await renderToStream(<PackingSlipPDF data={data} />);
  const chunks: Buffer[] = [];
  for await (const chunk of stream as any) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return { buffer: Buffer.concat(chunks), orderNumber: data.orderNumber };
}
