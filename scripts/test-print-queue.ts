/**
 * Proves the kitchen printer is never handed an order that isn't finished.
 *
 * Studio saves a draft on the first keystroke. The queue's GROQ used to match
 * drafts, so typing a customer's name into a custom order printed it on the
 * spot — and the ack then stamped printedAt on the draft, which the document
 * carried into publication, so the finished order never printed at all.
 *
 * The real query string is evaluated here with groq-js against a dataset built
 * to contain every case, rather than a paraphrase of it, so the test fails if
 * the route's query is ever loosened.  Run it with:  npm run test:print-queue
 */
import { evaluate, parse } from "groq-js";
import {
  MANUAL_ORDER_BY_REF_QUERY,
  MANUAL_ORDERS_QUERY,
  STAMPED_MANUAL_ORDERS_QUERY,
} from "../app/api/print/_queries";
import { isUnpublishedId, parsePrintId } from "../app/api/print/_ids";

let passed = 0;
let failed = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
    console.log(`      expected: ${JSON.stringify(expected)}`);
    console.log(`      got:      ${JSON.stringify(actual)}`);
  }
}

const SINCE = "2026-10-01T00:00:00.000Z";

const base = {
  _type: "order",
  customerName: "Karyana",
  fulfillmentType: "PICKUP",
};

const dataset = [
  // Two finished custom orders. These are the only two the kitchen should see.
  { ...base, _id: "order-published-2", orderNumber: "Custom Order #2", createdAt: "2026-10-20T15:00:00.000Z" },
  { ...base, _id: "order-published-1", orderNumber: "Custom Order #1", createdAt: "2026-10-19T15:00:00.000Z" },

  // Karyana halfway through typing one: the bug Karyana reported.
  { ...base, _id: "drafts.order-being-typed", orderNumber: "Custom Order #3", customerName: "Mar", createdAt: "2026-10-20T16:00:00.000Z" },

  // A scheduled edit sitting in a content release.
  { ...base, _id: "versions.autumn.order-scheduled", orderNumber: "Custom Order #4", createdAt: "2026-10-20T16:00:00.000Z" },

  // From the website. The database half of the queue owns these.
  { ...base, _id: "order-from-checkout", orderNumber: "KAR-202610-00042", prismaId: "ck_1", createdAt: "2026-10-20T10:00:00.000Z" },

  // Already on paper.
  { ...base, _id: "order-already-printed", orderNumber: "Custom Order #0", printedAt: "2026-10-20T11:00:00.000Z", createdAt: "2026-10-20T09:00:00.000Z" },

  // Older than the cutoff — history, not a job.
  { ...base, _id: "order-may", orderNumber: "Custom Order #old", createdAt: "2026-05-04T09:00:00.000Z" },

  // No date at all: nothing to compare against, so it isn't queued.
  { ...base, _id: "order-no-date", orderNumber: "Custom Order #nodate" },

  // Not an order.
  { _id: "product-conchas", _type: "product", title: "Conchas" },
];

async function runQueue(): Promise<string[]> {
  const tree = parse(MANUAL_ORDERS_QUERY);
  const value = await evaluate(tree, { dataset, params: { since: SINCE } });
  const rows = (await value.get()) as { _id: string }[];
  return rows.map((r) => r._id);
}

async function testQueue() {
  console.log("\n1. What the printer is offered\n");

  const ids = await runQueue();

  check(
    "only the two finished custom orders, oldest first",
    ids,
    ["order-published-1", "order-published-2"]
  );
  check("a half-typed draft is not queued", ids.includes("drafts.order-being-typed"), false);
  check("a scheduled release edit is not queued", ids.includes("versions.autumn.order-scheduled"), false);
  check("a website order is left to the database half", ids.includes("order-from-checkout"), false);
  check("an order already printed is not queued again", ids.includes("order-already-printed"), false);
  check("an order from May is not queued", ids.includes("order-may"), false);
  check("an order with no createdAt is not queued", ids.includes("order-no-date"), false);
  check("a product is not an order", ids.includes("product-conchas"), false);
}

function testGuards() {
  console.log("\n2. The guards on /pdf and /ack\n");

  check("a draft id is unpublished", isUnpublishedId("drafts.abc"), true);
  check("a release id is unpublished", isUnpublishedId("versions.autumn.abc"), true);
  check("a published id is not", isUnpublishedId("abc"), false);
  check("a name beginning with 'draft' is not a draft", isUnpublishedId("draftsmanship-order"), false);

  // The agent hands back whatever /pending gave it, so the prefix has to
  // survive the round trip for the guard to be reached at all.
  const target = parsePrintId(encodeURIComponent("sanity:drafts.abc"));
  check("a sanity: id still parses", target, { kind: "studio", sanityId: "drafts.abc" });
  check(
    "and is caught by the guard",
    target.kind === "studio" && isUnpublishedId(target.sanityId),
    true
  );
}

/** The damage the bug left behind: a draft already carrying a printedAt. */
const stampedDataset = [
  ...dataset,
  { ...base, _id: "drafts.order-stamped", orderNumber: "Custom Order #5", printedAt: "2026-10-20T12:00:00.000Z", createdAt: "2026-10-20T11:00:00.000Z" },
];

async function run(query: string, ds: unknown[], params: Record<string, unknown> = {}) {
  const value = await evaluate(parse(query), { dataset: ds, params });
  return (await value.get()) as OrderRow[];
}

type OrderRow = { _id: string; orderNumber?: string };

async function testRecovery() {
  console.log("\n3. Finding orders stuck by the old bug\n");

  const stuck = await run(STAMPED_MANUAL_ORDERS_QUERY, stampedDataset);
  const ids = stuck.map((r) => r._id);

  check(
    "a stamped draft is listed — that is the damage to undo",
    ids.includes("drafts.order-stamped"),
    true
  );
  check("a published stamped order is listed too", ids.includes("order-already-printed"), true);
  check("an unprinted order is not listed", ids.includes("order-published-1"), false);
  check("a website order is never listed", ids.includes("order-from-checkout"), false);

  console.log("\n4. Picking the one order to free\n");

  check(
    "found by its order number",
    (await run(MANUAL_ORDER_BY_REF_QUERY, stampedDataset, { ref: "Custom Order #0" })).map((r) => r._id),
    ["order-already-printed"]
  );
  check(
    "found by document id",
    (await run(MANUAL_ORDER_BY_REF_QUERY, stampedDataset, { ref: "order-already-printed" })).map((r) => r._id),
    ["order-already-printed"]
  );
  check(
    "the id of a draft finds the draft, so it can be freed before publishing",
    (await run(MANUAL_ORDER_BY_REF_QUERY, stampedDataset, { ref: "order-stamped" })).map((r) => r._id),
    ["drafts.order-stamped"]
  );
  check(
    "a name nobody has finds nothing",
    (await run(MANUAL_ORDER_BY_REF_QUERY, stampedDataset, { ref: "Custom Order #999" })).length,
    0
  );
  check(
    "a website order cannot be reached by this script",
    (await run(MANUAL_ORDER_BY_REF_QUERY, stampedDataset, { ref: "KAR-202610-00042" })).length,
    0
  );
}

async function main() {
  console.log("Print queue — what reaches the kitchen printer");
  await testQueue();
  testGuards();
  await testRecovery();

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
