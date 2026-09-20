/**
 * One pass over everything the bakery depends on, so a broken piece is found
 * before a customer finds it.
 *
 *   npm run health
 *
 * Read-only. It sends no email, charges no card, and creates nothing that it
 * does not delete again. Each check says what it proves; where something can
 * only be confirmed by doing it for real, it says so instead of guessing.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SITE = process.env.HEALTH_SITE ?? "https://www.karyanabakery.ca";

type Status = "ok" | "warn" | "fail" | "skip";
const results: { area: string; status: Status; detail: string }[] = [];

/** Prisma and some SDKs throw multi-line dumps; one line is enough here. */
function brief(err: any): string {
  const msg = String(err?.message ?? err);
  const meaningful = msg
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .find((l) => /^(error|invalid|missing|unauthor|forbidden)/i.test(l));
  return (meaningful ?? msg.split("\n")[0] ?? "unknown error").slice(0, 160);
}

function record(area: string, status: Status, detail: string) {
  const mark = { ok: "✓", warn: "!", fail: "✗", skip: "·" }[status];
  console.log(`  ${mark} ${detail}`);
  results.push({ area, status, detail });
}

function section(title: string) {
  console.log(`\n${title}`);
  console.log("-".repeat(68));
}

// ── 1. Environment ────────────────────────────────────────────────────────
function checkEnv() {
  section("1. Configuration");

  const required: [string, string][] = [
    ["DATABASE_URL", "the database"],
    ["NEXT_PUBLIC_SANITY_PROJECT_ID", "Sanity Studio"],
    ["SANITY_API_READ_TOKEN", "writing orders to Studio"],
    ["RESEND_API_KEY", "all transactional email"],
    ["CRON_SECRET", "every scheduled job"],
    ["SQUARE_ACCESS_TOKEN", "taking payments"],
  ];

  for (const [name, what] of required) {
    if (process.env[name]) record("env", "ok", `${name} is set — ${what}`);
    else record("env", "fail", `${name} MISSING — ${what} cannot work`);
  }

  const optional: [string, string][] = [
    ["BREVO_API_KEY", "contact lists"],
    ["BREVO_MEMBERS_LIST_ID", "the members list"],
    ["TWILIO_ACCOUNT_SID", "SMS to customers"],
    ["TWILIO_WHATSAPP_FROM", "WhatsApp (off on purpose)"],
    ["TWILIO_MESSAGING_SERVICE_SID", "sending texts at an exact time"],
  ];

  for (const [name, what] of optional) {
    if (process.env[name]) record("env", "ok", `${name} is set — ${what}`);
    else record("env", "skip", `${name} not set — ${what} is off`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (appUrl.includes("karyanabakery.com")) {
    record("env", "warn", "NEXT_PUBLIC_APP_URL points at the .com mirror — should be the .ca domain");
  }
}

// ── 2. Database ───────────────────────────────────────────────────────────
async function checkDatabase() {
  section("2. Database");

  try {
    const [users, orders, members, logs, nominations] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.membership.count({ where: { status: "ACTIVE" } }),
      prisma.weeklyOrderLog.count(),
      prisma.nomination.count(),
    ]);
    record("db", "ok", `connected — ${users} users, ${orders} orders, ${members} active memberships`);
    record("db", "ok", `weekly logs: ${logs} · nominations: ${nominations}`);
  } catch (err: any) {
    record("db", "fail", `cannot reach the database: ${brief(err)}`);
    return;
  }

  // Columns added late enough that a deployment can be missing them.
  try {
    await prisma.membership.findFirst({ select: { weeklyFrequency: true, weeklyAnchorAt: true } });
    record("db", "ok", "weekly frequency columns exist (db:push has been run)");
  } catch {
    record("db", "fail", "weekly frequency columns are MISSING — run npm run db:push");
  }

  try {
    await prisma.order.findFirst({ select: { readyMsgSid: true, completedMsgSid: true } });
    record("db", "ok", "scheduled-message columns exist");
  } catch {
    record("db", "fail", "scheduled-message columns are MISSING — run npm run db:push");
  }
}

// ── 3. Sanity ─────────────────────────────────────────────────────────────
async function checkSanity() {
  section("3. Sanity Studio");

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const token = process.env.SANITY_API_READ_TOKEN;
  if (!projectId || !token) {
    record("sanity", "skip", "no credentials — skipped");
    return;
  }

  const { createClient } = await import("next-sanity");
  const sanity = createClient({
    projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2025-02-19",
    token,
    useCdn: false,
  });

  try {
    const [products, orders] = await Promise.all([
      sanity.fetch<number>(`count(*[_type == "product"])`),
      sanity.fetch<number>(`count(*[_type == "order"])`),
    ]);
    record("sanity", "ok", `reading works — ${products} products, ${orders} orders`);
  } catch (err: any) {
    record("sanity", "fail", `cannot read: ${brief(err)}`);
    return;
  }

  // Writing is what breaks quietly: a read-only token looks fine until an
  // order needs to appear in the Orders list.
  const probe = `HEALTHCHECK-${Date.now()}`;
  try {
    const doc = await sanity.create({
      _type: "order",
      orderNumber: probe,
      customerName: "health check — deleting itself",
      status: "IN_PROGRESS",
      createdAt: new Date().toISOString(),
    });
    await sanity.delete(doc._id);
    record("sanity", "ok", "writing works — orders can reach the Orders list");
  } catch (err: any) {
    record("sanity", "fail", `cannot write (${err?.statusCode ?? ""}): the token needs Editor permission`);
  }
}

// ── 4. Email ──────────────────────────────────────────────────────────────
async function checkResend() {
  section("4. Email (Resend)");

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    record("resend", "fail", "RESEND_API_KEY missing — no email of any kind can send");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.status === 401) {
      record("resend", "fail", "the API key is rejected — every email is failing");
      return;
    }
    const data = await res.json().catch(() => ({}));
    const domains: any[] = data.data ?? [];
    record("resend", "ok", `API key works — ${domains.length} domain(s) registered`);

    for (const d of domains) {
      const verified = d.status === "verified";
      record("resend", verified ? "ok" : "warn",
        `${d.name}: ${d.status}${verified ? "" : " — mail from this domain may land in spam or bounce"}`);
    }
  } catch (err: any) {
    record("resend", "fail", `cannot reach Resend: ${brief(err)}`);
  }
}

// ── 5. Brevo ──────────────────────────────────────────────────────────────
async function checkBrevo() {
  section("5. Contact lists (Brevo)");

  const key = process.env.BREVO_API_KEY;
  if (!key) {
    record("brevo", "skip", "BREVO_API_KEY not set — list syncing is off");
    return;
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/contacts/lists?limit=50", {
      headers: { "api-key": key, Accept: "application/json" },
    });
    if (!res.ok) {
      record("brevo", "fail", `API key rejected (HTTP ${res.status})`);
      return;
    }
    const { lists = [] } = await res.json();
    record("brevo", "ok", `API key works — ${lists.length} list(s)`);

    const membersId = process.env.BREVO_MEMBERS_LIST_ID;
    if (membersId) {
      const list = lists.find((l: any) => String(l.id) === membersId);
      const paying = await prisma.membership.count({
        where: { status: "ACTIVE", tier: { in: ["ARTESANO", "SELECTO", "LEGENDARIO"] } },
      });
      if (!list) {
        record("brevo", "fail", `BREVO_MEMBERS_LIST_ID=${membersId} does not exist in Brevo`);
      } else if (list.totalSubscribers < paying) {
        record("brevo", "warn",
          `members list has ${list.totalSubscribers} of ${paying} members — run npm run sync:brevo`);
      } else {
        record("brevo", "ok", `members list is complete (${list.totalSubscribers})`);
      }
    }
  } catch (err: any) {
    record("brevo", "fail", `cannot reach Brevo: ${brief(err)}`);
  }
}

// ── 6. Square ─────────────────────────────────────────────────────────────
async function checkSquare() {
  section("6. Payments (Square)");

  if (!process.env.SQUARE_ACCESS_TOKEN) {
    record("square", "fail", "SQUARE_ACCESS_TOKEN missing — nothing can be charged");
    return;
  }

  const env = process.env.SQUARE_ENVIRONMENT === "production" ? "production" : "sandbox";
  record("square", env === "production" ? "ok" : "warn",
    `environment is ${env}${env === "production" ? "" : " — real cards will not be found"}`);

  const { squareClient } = await import("../lib/square/client");

  const withCards = await prisma.membership.findMany({
    where: { status: "ACTIVE", squareCardId: { not: null }, squareCustomerId: { not: null } },
    include: { user: { select: { email: true, name: true } } },
  });

  if (withCards.length === 0) {
    record("square", "skip", "no cards on file to check");
    return;
  }

  let good = 0;
  const bad: string[] = [];

  for (const m of withCards) {
    try {
      const card = (await squareClient.cards.get({ cardId: m.squareCardId! })).card;
      if (!card) { bad.push(`${m.user?.email}: not found`); continue; }
      if (card.customerId && card.customerId !== m.squareCustomerId) {
        bad.push(`${m.user?.email}: card belongs to a different Square customer`);
        continue;
      }
      if (card.enabled === false) { bad.push(`${m.user?.email}: card disabled`); continue; }
      good++;
    } catch (err: any) {
      bad.push(`${m.user?.email}: ${err?.errors?.[0]?.detail ?? err.message}`);
    }
  }

  record("square", "ok", `${good} card(s) usable`);
  for (const b of bad) record("square", "fail", `${b} — this member cannot be charged`);
}

// ── 7. Twilio ─────────────────────────────────────────────────────────────
async function checkTwilio() {
  section("7. Texts (Twilio)");

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    record("twilio", "skip", "not configured — order notifications will not send");
    return;
  }

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
      headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}` },
    });
    if (!res.ok) {
      record("twilio", "fail", `credentials rejected (HTTP ${res.status}) — no texts will send`);
      return;
    }
    const acc = await res.json();
    record("twilio", acc.status === "active" ? "ok" : "warn",
      `account is ${acc.status}${process.env.TWILIO_FROM_NUMBER ? `, sending from ${process.env.TWILIO_FROM_NUMBER}` : ", but TWILIO_FROM_NUMBER is not set"}`);
  } catch (err: any) {
    record("twilio", "fail", `cannot reach Twilio: ${brief(err)}`);
  }
}

// ── 8. The live site ──────────────────────────────────────────────────────
async function checkSite() {
  section("8. The site");

  const pages = ["/", "/shop", "/memberships", "/blog", "/refer-a-friend", "/track-order", "/robots.txt"];
  for (const path of pages) {
    try {
      const res = await fetch(`${SITE}${path}`, { redirect: "follow" });
      record("site", res.ok ? "ok" : "fail", `${path} → HTTP ${res.status}`);
    } catch (err: any) {
      record("site", "fail", `${path} → unreachable (${err.message})`);
    }
  }

  try {
    const res = await fetch(`${SITE}/sitemap.xml`);
    const xml = await res.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const wrongDomain = urls.filter((u) => !u.includes("www.karyanabakery.ca")).length;
    const products = urls.filter((u) => u.includes("/product/")).length;

    if (urls.length === 0) record("site", "fail", "sitemap has no URLs");
    else if (wrongDomain > 0) record("site", "fail", `sitemap: ${wrongDomain} URL(s) on the wrong domain`);
    else if (products === 0) record("site", "warn", `sitemap has ${urls.length} URLs but no products`);
    else record("site", "ok", `sitemap: ${urls.length} URLs, ${products} products, all on .ca`);
  } catch (err: any) {
    record("site", "fail", `sitemap unreachable: ${err.message}`);
  }
}

// ── 9. Scheduled jobs ─────────────────────────────────────────────────────
async function checkCrons() {
  section("9. Scheduled jobs");

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    record("cron", "fail", "CRON_SECRET not set locally — cannot verify the jobs");
    return;
  }

  // Calling notify for an address that belongs to nobody proves the endpoint
  // is live and the secret is accepted, without writing to a single member.
  try {
    const res = await fetch(
      `${SITE}/api/cron/weekly-box-notify?onlyEmail=nobody-health-check@example.invalid`,
      { headers: { authorization: `Bearer ${secret}` } }
    );
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      record("cron", "fail", "the site rejected CRON_SECRET — the value here differs from Vercel's");
    } else if (res.ok) {
      record("cron", "ok", `weekly-box-notify responds and accepts the secret (${JSON.stringify(body)})`);
    } else {
      record("cron", "fail", `weekly-box-notify returned HTTP ${res.status}`);
    }
  } catch (err: any) {
    record("cron", "fail", `cannot reach the cron endpoint: ${err.message}`);
  }

  // An unauthenticated call must be refused — this endpoint moves money.
  try {
    const res = await fetch(`${SITE}/api/cron/renew-memberships`);
    record("cron", res.status === 401 ? "ok" : "fail",
      res.status === 401
        ? "renew-memberships refuses unauthenticated calls"
        : `renew-memberships answered HTTP ${res.status} WITHOUT a secret — anyone could trigger charges`);
  } catch (err: any) {
    record("cron", "warn", `could not probe renew-memberships: ${err.message}`);
  }

  const { weekStartOf } = await import("../lib/membership/weekly");
  record("cron", "ok", `this week starts ${weekStartOf(new Date()).toISOString()} (Calgary Monday 00:00)`);
}

// ── 10. Weekly box readiness ──────────────────────────────────────────────
async function checkWeeklyBox() {
  section("10. Weekly box");

  const { isDueThisWeek, weekStartOf } = await import("../lib/membership/weekly");
  const weekStart = weekStartOf(new Date());

  const members = await prisma.membership.findMany({
    where: { status: "ACTIVE", tier: { in: ["SELECTO", "LEGENDARIO"] } },
    include: { user: { select: { email: true, name: true } } },
  });

  if (members.length === 0) {
    record("weekly", "skip", "nobody is on a weekly-box tier");
    return;
  }

  for (const m of members) {
    const who = m.user?.name ?? m.user?.email ?? m.id;
    if (!m.weeklyMode) {
      record("weekly", "warn", `${who}: never chose a mode — nothing will ever send`);
      continue;
    }
    const due = isDueThisWeek({
      frequency: m.weeklyFrequency,
      anchorAt: m.weeklyAnchorAt,
      weekStart,
    });
    record("weekly", "ok",
      `${who}: ${m.weeklyMode}, ${m.weeklyFrequency === "EVERY_4_WEEKS" ? "every 4 weeks" : "weekly"}, ` +
      `auto ${m.autoDeliveryEnabled ? "ON" : "OFF"}, ${due ? "due this week" : "off week"}`);
  }
}

// ── Run ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("\nKaryana — full health check");
  console.log(`Site: ${SITE}`);
  console.log("=".repeat(68));

  // Each section is isolated: the point of a health check is to report every
  // problem in one pass, not to stop at the first one. A section that throws
  // becomes a failed line like any other.
  const sections: [string, () => void | Promise<void>][] = [
    ["env", checkEnv],
    ["db", checkDatabase],
    ["sanity", checkSanity],
    ["resend", checkResend],
    ["brevo", checkBrevo],
    ["square", checkSquare],
    ["twilio", checkTwilio],
    ["site", checkSite],
    ["cron", checkCrons],
    ["weekly", checkWeeklyBox],
  ];

  for (const [area, fn] of sections) {
    try {
      await fn();
    } catch (err: any) {
      record(area, "fail", `this check could not run: ${brief(err)}`);
    }
  }

  const fails = results.filter((r) => r.status === "fail");
  const warns = results.filter((r) => r.status === "warn");

  console.log("\n" + "=".repeat(68));
  console.log(
    `${results.filter((r) => r.status === "ok").length} ok · ` +
    `${warns.length} worth looking at · ${fails.length} broken · ` +
    `${results.filter((r) => r.status === "skip").length} off`
  );

  if (fails.length > 0) {
    console.log("\nBroken:");
    for (const f of fails) console.log(`  ✗ ${f.detail}`);
  }
  if (warns.length > 0) {
    console.log("\nWorth looking at:");
    for (const w of warns) console.log(`  ! ${w.detail}`);
  }

  console.log("\nNot covered here, because it can only be proven by doing it:");
  console.log("  · that a real email arrives in an inbox  → npx tsx scripts/test-weekly-flow.ts <email>");
  console.log("  · that a real card can be charged        → only a real order proves this");
  console.log("  · that a text reaches a phone            → send one to yourself\n");

  process.exit(fails.length > 0 ? 1 : 0);
}

main()
  .catch((err) => {
    console.error("Health check crashed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
