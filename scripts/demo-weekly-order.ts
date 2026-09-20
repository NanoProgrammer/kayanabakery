/**
 * Creates one example weekly auto-order in Sanity Studio and leaves it there
 * so you can see it in the Orders list.
 *
 * It goes through createSanityOrder — the exact function the weekly cron now
 * calls — rather than writing the document directly. That is the point: if the
 * fix were wrong, this script would fail the same way the real automation did.
 *
 *   npm run demo:order            create it
 *   npm run demo:order -- --delete   remove it when you're done looking
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import { createClient } from "next-sanity";

const ORDER_NUMBER = "DEMO-WEEKLY-BOX";

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const token = process.env.SANITY_API_READ_TOKEN;

  if (!projectId || !token) {
    console.error("Missing Sanity credentials in .env.local");
    process.exit(1);
  }

  const sanity = createClient({
    projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2025-02-19",
    token,
    useCdn: false,
  });

  const existing = await sanity.fetch<{ _id: string } | null>(
    `*[_type == "order" && orderNumber == $n][0]{ _id }`,
    { n: ORDER_NUMBER }
  );

  if (process.argv.includes("--delete")) {
    if (!existing?._id) {
      console.log("Nothing to delete — no demo order in Studio.");
      return;
    }
    await sanity.delete(existing._id);
    console.log(`Deleted the demo order (${ORDER_NUMBER}).`);
    return;
  }

  if (existing?._id) {
    console.log(`The demo order already exists (${ORDER_NUMBER}).`);
    console.log("Run with --delete first if you want a fresh one.");
    return;
  }

  // The same call the weekly cron makes, with the same shape of data a real
  // "Repeat Last Order" box would produce.
  const { createSanityOrder } = await import("../lib/orders/sanity-sync");

  const ok = await createSanityOrder({
    orderNumber: ORDER_NUMBER,
    prismaId: "demo-not-a-real-order",
    customerName: "EJEMPLO — orden automática (puedes borrarla)",
    customerEmail: "ejemplo@karyanabakery.ca",
    customerPhone: "",
    fulfillmentType: "PICKUP",
    totalCents: 3250,
    items: [
      { productId: "demo-concha", name: "Concha de vainilla", quantity: 4, price: 350 },
      { productId: "demo-oreja", name: "Oreja", quantity: 3, price: 400 },
      { productId: "demo-cafe", name: "Café de olla", quantity: 1, price: 650 },
    ],
    deliveryAddress: null,
    pickupDate: "Weekly auto-order — contact member to schedule",
    status: "IN_PROGRESS",
    source: "weekly-auto",
  });

  if (!ok) {
    console.error("\nThe order did NOT reach Studio. The error is above.");
    process.exit(1);
  }

  console.log(`\nCreated ${ORDER_NUMBER} in Sanity Studio.`);
  console.log("Open Studio -> Orders. It should be at the top of the list.");
  console.log("It looks exactly like a real weekly auto-order, because it was");
  console.log("made by the same code path.");
  console.log("\nWhen you're done:  npm run demo:order -- --delete");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
