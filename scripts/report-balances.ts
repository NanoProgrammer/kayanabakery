/**
 * How much of every customer's points balance is money they already paid.
 *
 *   npm run report:balances
 *
 * READ ONLY. It changes nothing. It answers the question that blocks the
 * Loyalty Club migration (spec F.2): prepaid money and points earned by
 * buying share one column, so "do not erase obligations already paid for"
 * cannot be honoured until they are told apart.
 *
 * It also reports accounts whose stored balance the ledger cannot explain.
 * Those must be settled before any migration runs — reconstructing one of
 * them would hand the customer a smaller obligation than they paid for.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import { checkBalance } from "../lib/loyalty/balances";

const money = (points: number) => `$${(points / 100).toFixed(2)}`;

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const { liveIdentity } = await import("../lib/db/identity");

  console.log(`\nDatabase: ${await liveIdentity(prisma as never, process.env.DATABASE_URL)}\n`);

  const users = await prisma.user.findMany({
    where: { OR: [{ pointsBalance: { gt: 0 } }, { pointsLedger: { some: {} } }] },
    select: {
      id: true,
      email: true,
      name: true,
      pointsBalance: true,
      pointsLedger: {
        select: { type: true, amount: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!users.length) {
    console.log("No customer holds points or has any points history.\n");
    await prisma.$disconnect();
    return;
  }

  let prepaidTotal = 0;
  let earnedTotal = 0;
  const drifting: { who: string; stored: number; ledger: number; drift: number }[] = [];

  for (const user of users) {
    const { split, drift, driftsFromLedger } = checkBalance(
      user.pointsBalance,
      user.pointsLedger
    );
    prepaidTotal += split.prepaid;
    earnedTotal += split.earned;
    if (driftsFromLedger) {
      drifting.push({
        who: user.email ?? user.name ?? user.id,
        stored: user.pointsBalance,
        ledger: split.total,
        drift,
      });
    }
  }

  console.log(`${users.length} customer(s) with points or history\n`);
  console.log(`  Prepaid, still unspent   ${String(prepaidTotal).padStart(9)} pts  ${money(prepaidTotal)}`);
  console.log(`    an obligation: money customers already handed over`);
  console.log(`  Earned, still unspent    ${String(earnedTotal).padStart(9)} pts  ${money(earnedTotal)}`);
  console.log(`    a marketing cost, not a debt`);
  console.log(
    `  Total outstanding        ${String(prepaidTotal + earnedTotal).padStart(9)} pts  ${money(prepaidTotal + earnedTotal)}\n`
  );

  if (!drifting.length) {
    console.log("  Every balance is explained by its ledger. Safe to migrate on.\n");
    await prisma.$disconnect();
    return;
  }

  console.log(`  WARNING: ${drifting.length} account(s) the ledger does NOT explain:\n`);
  for (const d of drifting.slice(0, 20)) {
    const sign = d.drift > 0 ? "+" : "";
    console.log(
      `      ${d.who.padEnd(34)} stored ${String(d.stored).padStart(7)}  ledger ${String(d.ledger).padStart(7)}  off by ${sign}${d.drift}`
    );
  }
  if (drifting.length > 20) {
    console.log(`      and ${drifting.length - 20} more`);
  }
  console.log(
    "\n  Points moved on these without a ledger row. Settle them before any\n" +
      "  migration: reconstructing one would give the customer a smaller\n" +
      "  obligation than they actually paid for.\n"
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(`\nFailed: ${err?.message ?? err}\n`);
  process.exit(1);
});
