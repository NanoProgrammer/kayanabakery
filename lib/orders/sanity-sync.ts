import { writeClient as sanityClient } from "@/sanity/lib/client";
import { resend, FROM_EMAIL, ORDERS_EMAIL } from "@/lib/email/resend";

/**
 * Mirrors a paid order into Sanity Studio, which is the only place the bakery
 * actually looks at orders.
 *
 * This lives here because it used to be inline in the checkout route, so the
 * weekly auto-orders — created by the cron, never touching checkout — were
 * charged, saved to Prisma and emailed, but never appeared in the Studio
 * Orders list. To the bakery that is indistinguishable from the automatic
 * orders not running at all.
 */
export type SanityOrderInput = {
  orderNumber: string;
  prismaId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  fulfillmentType: string;
  /** Total in cents — converted to dollars for Studio. */
  totalCents: number;
  items: { productId?: string; name: string; quantity: number; price: number }[];
  deliveryAddress?: string | null;
  /** Human-readable pickup/delivery label shown in Studio. */
  pickupDate?: string | null;
  status?: string;
  /** Shown in Studio so staff can tell an automatic order from a normal one. */
  source?: "checkout" | "weekly-auto";
};

export async function createSanityOrder(input: SanityOrderInput): Promise<boolean> {
  try {
    await sanityClient.create({
      _type: "order",
      orderNumber: input.orderNumber,
      prismaId: input.prismaId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      fulfillmentType: input.fulfillmentType,
      total: input.totalCents / 100,
      items: input.items.map((it, i) => ({
        // Sanity array items need a stable _key. productId is normally unique
        // within an order, but the index keeps it valid if one ever repeats.
        _key: it.productId ? `${it.productId}-${i}` : `item-${i}`,
        name: it.name,
        quantity: it.quantity,
        price: it.price / 100,
      })),
      deliveryAddress: input.deliveryAddress ?? null,
      pickupDate: input.pickupDate ?? null,
      status: input.status ?? "IN_PROGRESS",
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (err: any) {
    console.error(
      `[sanity-sync] order ${input.orderNumber} failed to reach Studio:`,
      err?.message,
      err?.statusCode
    );
    await alertSyncFailure(input, err);
    return false;
  }
}

/**
 * The order is paid and safe in Prisma either way, but a silent failure here
 * means nobody finds out until a customer asks where their bread is.
 */
async function alertSyncFailure(input: SanityOrderInput, err: any): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const origin =
    input.source === "weekly-auto"
      ? "an automatic weekly-box order"
      : "an online checkout order";

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ORDERS_EMAIL,
      subject: `[ALERT] Order ${input.orderNumber} did not sync to Sanity Studio`,
      text: [
        `Order ${input.orderNumber} (Prisma id ${input.prismaId}) is ${origin}.`,
        `It was paid successfully but failed to create its document in Sanity`,
        `Studio, so it will NOT appear in the Orders list.`,
        ``,
        `Error: ${err?.statusCode ?? ""} ${err?.message ?? err}`,
        ``,
        `This usually means SANITY_API_READ_TOKEN is expired or only has`,
        `Viewer permission — it needs Editor permission to write orders.`,
      ].join("\n"),
    });
  } catch (emailErr) {
    console.error("[sanity-sync] failure alert email also failed:", emailErr);
  }
}
