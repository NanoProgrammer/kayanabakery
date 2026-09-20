/**
 * Asks Square whether the card we have on file for each member still works.
 *
 * "Did not find matching card" only shows up at the moment we try to charge —
 * which is the moment a member is waiting on a page, or the week's box is being
 * created unattended. This checks ahead of that, so a dead card is found on a
 * Tuesday afternoon instead of during a real charge.
 *
 *   npm run check:cards
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const { squareClient } = await import("../lib/square/client");

  const env = process.env.SQUARE_ENVIRONMENT === "production" ? "production" : "sandbox";
  console.log(`\nKaryana — cards on file (Square ${env})`);
  console.log("=".repeat(70) + "\n");

  if (env !== "production") {
    console.log("⚠ SQUARE_ENVIRONMENT is not 'production'. Cards created against");
    console.log("  the live account will not be found here, and vice versa — that");
    console.log("  mismatch alone produces \"Did not find matching card\".\n");
  }

  const memberships = await prisma.membership.findMany({
    where: { status: "ACTIVE" },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { tier: "asc" },
  });

  let ok = 0, broken = 0, none = 0;

  for (const m of memberships) {
    const who = `${m.user?.name ?? "(no name)"} <${m.user?.email ?? "?"}>`;

    if (!m.squareCardId || !m.squareCustomerId) {
      // Only a problem for the tiers that get charged automatically.
      const matters = m.tier === "SELECTO" || m.tier === "LEGENDARIO";
      console.log(`${matters ? "✗" : "·"} ${who} — no card stored${matters ? "  (weekly box cannot charge)" : ""}`);
      none++;
      continue;
    }

    try {
      const res = await squareClient.cards.get({ cardId: m.squareCardId });
      const card = res.card;

      if (!card) {
        console.log(`✗ ${who} — Square returned no card for ${m.squareCardId}`);
        broken++;
        continue;
      }

      // A card that exists but belongs to someone else fails the charge with
      // exactly the "no matching card" message, so the owner is checked too.
      if (card.customerId && card.customerId !== m.squareCustomerId) {
        console.log(`✗ ${who} — card belongs to a different Square customer`);
        console.log(`    stored customer ${m.squareCustomerId}, card's owner ${card.customerId}`);
        broken++;
        continue;
      }

      if (card.enabled === false) {
        console.log(`✗ ${who} — card is disabled in Square (${card.cardBrand} ••••${card.last4})`);
        broken++;
        continue;
      }

      const exp = card.expMonth && card.expYear ? `${card.expMonth}/${card.expYear}` : "?";
      console.log(`✓ ${who} — ${card.cardBrand ?? "card"} ••••${card.last4 ?? "????"} exp ${exp}`);
      ok++;
    } catch (err: any) {
      const detail = err?.errors?.[0]?.detail ?? err?.message ?? String(err);
      console.log(`✗ ${who} — ${detail}`);
      broken++;
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`${ok} working · ${broken} broken · ${none} without a card`);
  if (broken > 0) {
    console.log("\nA broken card means that member's box cannot be charged. They need");
    console.log("to re-enter it from their account page.");
  }
  console.log("");
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
