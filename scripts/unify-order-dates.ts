/**
 * Rewrites every order's pickup/delivery time into the one canonical format.
 *
 *   npm run orders:dates          show what would change
 *   npm run orders:dates:apply    write it
 *
 * Three different places used to write this field in three different shapes,
 * so nothing could read it back: Studio showed empty boxes on orders that
 * plainly had a date, and the orders list could not show when anything was
 * for. Everything writes the canonical shape now; this brings the orders
 * already in Studio along with it.
 *
 * An order whose value carries no readable date — the weekly box's "Contact
 * you to schedule", a note someone typed — is left exactly as it is. Guessing
 * a date onto one of those would be inventing an appointment.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import { formatPickupLabel, parsePickupLabel } from "../lib/studio/pickup-label";

type OrderDoc = {
  _id: string;
  orderNumber?: string;
  customerName?: string;
  pickupDate?: string;
};

async function main() {
  const apply = process.argv.slice(2).some((a) => a === "apply");

  const { writeClient } = await import("../sanity/lib/client");

  const docs = await writeClient.fetch<OrderDoc[]>(
    `*[_type == "order" && defined(pickupDate) && pickupDate != ""]
       | order(createdAt desc) [0...1000] {
         _id, orderNumber, customerName, pickupDate
       }`
  );

  console.log(`\n${docs.length} order(s) with a date on them\n`);

  const toChange: { doc: OrderDoc; next: string }[] = [];
  let already = 0;
  const unreadable: OrderDoc[] = [];

  for (const doc of docs) {
    const current = doc.pickupDate ?? "";
    const parts = parsePickupLabel(current);

    if (!parts.date) {
      unreadable.push(doc);
      continue;
    }

    const next = formatPickupLabel(parts.date, parts.time, parts.endTime);
    if (next === current) {
      already++;
      continue;
    }
    toChange.push({ doc, next });
  }

  console.log(`  ${already} already in the canonical format`);
  console.log(`  ${toChange.length} would be rewritten`);
  console.log(`  ${unreadable.length} carry no readable date — left alone\n`);

  if (unreadable.length) {
    console.log("  Left alone:\n");
    for (const d of unreadable.slice(0, 15)) {
      console.log(`    ${(d.orderNumber ?? d._id).padEnd(24)} ${d.pickupDate}`);
    }
    if (unreadable.length > 15) console.log(`    … and ${unreadable.length - 15} more`);
    console.log("");
  }

  if (!toChange.length) {
    console.log("  Nothing to rewrite.\n");
    return;
  }

  console.log("  " + "=".repeat(78));
  for (const { doc, next } of toChange.slice(0, 40)) {
    console.log(`  ${doc.orderNumber ?? doc._id}  ${doc.customerName ?? ""}`);
    console.log(`      from: ${doc.pickupDate}`);
    console.log(`      to:   ${next}`);
  }
  if (toChange.length > 40) console.log(`  … and ${toChange.length - 40} more`);
  console.log("  " + "=".repeat(78));

  if (!apply) {
    console.log("\nDry run — nothing was written.");
    console.log("To write these:  npm run orders:dates:apply\n");
    return;
  }

  // One transaction: a half-migrated field is the problem this is fixing.
  let tx = writeClient.transaction();
  for (const { doc, next } of toChange) {
    tx = tx.patch(doc._id, (p) => p.set({ pickupDate: next }));
  }
  await tx.commit();

  console.log(`\n${toChange.length} order(s) rewritten.\n`);
}

main().catch((err) => {
  console.error(`\nFailed: ${err?.message ?? err}\n`);
  process.exit(1);
});
