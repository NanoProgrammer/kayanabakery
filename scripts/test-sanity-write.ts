// scripts/test-sanity-write.ts
//
// Directly tests whether SANITY_API_READ_TOKEN can actually create
// documents — the same check the checkout route needs to succeed for an
// order to show up in Studio. Doesn't touch Prisma, Square, or email —
// just the Sanity write itself.
//
// Run with:  npx tsx scripts/test-sanity-write.ts
//
// On success, it prints the test order's Studio URL so you can see it show
// up, then tells you how to delete it since it isn't a real order.

import { createClient } from "next-sanity";
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-10-01";
const token = process.env.SANITY_API_READ_TOKEN;

async function run() {
  if (!projectId) {
    console.error("❌ NEXT_PUBLIC_SANITY_PROJECT_ID is missing from your env.");
    process.exit(1);
  }
  if (!token) {
    console.error("❌ SANITY_API_READ_TOKEN is not set.");
    process.exit(1);
  }

  console.log(`Project:  ${projectId} (dataset: ${dataset})`);
  console.log("Attempting to create a test order document with SANITY_API_READ_TOKEN...\n");

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token,
  });

  const orderNumber = `KAR-TEST-${Date.now()}`;

  try {
    const doc = await client.create({
      _type: "order",
      orderNumber,
      customerName: "TEST — safe to delete",
      customerEmail: "test@example.com",
      customerPhone: "0000000000",
      fulfillmentType: "PICKUP",
      total: 0,
      items: [],
      status: "IN_PROGRESS",
      createdAt: new Date().toISOString(),
    });

    console.log("✅ SUCCESS — SANITY_API_READ_TOKEN can create orders.");
    console.log(`   Document _id: ${doc._id}`);
    console.log(`   Order #: ${orderNumber}`);
    console.log(`   It should now appear in Studio → Orders.`);
    console.log(`\nThis was a fake test order — delete it from Studio when you're done checking.`);
  } catch (err: any) {
    console.error("❌ FAILED — the token could not create a document.");
    console.error(`   ${err?.statusCode ?? ""} ${err?.message ?? err}`);
    if (err?.statusCode === 403) {
      console.error(
        "\n   This is a permissions error: SANITY_API_READ_TOKEN's permission is still\n" +
        "   Viewer in sanity.io/manage → API → Tokens. Change that token's permission\n" +
        "   to Editor (same token, same env var) and try again."
      );
    }
    process.exit(1);
  }
}

run();
