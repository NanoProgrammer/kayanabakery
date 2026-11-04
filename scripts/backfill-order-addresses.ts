/**
 * Copies each past delivery order's address onto the order itself.
 *
 *   npm run orders:backfill-address          show what it would do
 *   npm run orders:backfill-address:apply    do it
 *
 * Orders now store a copy of the address they were delivered to, so editing
 * or deleting a saved address cannot rewrite or erase history. Orders placed
 * before that still hold only the link — which means deleting an old address
 * would blank them. Customers are about to be able to delete old addresses
 * from the checkout, so this has to run first.
 *
 * Read-only on Address. It only ever fills in an order that has no copy yet,
 * so it is safe to run twice and cannot overwrite a real snapshot.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import { snapshotAddress, formatDeliveryAddress } from "../lib/orders/delivery-address";

async function main() {
  const apply = process.argv.slice(2).includes("apply");
  const { PrismaClient, Prisma } = await import("@prisma/client");
  const prisma = new PrismaClient();

  const orders = await prisma.order.findMany({
    // Prisma.DbNull, not null. On a Json column `equals: null` asks for rows
    // holding the JSON value `null`, which is a different thing from a column
    // that was never written — so a plain null matched nothing and this
    // script reported "every order already carries its address" while doing
    // nothing at all.
    where: { addressId: { not: null }, deliveryAddress: { equals: Prisma.DbNull } },
    select: {
      id: true,
      orderNumber: true,
      address: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!orders.length) {
    console.log("\nEvery delivery order already carries its address.\n");
    await prisma.$disconnect();
    return;
  }

  console.log(`\n${orders.length} order(s) with no copy of their address:\n`);

  let written = 0;
  for (const order of orders) {
    const snapshot = snapshotAddress(order.address);
    if (!snapshot) {
      // The address row is already gone, or has no street. Nothing to copy —
      // and nothing this script can recover.
      console.log(`  ${order.orderNumber.padEnd(14)} address missing — cannot be recovered`);
      continue;
    }
    console.log(`  ${order.orderNumber.padEnd(14)} ${formatDeliveryAddress(snapshot)}`);
    if (apply) {
      await prisma.order.update({
        where: { id: order.id },
        data: { deliveryAddress: snapshot as any },
      });
      written++;
    }
  }

  if (!apply) {
    console.log(`\nDry run — nothing was written.`);
    console.log("To write them:  npm run orders:backfill-address:apply\n");
  } else {
    console.log(`\n${written} order(s) updated.\n`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(`\nFailed: ${err?.message ?? err}\n`);
  process.exit(1);
});
