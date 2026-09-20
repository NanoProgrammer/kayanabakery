/**
 * Why the weekly emails aren't going out.
 *
 * Read-only: it sends nothing and writes nothing. It checks the three things
 * that silently stop the weekly box, in the order they break.
 *
 *   npm run diagnose:crons
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";
import { weekStartOf } from "../lib/membership/weekly";

const prisma = new PrismaClient();
const CANONICAL = "https://www.karyanabakery.ca";

async function checkRedirect() {
  console.log("1. The URL the daily cron calls its sub-tasks through\n");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.log("   NEXT_PUBLIC_APP_URL is not set locally — checking the canonical domain instead.");
  }
  const target = appUrl ?? CANONICAL;
  console.log(`   NEXT_PUBLIC_APP_URL = ${appUrl ?? "(unset)"}`);

  let res;
  try {
    res = await fetch(`${target}/api/cron/weekly-box-notify`, { redirect: "manual" });
  } catch (err: any) {
    console.log(`   ✗ Could not reach ${target}: ${err.message}\n`);
    return;
  }

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location") ?? "";
    const from = new URL(target).origin;
    const to = location.startsWith("http") ? new URL(location).origin : from;

    if (from !== to) {
      console.log(`   ✗ ${from} redirects to ${to}`);
      console.log("     A redirect to a different origin DROPS the Authorization header,");
      console.log("     so the sub-task answers 401 and quietly does nothing.");
      console.log("     Fixed in code (the cron now uses its own origin), but set");
      console.log(`     NEXT_PUBLIC_APP_URL to ${CANONICAL} on Vercel as well.\n`);
      return;
    }
    console.log(`   ~ Redirects, but to the same origin (${to}) — the header survives.\n`);
    return;
  }

  console.log(`   ✓ No redirect (HTTP ${res.status}) — the header would survive.\n`);
}

async function checkMembers() {
  console.log("2. Who should be getting an email\n");

  const members = await prisma.membership.findMany({
    where: { status: "ACTIVE", tier: { in: ["SELECTO", "LEGENDARIO"] } },
    include: { user: { select: { email: true, name: true } } },
  });

  if (members.length === 0) {
    console.log("   No active Selecto/Legendario memberships at all.\n");
    return;
  }

  for (const m of members) {
    const ready = m.weeklyMode && m.user?.email;
    console.log(
      `   ${ready ? "✓" : "✗"} ${m.user?.name ?? "(no name)"} <${m.user?.email ?? "no email"}>` +
        ` — mode ${m.weeklyMode ?? "NOT SET"}`
    );
    if (!m.weeklyMode) {
      console.log("       never picked a weekly mode, so the cron skips them entirely");
    }
  }
  console.log("");
}

async function checkLogs() {
  console.log("3. Whether the cron has ever actually run\n");

  const total = await prisma.weeklyOrderLog.count();
  if (total === 0) {
    console.log("   ✗ Not a single WeeklyOrderLog row exists.");
    console.log("     The cron writes this row BEFORE sending the email, so zero rows");
    console.log("     means no email was ever attempted — the failure is upstream of");
    console.log("     Resend, and the Resend dashboard will show nothing either.\n");
    return;
  }

  const recent = await prisma.weeklyOrderLog.findMany({
    orderBy: { weekStart: "desc" },
    take: 10,
    // WeeklyOrderLog keeps userId as a plain column, so the email comes
    // through the membership relation.
    include: { membership: { include: { user: { select: { email: true } } } } },
  });

  console.log(`   ${total} row(s) total. Most recent:`);
  for (const l of recent) {
    console.log(
      `     ${l.weekStart.toISOString().slice(0, 10)}  ${l.status.padEnd(9)}` +
        ` ${l.membership?.user?.email ?? l.userId}${l.failureNote ? ` — ${l.failureNote}` : ""}`
    );
  }

  const thisWeek = await prisma.weeklyOrderLog.count({
    where: { weekStart: weekStartOf(new Date()) },
  });
  console.log(`\n   This week (${weekStartOf(new Date()).toISOString().slice(0, 10)}): ${thisWeek} row(s)\n`);
}

async function main() {
  console.log("\nKaryana — weekly email diagnosis");
  console.log("=".repeat(70) + "\n");
  await checkRedirect();
  await checkMembers();
  await checkLogs();
  console.log("=".repeat(70));
  console.log("Sent emails are listed at https://resend.com/emails");
  console.log("Server logs are at Vercel -> your project -> Logs\n");
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
