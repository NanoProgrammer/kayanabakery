/**
 * Shows every membership in the database and the state of their weekly box.
 *
 * Built to answer the questions that actually come up: who is paying, who is
 * set up to get bread automatically, and — when someone says their bread never
 * arrived — which piece of their setup is missing.
 *
 * Usage:
 *   npm run members             every membership
 *   npm run members:problems    only the ones with something wrong
 *   npm run members:weekly      only those on the weekly box
 *
 * Those have their own npm scripts because `npm run members -- --problems`
 * silently loses the flag on Windows — npm and npx each re-parse the argument
 * list on the way through, and the filter just never arrives.
 *
 * For one person, call it directly (npm is not in the way, so this is fine):
 *   npx tsx scripts/list-members.ts --email someone@example.com
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";
import { weekStartOf, isDueThisWeek } from "../lib/membership/weekly";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const onlyWeekly = args.includes("--weekly");
const onlyProblems = args.includes("--problems");
const emailArg = args[args.indexOf("--email") + 1];
const emailFilter = args.includes("--email") ? emailArg : null;

const WEEKLY_TIERS = ["SELECTO", "LEGENDARIO"];

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function date(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 10) : "—";
}

async function main() {
  const memberships = await prisma.membership.findMany({
    where: emailFilter ? { user: { email: emailFilter } } : undefined,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          preferredLang: true,
          pointsBalance: true,
        },
      },
      weeklyLogs: { orderBy: { weekStart: "desc" }, take: 3 },
    },
    orderBy: [{ tier: "asc" }, { startedAt: "asc" }],
  });

  const weekStart = weekStartOf(new Date());
  let shown = 0;

  console.log("\nKaryana — memberships");
  console.log("=".repeat(78));

  for (const m of memberships) {
    const onWeeklyBox = WEEKLY_TIERS.includes(m.tier) && m.status === "ACTIVE";

    // Everything that would silently stop bread from going out.
    const problems: string[] = [];
    if (onWeeklyBox) {
      if (!m.weeklyMode) problems.push("never chose a weekly mode — nothing will ever send");
      if (m.weeklyMode && m.weeklyMode !== "MANUAL" && !m.autoDeliveryEnabled)
        problems.push("auto-delivery OFF — skipped unless they reply each week");
      if (m.weeklyMode === "REPEAT_LAST" && (!m.squareCustomerId || !m.squareCardId))
        problems.push("no card on file — auto-orders will FAIL");
      if (!m.user?.email) problems.push("no email — cannot be notified");
    }
    if (m.status === "PAST_DUE") problems.push("payment past due");

    if (onlyWeekly && !onWeeklyBox) continue;
    if (onlyProblems && problems.length === 0) continue;
    shown++;

    const label = m.user?.name ?? "(no name)";
    console.log(`\n${label}  <${m.user?.email ?? "no email"}>`);
    console.log(
      `  ${m.tier} · ${m.status}` +
        `${m.isTrial ? " · TRIAL" : ""}` +
        ` · since ${date(m.startedAt)}` +
        `${m.renewsAt ? ` · renews ${date(m.renewsAt)}` : ""}`
    );
    console.log(
      `  lang ${m.user?.preferredLang ?? "—"} · phone ${m.user?.phone ?? "—"}` +
        ` · ${m.user?.pointsBalance ?? 0} pts`
    );

    if (onWeeklyBox) {
      const due = isDueThisWeek({
        frequency: m.weeklyFrequency,
        anchorAt: m.weeklyAnchorAt,
        weekStart,
      });
      const cadence =
        m.weeklyFrequency === "EVERY_4_WEEKS" ? "every 4 weeks" : "every week";

      console.log(
        `  Weekly box: ${m.weeklyMode ?? "NOT SET"} · ${cadence}` +
          ` · auto-delivery ${m.autoDeliveryEnabled ? "ON" : "OFF"}`
      );
      console.log(
        `  This week: ${due ? "DUE — will be notified" : "off week — no email, nothing sends"}` +
          `${m.weeklyAnchorAt ? ` (anchor ${date(m.weeklyAnchorAt)})` : ""}`
      );
      console.log(
        `  Card on file: ${m.squareCardId ? "yes" : "NO"}`
      );

      if (m.weeklyLogs.length > 0) {
        const recent = m.weeklyLogs
          .map((l) => `${date(l.weekStart)} ${l.status}${l.failureNote ? ` (${l.failureNote})` : ""}`)
          .join(" · ");
        console.log(`  Recent weeks: ${recent}`);
      } else {
        console.log("  Recent weeks: none logged yet");
      }
    }

    for (const p of problems) console.log(`  ⚠ ${p}`);
  }

  // Totals come from the full set, not the filtered view, so the summary
  // still describes the business when you're looking at one person.
  const byTier: Record<string, number> = {};
  let activeWeekly = 0;
  let dueThisWeek = 0;
  for (const m of memberships) {
    byTier[m.tier] = (byTier[m.tier] ?? 0) + 1;
    if (WEEKLY_TIERS.includes(m.tier) && m.status === "ACTIVE" && m.weeklyMode) {
      activeWeekly++;
      if (isDueThisWeek({ frequency: m.weeklyFrequency, anchorAt: m.weeklyAnchorAt, weekStart }))
        dueThisWeek++;
    }
  }

  console.log("\n" + "=".repeat(78));
  console.log(`Shown: ${shown} of ${memberships.length} membership(s)`);
  console.log(
    "By tier: " +
      Object.entries(byTier)
        .map(([t, n]) => `${t} ${n}`)
        .join(" · ")
  );
  console.log(
    `Weekly box set up: ${activeWeekly} · getting a box this week: ${dueThisWeek}`
  );
  console.log(`Week of ${date(weekStart)} (Monday)\n`);
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
