/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Seed initial coupons into the database.
 *
 * Usage:
 *   npx tsx scripts/seed-coupons.ts
 *
 * Idempotent — safe to re-run.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🎟  Seeding coupons...\n");

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    create: {
      code: "WELCOME10",
      description: "10% off your first order",
      discountType: "PERCENT",
      discountValue: 10,
      minOrderCents: 1500, // $15 min
      maxPerUser: 1,
      active: true,
    },
    update: { active: true },
  });
  console.log("✓ WELCOME10 — 10% off, $15 min, 1 per user");

  await prisma.coupon.upsert({
    where: { code: "MEMBERS5" },
    create: {
      code: "MEMBERS5",
      description: "$5 off for members",
      discountType: "FIXED",
      discountValue: 500, // 500 cents
      minOrderCents: 2500,
      requiredTier: "ARTESANO",
      active: true,
    },
    update: { active: true },
  });
  console.log("✓ MEMBERS5 — $5 off for ARTESANO+ members");

  await prisma.coupon.upsert({
    where: { code: "BIRTHDAY15" },
    create: {
      code: "BIRTHDAY15",
      description: "15% off birthday treat",
      discountType: "PERCENT",
      discountValue: 15,
      minOrderCents: 2000,
      maxPerUser: 1,
      active: true,
    },
    update: { active: true },
  });
  console.log("✓ BIRTHDAY15 — 15% off, $20 min");

  console.log("\n✅ Coupons seeded!");
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
