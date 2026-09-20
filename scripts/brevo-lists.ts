/**
 * Shows the Brevo lists that actually exist, and which env var points at each.
 *
 * Every list here is optional in code: an unset id makes that sync a silent
 * no-op, so a list that was never wired up looks exactly like one that is
 * working but empty. This tells the two apart.
 *
 *   npm run brevo:lists
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ENV_VARS = [
  ["BREVO_LIST_ID", "everyone (newsletter + contacts)"],
  ["BREVO_MEMBERS_LIST_ID", "paying members — Artesano, Selecto, Legendario"],
  ["BREVO_ES_LIST_ID", "Spanish speakers"],
  ["BREVO_EN_LIST_ID", "English speakers"],
  ["BREVO_WELCOME_LIST_ID", "welcome automation"],
  ["BREVO_PROGRAMS_PROMO_LIST_ID", "programs promo"],
  ["BREVO_TOGGLE_ON_LIST_ID", "weekly auto-delivery turned ON"],
  ["BREVO_TOGGLE_OFF_LIST_ID", "weekly auto-delivery turned OFF"],
] as const;

async function main() {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.error("BREVO_API_KEY is not set in .env.local");
    process.exit(1);
  }

  const res = await fetch("https://api.brevo.com/v3/contacts/lists?limit=50", {
    headers: { "api-key": key, Accept: "application/json" },
  });

  if (!res.ok) {
    console.error(`Brevo returned HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  const lists: { id: number; name: string; totalSubscribers: number }[] =
    data.lists ?? [];

  console.log("\nLists that exist in your Brevo account");
  console.log("=".repeat(68));
  for (const l of lists) {
    console.log(`  id ${String(l.id).padEnd(4)} ${String(l.totalSubscribers).padStart(5)} contacts   ${l.name}`);
  }
  if (lists.length === 0) console.log("  (none)");

  console.log("\nWhat the site is configured to use");
  console.log("=".repeat(68));

  const byId = new Map(lists.map((l) => [l.id, l]));
  let unset = 0;

  for (const [envVar, what] of ENV_VARS) {
    const raw = process.env[envVar];
    if (!raw) {
      console.log(`  ✗ ${envVar}`);
      console.log(`      not set — nothing is ever added to a list for ${what}`);
      unset++;
      continue;
    }
    const list = byId.get(parseInt(raw, 10));
    if (!list) {
      console.log(`  ✗ ${envVar} = ${raw}`);
      console.log(`      no list with that id exists in Brevo — writes go nowhere`);
      continue;
    }
    console.log(`  ✓ ${envVar} = ${raw} → "${list.name}" (${list.totalSubscribers} contacts)`);
    console.log(`      ${what}`);
  }

  // The members list is the one with a number we can check against the
  // database, so a list that exists but was never backfilled is visible.
  const membersId = process.env.BREVO_MEMBERS_LIST_ID;
  const shouldBeMembers = await prisma.membership.count({
    where: { status: "ACTIVE", tier: { in: ["ARTESANO", "SELECTO", "LEGENDARIO"] } },
  });

  console.log("\nMembers");
  console.log("=".repeat(68));
  console.log(`  Active paying members in the database: ${shouldBeMembers}`);

  if (!membersId) {
    console.log("  BREVO_MEMBERS_LIST_ID is not set, so none of them are in any");
    console.log("  members list. Create a list in Brevo, put its id in that");
    console.log("  variable (locally and on Vercel), then run: npm run sync:brevo");
  } else {
    const list = byId.get(parseInt(membersId, 10));
    const have = list?.totalSubscribers ?? 0;
    if (have < shouldBeMembers) {
      console.log(`  The list has ${have}. Members who subscribed before this sync`);
      console.log("  existed were never added — run: npm run sync:brevo");
    } else {
      console.log(`  The list has ${have}. Nothing missing.`);
    }
  }
  console.log("");
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
