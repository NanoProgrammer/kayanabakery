/**
 * Karyana — Sync existing Prisma data to Brevo (one-time migration)
 *
 * Syncs:
 *   - All registered users (with tier, order count, total spent)
 *   - All newsletter subscribers
 *
 * USAGE:
 *   npx tsx scripts/sync-to-brevo.ts
 *
 * Safe to run multiple times — Brevo upserts by email.
 */

import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";
import { upsertContact, addToList } from "../lib/brevo/client";

const prisma = new PrismaClient();

const BREVO_LIST_ID = parseInt(process.env.BREVO_LIST_ID || "0", 10);
const BREVO_MEMBERS_LIST_ID = process.env.BREVO_MEMBERS_LIST_ID
  ? parseInt(process.env.BREVO_MEMBERS_LIST_ID, 10)
  : null;

async function run() {
  if (!process.env.BREVO_API_KEY) {
    console.error("❌ Missing BREVO_API_KEY in .env.local");
    process.exit(1);
  }
  if (!BREVO_LIST_ID) {
    console.error("❌ Missing BREVO_LIST_ID in .env.local");
    process.exit(1);
  }

  // ══════════════════════════════════════════════
  // 1. Sync registered users
  // ══════════════════════════════════════════════
  console.log("👤 Syncing registered users...\n");

  const users = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      phone: true,
      preferredLang: true,
      pointsBalance: true,
      membership: { select: { tier: true, status: true } },
      _count: {
        select: {
          orders: { where: { paymentStatus: "PAID" } },
        },
      },
    },
  });

  // Get total spent per user in one query
  const spentByUser = await prisma.order.groupBy({
    by: ["userId"],
    where: { paymentStatus: "PAID", userId: { not: null } },
    _sum: { total: true },
  });

  const spentMap = new Map(
    spentByUser.map((s) => [s.userId!, s._sum.total ?? 0])
  );

  // Get last order date per user
  const lastOrders = await prisma.order.groupBy({
    by: ["userId"],
    where: { paymentStatus: "PAID", userId: { not: null } },
    _max: { createdAt: true },
  });

  const lastOrderMap = new Map(
    lastOrders.map((o) => [o.userId!, o._max.createdAt])
  );

  let usersSynced = 0;
  let usersFailed = 0;

  for (const u of users) {
    const [firstName, ...rest] = (u.name ?? "").split(" ");
    const lastName = rest.join(" ");
    const tier = u.membership?.tier ?? "BASICO";
    const status = u.membership?.status ?? "INACTIVE";

    // We need userId for spent/lastOrder maps — get it from a separate query
    const userRecord = await prisma.user.findUnique({
      where: { email: u.email },
      select: { id: true },
    });

    const totalSpent = userRecord ? spentMap.get(userRecord.id) ?? 0 : 0;
    const lastOrder = userRecord ? lastOrderMap.get(userRecord.id) : null;

    const listIds = [BREVO_LIST_ID];
    if (
      BREVO_MEMBERS_LIST_ID &&
      tier !== "BASICO" &&
      status === "ACTIVE"
    ) {
      listIds.push(BREVO_MEMBERS_LIST_ID);
    }

    const res = await upsertContact({
      email: u.email,
      attributes: {
        FIRSTNAME: firstName || "",
        LASTNAME: lastName || "",
        LANGUAGE: u.preferredLang || "en",
        SOURCE: "MIGRATION",
        REGISTERED: true,
        MEMBERSHIP_TIER: tier,
        MEMBERSHIP_STATUS: status,
        TOTAL_ORDERS: u._count.orders,
        TOTAL_SPENT: Math.round(totalSpent / 100),
        ...(lastOrder
          ? {
              LAST_ORDER_DATE: lastOrder.toISOString().split("T")[0],
            }
          : {}),
      },
      listIds,
      updateEnabled: true,
    });

    if (res.ok) {
      console.log(`  ✓ ${u.email} (${tier}, ${u._count.orders} orders)`);
      usersSynced++;
    } else {
      console.log(`  ✗ ${u.email}: ${res.error}`);
      usersFailed++;
    }

    // Brevo rate limit: 10 req/sec on free plan
    await sleep(120);
  }

  console.log(
    `\n✅ Users: ${usersSynced} synced, ${usersFailed} failed\n`
  );

  // ══════════════════════════════════════════════
  // 2. Sync newsletter subscribers (not yet registered)
  // ══════════════════════════════════════════════
  console.log("📧 Syncing newsletter subscribers...\n");

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { active: true },
  });

  // Filter out emails that are already registered users
  const userEmails = new Set(users.map((u) => u.email.toLowerCase()));
  const newSubscribers = subscribers.filter(
    (s) => !userEmails.has(s.email.toLowerCase())
  );

  let subsSynced = 0;
  let subsFailed = 0;

  for (const s of newSubscribers) {
    const res = await upsertContact({
      email: s.email,
      attributes: {
        LANGUAGE: s.language || "en",
        SOURCE: s.source || "NEWSLETTER",
        NEWSLETTER: true,
      },
      listIds: [BREVO_LIST_ID],
      updateEnabled: true,
    });

    if (res.ok) {
      console.log(`  ✓ ${s.email}`);
      subsSynced++;
    } else {
      console.log(`  ✗ ${s.email}: ${res.error}`);
      subsFailed++;
    }

    await sleep(120);
  }

  console.log(
    `\n✅ Newsletter: ${subsSynced} synced, ${subsFailed} failed`
  );

  // ══════════════════════════════════════════════
  // Summary
  // ══════════════════════════════════════════════
  console.log(`\n${"═".repeat(50)}`);
  console.log(`📊 Migration complete!`);
  console.log(`   Users:       ${usersSynced}/${users.length}`);
  console.log(`   Newsletter:  ${subsSynced}/${newSubscribers.length}`);
  console.log(`   Skipped:     ${subscribers.length - newSubscribers.length} (already registered)`);
  console.log(`${"═".repeat(50)}`);
  console.log(`\n👉 Check Brevo dashboard → Contacts to verify.`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

run()
  .catch((err) => {
    console.error("\n❌ Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());