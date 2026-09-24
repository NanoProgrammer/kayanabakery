/**
 * Loads every customer into Sanity Studio.
 *
 * Run once after deploying, to fill Studio with the people who already exist —
 * the automatic sync only fires when something changes, so without this the
 * Customers list starts empty and only fills as people happen to act.
 *
 *   npm run sync:customers
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

async function main() {
  const { syncAllCustomersToSanity } = await import("../lib/sanity/sync-customers");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  const total = await prisma.user.count();
  console.log(`\nSyncing ${total} customer(s) to Sanity Studio...\n`);

  const { synced, failed } = await syncAllCustomersToSanity();

  console.log(`  ✓ ${synced} synced`);
  if (failed > 0) {
    console.log(`  ✗ ${failed} failed — see the errors above`);
  }
  console.log("\nOpen Studio → Memberships. You'll find:");
  console.log("  Members            — everyone on a paid plan");
  console.log("  Weekly bread box   — everyone set up for weekly delivery");
  console.log("  No membership      — accounts with no plan, biggest spender first");
  console.log("  Everyone           — all of them\n");

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
