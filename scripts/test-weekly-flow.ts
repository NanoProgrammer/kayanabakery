/**
 * Walks the whole weekly box flow for one member, against the live site.
 *
 *   npx tsx scripts/test-weekly-flow.ts you@example.com
 *
 * Step 1 sends a real email — to that one address only, never the whole list.
 * Steps 2 and 3 only read. The send/skip links are printed here so the decision
 * can be exercised without digging through the inbox; clicking "send" charges
 * the card on file for real, so use an account you don't mind charging.
 *
 * Re-run it after clicking to see how the week was recorded.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";
import { weekStartOf, signWeeklyAction } from "../lib/membership/weekly";

const prisma = new PrismaClient();
const SITE = process.env.WEEKLY_TEST_SITE ?? "https://www.karyanabakery.ca";

const email = process.argv[2];
if (!email || !email.includes("@")) {
  console.error("Usage: npx tsx scripts/test-weekly-flow.ts you@example.com");
  process.exit(1);
}

function line() {
  console.log("-".repeat(70));
}

async function main() {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not in .env.local — needed to call the cron and sign links.");
    process.exit(1);
  }

  console.log(`\nWeekly box flow — ${email}`);
  console.log(`Site: ${SITE}`);
  console.log("=".repeat(70));

  // ---- 1. Is this member even eligible ----
  console.log("\n1. Setup\n");
  const m = await prisma.membership.findFirst({
    where: { user: { email } },
    include: { user: { select: { name: true, email: true, preferredLang: true } } },
  });

  if (!m) {
    console.error(`   No membership for ${email}.`);
    process.exit(1);
  }

  const eligible =
    m.status === "ACTIVE" && (m.tier === "SELECTO" || m.tier === "LEGENDARIO") && m.weeklyMode;

  console.log(`   ${m.tier} · ${m.status} · mode ${m.weeklyMode ?? "NOT SET"}`);
  console.log(`   frequency ${m.weeklyFrequency} · auto-delivery ${m.autoDeliveryEnabled ? "ON" : "OFF"}`);
  console.log(`   card on file: ${m.squareCardId ? "yes" : "no"}`);
  console.log(`   language: ${m.user?.preferredLang ?? "?"}`);

  if (!eligible) {
    console.error("\n   Not eligible — the cron would skip this member, so nothing below applies.");
    console.error("   Needs: ACTIVE, Selecto or Legendario, and a weekly mode chosen.");
    process.exit(1);
  }
  console.log("   ✓ eligible");

  const weekStart = weekStartOf(new Date());
  const before = await prisma.weeklyOrderLog.findUnique({
    where: { membershipId_weekStart: { membershipId: m.id, weekStart } },
  });

  // ---- 2. Send this week's email ----
  line();
  console.log("\n2. Sending this week's email\n");

  if (before) {
    console.log(`   A log for this week already exists (${before.status}).`);
    console.log("   The cron won't send a second email — that's the duplicate guard working.");
  } else {
    const url = `${SITE}/api/cron/weekly-box-notify?onlyEmail=${encodeURIComponent(email)}`;
    const res = await fetch(url, { headers: { authorization: `Bearer ${secret}` } });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error(`   ✗ HTTP ${res.status}:`, JSON.stringify(body));
      console.error("   401 means the CRON_SECRET here doesn't match the one on Vercel.");
      process.exit(1);
    }
    console.log(`   ✓ ${JSON.stringify(body)}`);
    if (body.notified === 1) console.log("   The email is on its way. Check the inbox.");
  }

  // ---- 3. What was recorded, and the decision links ----
  line();
  console.log("\n3. This week's record\n");

  const log = await prisma.weeklyOrderLog.findUnique({
    where: { membershipId_weekStart: { membershipId: m.id, weekStart } },
  });

  if (!log) {
    console.error("   ✗ No log row was written. The email cannot have gone out.");
    process.exit(1);
  }

  console.log(`   week ${log.weekStart.toISOString().slice(0, 10)} · status ${log.status}` +
              `${log.decidedBy ? ` · decided by ${log.decidedBy}` : ""}`);
  if (log.failureNote) console.log(`   failure: ${log.failureNote}`);
  if (log.orderId) console.log(`   order created: ${log.orderId}`);

  if (log.status === "PENDING" || log.status === "FAILED") {
    const send = `${SITE}/api/membership/weekly/action?log=${log.id}&action=send&token=${signWeeklyAction(log.id, "send")}`;
    const skip = `${SITE}/api/membership/weekly/action?log=${log.id}&action=skip&token=${signWeeklyAction(log.id, "skip")}`;
    console.log("\n   The same links that are in the email:");
    console.log(`\n   SEND (charges the card for real):\n   ${send}`);
    console.log(`\n   SKIP (safe, changes nothing but the record):\n   ${skip}`);
    if (log.status === "FAILED") {
      console.log("\n   Status is FAILED and both links still work — a declined card");
      console.log("   no longer locks the week.");
    }
    console.log("\n   Click one, then run this again to see how it was recorded.");
  } else {
    console.log(`\n   The week is closed (${log.status}). Nothing left to click.`);
  }

  console.log("");
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
