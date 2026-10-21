/**
 * Finds money Square took that the bakery has no order for.
 *
 * The checkout charges the card first and writes the order second. If anything
 * failed in between — a transaction timeout, a cold database, a function cut
 * short — the customer was charged, saw an error, and the order never existed.
 * Nothing else in the system notices: there is no row to be missing.
 *
 *   npm run payments:orphans          the last 7 days
 *   npm run payments:orphans -- 30    the last 30 days
 *
 * Read-only. It never refunds or changes anything — it tells you who to look
 * for, and you decide.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

function money(cents: number | bigint | null | undefined): string {
  const n = Number(cents ?? 0);
  return `$${(n / 100).toFixed(2)}`;
}

async function main() {
  const days = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a)) ?? 7);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const { squareClient, SQUARE_LOCATION_ID } = await import("../lib/square/client");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  console.log(`\nSquare payments since ${since.toISOString().slice(0, 10)}\n`);

  const payments: {
    id: string;
    amount: number;
    createdAt: string;
    status: string;
    email: string | null;
    note: string | null;
  }[] = [];

  const page = await squareClient.payments.list({
    beginTime: since.toISOString(),
    sortOrder: "ASC",
    locationId: SQUARE_LOCATION_ID || undefined,
  });

  for await (const p of page) {
    if (!p.id) continue;
    payments.push({
      id: p.id,
      amount: Number(p.amountMoney?.amount ?? 0),
      createdAt: p.createdAt ?? "",
      status: p.status ?? "",
      email: p.buyerEmailAddress ?? null,
      // Our own code stamps every charge it makes: "Karyana order — …" from
      // checkout, "Karyana weekly box — …" from the membership cron. A payment
      // without one was raised by Square itself (a subscription invoice) or
      // taken in person, and has no reason to have an order behind it.
      note: p.note ?? null,
    });
  }

  // Only completed payments are money the bakery actually holds.
  const completed = payments.filter((p) => p.status === "COMPLETED");
  console.log(`  ${payments.length} payment(s), ${completed.length} completed\n`);

  if (!completed.length) {
    await prisma.$disconnect();
    return;
  }

  const orders = await prisma.order.findMany({
    where: { squarePaymentId: { in: completed.map((p) => p.id) } },
    select: { squarePaymentId: true, orderNumber: true },
  });
  const known = new Set(orders.map((o) => o.squarePaymentId));

  const orphans = completed.filter((p) => !known.has(p.id));

  if (!orphans.length) {
    console.log("  Every completed payment has an order. Nothing was lost.\n");
    await prisma.$disconnect();
    return;
  }

  // A charge our own checkout made, with no order behind it, is a customer who
  // paid and got an error. Anything else is a subscription invoice or a sale
  // rung up in person, and is supposed to have no order.
  const fromCheckout = orphans.filter((p) => p.note?.startsWith("Karyana"));
  const other = orphans.filter((p) => !p.note?.startsWith("Karyana"));

  function table(rows: typeof orphans) {
    console.log("  " + "=".repeat(74));
    for (const p of rows) {
      console.log(
        `  ${money(p.amount).padStart(9)}   ${p.createdAt.slice(0, 16).replace("T", " ")}   ${p.email ?? "(no email)"}`
      );
      console.log(`              ${p.id}`);
      if (p.note) console.log(`              ${p.note}`);
    }
    console.log("  " + "=".repeat(74));
  }

  if (fromCheckout.length) {
    console.log(`  ${fromCheckout.length} charged by the website with NO order — these are lost orders:\n`);
    table(fromCheckout);
    console.log(
      "\n  Each of these is a customer who paid and saw an error. Look the payment\n" +
        "  up in Square by the id, then either enter the order by hand in Studio or\n" +
        "  refund it.\n"
    );
  }

  if (other.length) {
    console.log(`  ${other.length} other payment(s) with no order — probably memberships or`);
    console.log("  sales taken in person, which never have one. Listed so you can confirm:\n");
    table(other);
    console.log("");
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(`\nFailed: ${err?.message ?? err}\n`);
  process.exit(1);
});
