/**
 * Whether the weekly box is actually working, member by member.
 *
 *   npm run weekly:status      who is in this week, who is out and why
 *   npm run weekly:run         run this week's reminder and processing now
 *
 * The Tuesday reminder decides everything — it writes the WeeklyOrderLog that
 * Thursday finalizes — so a member it leaves out gets no log, no email and no
 * order, with nothing anywhere saying so. This prints that decision instead of
 * leaving it to be inferred from an empty Orders list.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import { weekStartOf } from "../lib/membership/weekly";
import { weeklyBoxPlan, WEEKLY_TIERS } from "../lib/membership/weekly-eligibility";
import { weeklyDecision } from "../lib/membership/weekly-decision";

/**
 * What Thursday will actually do if the member says nothing — the same
 * function the cron uses, not a description of it. The mode alone is not the
 * answer: a member on REPEAT_LAST with auto-delivery off is skipped, and
 * reporting that as "charged automatically" is how a tool meant to prove the
 * system works ends up lying about it.
 */
const OUTCOME: Record<string, string> = {
  send: "an order is created and their card is charged",
  "queue-for-staff": "THE BAKERY FILLS AND CHARGES THIS ONE BY HAND",
  skip: "nothing goes out",
  fail: "it cannot go out",
};

async function status() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const weekStart = weekStartOf(new Date());

  const memberships = await prisma.membership.findMany({
    where: { tier: { in: WEEKLY_TIERS as any } },
    include: { user: { select: { email: true, name: true } } },
  });

  console.log(`\nWeek starting ${weekStart.toISOString().slice(0, 10)}`);
  console.log(`${memberships.length} Selecto/Legendario membership(s)\n`);

  if (!memberships.length) {
    console.log("  Nobody is on a weekly tier.\n");
    await prisma.$disconnect();
    return;
  }

  const inThisWeek: string[] = [];
  const out: string[] = [];

  for (const m of memberships) {
    const plan = weeklyBoxPlan(
      {
        tier: m.tier,
        status: m.status,
        endsAt: m.endsAt,
        benefitMode: m.benefitMode,
        weeklyMode: m.weeklyMode as never,
        weeklyFrequency: m.weeklyFrequency,
        weeklyAnchorAt: m.weeklyAnchorAt,
        hasPreviousOrder:
          (await prisma.order.count({
            where: { userId: m.userId, status: { not: "CANCELLED" } },
          })) > 0,
      },
      weekStart
    );

    const who = `${m.user?.name ?? "(no name)"} <${m.user?.email ?? m.userId}>`;

    if (!plan.include) {
      out.push(`  ${who}\n      ${plan.reason}`);
      continue;
    }

    const log = await prisma.weeklyOrderLog.findUnique({
      where: { membershipId_weekStart: { membershipId: m.id, weekStart } },
      select: { status: true, failureNote: true, orderId: true },
    });

    const where = log
      ? `${log.status}${log.orderId ? ` — order created` : ""}${
          log.failureNote ? ` (${log.failureNote})` : ""
        }`
      : "NO LOG YET — the Tuesday reminder has not run for this week";

    const decision = weeklyDecision({
      modeSnapshot: plan.mode,
      autoDeliveryEnabled: m.autoDeliveryEnabled,
      hasCardOnFile: Boolean(m.squareCustomerId && m.squareCardId),
    });

    inThisWeek.push(
      `  ${who}\n      ${m.tier} · ${plan.mode}${plan.defaulted ? " (default — they never picked one)" : ""}` +
        `\n      if they don't reply: ${OUTCOME[decision.action]}` +
        ("reason" in decision ? ` (${decision.reason})` : "") +
        `\n      this week: ${where}`
    );
  }

  if (inThisWeek.length) {
    console.log(`${inThisWeek.length} getting a box this week:\n`);
    console.log(inThisWeek.join("\n\n"));
    console.log("");
  }
  if (out.length) {
    console.log(`${out.length} not this week:\n`);
    console.log(out.join("\n"));
    console.log("");
  }

  await prisma.$disconnect();
}

/**
 * Runs the two crons now, in order, against the live site. Used when a week
 * was missed and the bakery needs this week's boxes before next Tuesday.
 */
async function run() {
  const secret = process.env.CRON_SECRET;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.karyanabakery.ca").replace(/\/$/, "");

  if (!secret) {
    console.error("\nCRON_SECRET is not set in .env.local — cannot run the crons.\n");
    process.exit(1);
  }

  const headers = { authorization: `Bearer ${secret}` };
  console.log(`\nRunning against ${base}\n`);

  for (const path of ["/api/cron/weekly-box-notify", "/api/cron/weekly-box-process"]) {
    process.stdout.write(`  ${path} ... `);
    // redirect: "error" because a cross-origin redirect silently drops the
    // Authorization header, and the sub-task then answers 401 inside a 200.
    const res = await fetch(`${base}${path}`, { headers, redirect: "error" }).catch(
      (err) => ({ ok: false, status: 0, text: async () => String(err?.message ?? err) }) as any
    );
    const body = await res.text();
    console.log(res.ok ? "ok" : `FAILED (${res.status})`);
    console.log(`      ${body.slice(0, 400)}`);
  }

  console.log("\nRun  npm run weekly:status  to see where each member landed.\n");
}

const wants = process.argv.slice(2).filter((a) => !a.startsWith("--"));
(wants.includes("run") ? run() : status()).catch((err) => {
  console.error(`\nFailed: ${err?.message ?? err}\n`);
  process.exit(1);
});
