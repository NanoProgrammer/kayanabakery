/**
 * Finds and frees custom orders that the printer stamped before they were real.
 *
 * Studio used to hand the printer a custom order the moment a name was typed
 * into it, and the ack stamped printedAt on the draft. That stamp travels with
 * the document when the order is published, and the queue skips anything
 * stamped — so the finished order silently never printed. printedAt is hidden
 * and read-only in Studio, so this is the only way to clear it.
 *
 *   npm run print:stuck                         list the stamped orders
 *   npm run print:unstick -- "Custom Order #3"  let one print again
 *
 * It only ever clears printedAt, only on manually-created orders, and only on
 * one order at a time.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import {
  MANUAL_ORDER_BY_REF_QUERY,
  STAMPED_MANUAL_ORDERS_QUERY,
} from "../app/api/print/_queries";

type OrderRow = {
  _id: string;
  orderNumber?: string;
  customerName?: string;
  createdAt?: string;
  printedAt?: string;
};

function label(row: OrderRow): string {
  const draft = row._id.startsWith("drafts.") ? "  (still a draft)" : "";
  return `${(row.orderNumber ?? "(no number)").padEnd(22)} ${(row.customerName ?? "—").padEnd(22)}${draft}`;
}

async function main() {
  // The argument is positional on purpose: npm on Windows eats a --flag that
  // follows `--`, so a flag here would silently do nothing.
  const ref = process.argv.slice(2).filter((a) => !a.startsWith("--")).join(" ").trim();

  const { writeClient } = await import("../sanity/lib/client");

  if (!ref) {
    const rows = await writeClient.fetch<OrderRow[]>(STAMPED_MANUAL_ORDERS_QUERY);

    if (!rows.length) {
      console.log("\nNo custom order is marked as printed. Nothing is stuck.\n");
      return;
    }

    console.log(`\n${rows.length} custom order(s) marked as printed:\n`);
    for (const r of rows) {
      console.log(`  ${label(r)}`);
      console.log(`    printed ${r.printedAt}`);
    }
    console.log(
      '\nIf one of these never actually came out of the printer:\n' +
        '  npm run print:unstick -- "Custom Order #3"\n'
    );
    return;
  }

  const matches = await writeClient.fetch<OrderRow[]>(MANUAL_ORDER_BY_REF_QUERY, { ref });

  if (!matches.length) {
    console.log(`\nNo custom order called "${ref}".`);
    console.log("Run  npm run print:stuck  to see the ones that are marked printed.\n");
    process.exit(1);
  }

  if (matches.length > 1) {
    console.log(`\n"${ref}" matches ${matches.length} orders, so I won't guess:\n`);
    for (const m of matches) console.log(`  ${m._id}   ${label(m)}`);
    console.log("\nRun it again with the id on the left instead of the name.\n");
    process.exit(1);
  }

  const [order] = matches;

  if (!order.printedAt) {
    console.log(`\n${order.orderNumber ?? order._id} isn't marked as printed — nothing to clear.`);
    console.log("It will print on its own once it's published.\n");
    return;
  }

  await writeClient.patch(order._id).unset(["printedAt"]).commit();

  console.log(`\n${order.orderNumber ?? order._id} — cleared (was ${order.printedAt}).`);
  console.log(
    order._id.startsWith("drafts.")
      ? "It's still a draft, so it will print once you publish it.\n"
      : "The printer will pick it up on its next check.\n"
  );
}

main().catch((err) => {
  console.error(`\nCould not reach Studio: ${err?.message ?? err}\n`);
  process.exit(1);
});
