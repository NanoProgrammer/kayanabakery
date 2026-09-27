/**
 * Creates a TEST ORDER by copying a real one, to exercise automatic printing.
 *
 * Inserted straight into the database: nothing is charged, no email goes out,
 * Square is never touched.
 *
 *   npx tsx scripts/test-print-order.ts              copy the default order
 *   npx tsx scripts/test-print-order.ts <ID>         copy that order instead
 *   npx tsx scripts/test-print-order.ts --delete <ID>  remove a test order
 *
 * It also creates the order's Sanity document, which is not optional: the
 * packing slip is built from Sanity, not Prisma, so an order that exists only
 * in the database answers 404 at /api/print/<id>/pdf — the test would fail at
 * exactly the step it is meant to prove.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

const DEFAULT_SOURCE = "cmu6ev3fv0002w3bdo5vwgmj5"; // KAR-202609-84RVQ (Marcos Mendoza)
const TEST_NAME = "PRUEBA IMPRESORA";

/** Fields that must not be copied: identity, timestamps, or another order's payment. */
const DO_NOT_COPY = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "orderNumber",
  "squarePaymentId",
  "squareOrderId",
  "gcalEventId",
  "googleCalendarEventId",
  "readyMsgSid",
  "completedMsgSid",
  "printedAt",
  "reorderedFromId",
]);

async function main() {
  const { PrismaClient, Prisma } = await import("@prisma/client");
  const prisma = new PrismaClient();

  const [flag, arg] = process.argv.slice(2);

  try {
    if (flag === "--delete") {
      await remove(prisma, arg);
    } else {
      await create(prisma, Prisma, flag ?? DEFAULT_SOURCE);
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function create(prisma: any, Prisma: any, sourceId: string) {
  const src = await prisma.order.findUnique({ where: { id: sourceId } });
  if (!src) throw new Error(`No order with id ${sourceId}`);

  const scalars = Prisma.dmmf.datamodel.models
    .find((m: any) => m.name === "Order")!
    .fields.filter((f: any) => f.kind !== "object");

  const data: Record<string, any> = {};
  for (const f of scalars) {
    if (DO_NOT_COPY.has(f.name)) continue;
    const v = src[f.name];
    // Prisma rejects a bare null for a Json column.
    if (v === null && f.type === "Json") continue;
    data[f.name] = v;
  }

  const stamp = Date.now();
  data.orderNumber = `KAR-TEST-${stamp}`;

  // The bakery has to be able to tell this apart on the printed sheet. Prisma
  // has no customerName — the slip's name comes from the linked user, so the
  // order is detached from that user and given a guest name instead.
  data.userId = null;
  data.guestName = TEST_NAME;
  data.guestEmail = null;
  data.guestPhone = src.guestPhone ?? null;

  // Has to qualify for the print queue, whatever state the source was in.
  data.status = "CONFIRMED";
  data.paymentStatus = "PAID";

  const created = await prisma.order.create({ data });

  // Child rows (points ledger, ambassador deliveries) are deliberately not
  // copied: a test print has no business writing entries into a customer's
  // points history.

  const { createSanityOrder } = await import("../lib/orders/sanity-sync");
  const items = Array.isArray(created.items) ? (created.items as any[]) : [];

  const synced = await createSanityOrder({
    orderNumber: created.orderNumber,
    prismaId: created.id,
    customerName: TEST_NAME,
    customerEmail: "",
    customerPhone: created.guestPhone ?? "",
    fulfillmentType: created.fulfillmentType,
    totalCents: created.total,
    items: items.map((it) => ({
      productId: it.productId,
      name: it.name,
      quantity: it.quantity,
      price: it.price,
    })),
    deliveryAddress: null,
    pickupDate: "TEST — printer check",
    status: "IN_PROGRESS",
    source: "checkout",
  });

  console.log("\nTest order created");
  console.log(`  id:     ${created.id}`);
  console.log(`  number: ${created.orderNumber}`);
  console.log(`  items:  ${items.length}`);
  console.log(`  Studio: ${synced ? "document created" : "FAILED — the slip will 404, see the error above"}`);
  console.log("\nThe printer should pick it up on its next poll.");
  console.log(`Remove it with: npx tsx scripts/test-print-order.ts --delete ${created.id}\n`);
}

async function remove(prisma: any, id: string) {
  if (!id) throw new Error("Pass the id to delete");

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new Error(`No order with id ${id}`);

  // Two independent marks, both of which this script sets. A real order that
  // happened to match one of them still can't match both.
  const isTest =
    String(order.orderNumber ?? "").startsWith("KAR-TEST-") &&
    order.guestName === TEST_NAME;

  if (!isTest) {
    throw new Error(
      `${order.orderNumber} is not a test order — refusing to delete it`
    );
  }

  await prisma.pointsTransaction.deleteMany({ where: { orderId: id } });
  await prisma.ambassadorDelivery.deleteMany({ where: { orderId: id } });
  await prisma.order.delete({ where: { id } });

  // Otherwise the order vanishes from the site but stays in the Orders list.
  try {
    const { writeClient } = await import("../sanity/lib/client");
    const doc = await writeClient.fetch<{ _id: string } | null>(
      `*[_type == "order" && prismaId == $id][0]{ _id }`,
      { id }
    );
    if (doc?._id) {
      await writeClient.delete(doc._id);
      console.log("Studio document deleted too");
    }
  } catch (err: any) {
    console.warn(`Could not delete the Studio document: ${err?.message ?? err}`);
    console.warn("Delete it by hand in Studio.");
  }

  console.log(`Test order ${order.orderNumber} deleted`);
}

main().catch((err) => {
  console.error("ERROR:", err?.message ?? err);
  process.exitCode = 1;
});
