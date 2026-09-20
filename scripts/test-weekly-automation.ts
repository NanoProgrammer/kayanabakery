/**
 * Proves the two halves of the weekly automation actually work:
 *
 *   1. The every-4-weeks rhythm picks the right weeks (pure logic, offline).
 *   2. An automatic order can really reach Sanity Studio — the bug where
 *      weekly orders were charged but never appeared in the Orders list.
 *
 * Part 2 writes a real document and deletes it again, so the Orders list is
 * left exactly as it was. Run it with:  npm run test:weekly
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import { createClient } from "next-sanity";
import { weekStartOf, isDueThisWeek } from "../lib/membership/weekly";

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

/** Monday of the week `n` weeks after the given week start. */
function weeksAfter(weekStart: Date, n: number): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + n * 7);
  return d;
}

function testFrequency() {
  console.log("\n1. Delivery frequency\n");

  const anchor = weekStartOf(new Date("2026-01-05T12:00:00")); // a Monday

  console.log("  Weekly members get a box every single week:");
  for (const n of [0, 1, 2, 3, 4, 7]) {
    check(
      `week +${n} → due`,
      isDueThisWeek({ frequency: "WEEKLY", anchorAt: anchor, weekStart: weeksAfter(anchor, n) }),
      true
    );
  }

  console.log("\n  Every-4-weeks members get weeks 0, 4, 8 … and nothing between:");
  const expectations: [number, boolean][] = [
    [0, true],   // the week they switched — first box lands right away
    [1, false],
    [2, false],
    [3, false],
    [4, true],
    [5, false],
    [8, true],
    [12, true],
    [13, false],
  ];
  for (const [n, due] of expectations) {
    check(
      `week +${n} → ${due ? "due" : "skipped"}`,
      isDueThisWeek({
        frequency: "EVERY_4_WEEKS",
        anchorAt: anchor,
        weekStart: weeksAfter(anchor, n),
      }),
      due
    );
  }

  console.log("\n  Edge cases:");
  check(
    "no anchor → falls back to weekly (never silently starve a paying member)",
    isDueThisWeek({ frequency: "EVERY_4_WEEKS", anchorAt: null, weekStart: anchor }),
    true
  );
  check(
    "a week before the anchor → not due",
    isDueThisWeek({
      frequency: "EVERY_4_WEEKS",
      anchorAt: anchor,
      weekStart: weeksAfter(anchor, -1),
    }),
    false
  );

  // Crossing a DST boundary must not shift the rhythm by a week. Alberta
  // springs forward in March, so anchor in February and check across it.
  const dstAnchor = weekStartOf(new Date("2026-02-02T12:00:00"));
  check(
    "4 weeks across the March DST change → still due",
    isDueThisWeek({
      frequency: "EVERY_4_WEEKS",
      anchorAt: dstAnchor,
      weekStart: weeksAfter(dstAnchor, 8),
    }),
    true
  );
}

function testWeekBoundaries() {
  console.log("\n2. Which week a moment belongs to\n");

  // The bakery is in Calgary, the server is in UTC. When this read the
  // machine's clock they disagreed, so a row written by the server could not
  // be found by a script here, and a Sunday-evening decision was filed under
  // the following week.
  const week = (iso: string) => weekStartOf(new Date(iso)).toISOString();

  check(
    "Sunday 11:59 PM Calgary still belongs to the week that is ending",
    week("2026-09-21T05:59:00Z"),
    "2026-09-14T06:00:00.000Z"
  );
  check(
    "Monday 12:01 AM Calgary starts the new week",
    week("2026-09-21T06:01:00Z"),
    "2026-09-21T06:00:00.000Z"
  );
  check(
    "midweek lands on that same Monday",
    week("2026-09-23T18:00:00Z"),
    "2026-09-21T06:00:00.000Z"
  );

  // Winter is UTC-7, summer UTC-6 — the instant shifts because the wall clock
  // is what stays fixed, which is the point.
  check(
    "a week in standard time anchors at 07:00Z",
    week("2026-02-04T12:00:00Z"),
    "2026-02-02T07:00:00.000Z"
  );
  check(
    "a week in daylight time anchors at 06:00Z",
    week("2026-07-08T12:00:00Z"),
    "2026-07-06T06:00:00.000Z"
  );
}

async function testSanitySync() {
  console.log("\n3. Automatic orders reaching Sanity Studio\n");

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const token = process.env.SANITY_API_READ_TOKEN;

  if (!projectId || !token) {
    console.log("  ⚠ Skipped — no Sanity credentials in .env.local");
    console.log("    (run this from your machine, not CI, to test the real write)");
    return;
  }

  const sanity = createClient({
    projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2025-02-19",
    token,
    useCdn: false,
  });

  const orderNumber = `TEST-${Date.now()}`;
  let createdId: string | null = null;

  try {
    const created = await sanity.create({
      _type: "order",
      orderNumber,
      prismaId: `test-${Date.now()}`,
      customerName: "Automated test — safe to delete",
      customerEmail: "test@example.com",
      customerPhone: "",
      fulfillmentType: "PICKUP",
      total: 1,
      items: [{ _key: "test-0", name: "Test item", quantity: 1, price: 1 }],
      pickupDate: "Weekly auto-order — contact member to schedule",
      status: "IN_PROGRESS",
      createdAt: new Date().toISOString(),
    });
    createdId = created._id;
    console.log(`  ✓ Wrote a test order to Sanity (${orderNumber})`);
  } catch (err: any) {
    failed++;
    console.log(`  ✗ Could NOT write to Sanity: ${err?.statusCode ?? ""} ${err?.message ?? err}`);
    console.log("    This is the real cause of automatic orders not showing up.");
    console.log("    SANITY_API_READ_TOKEN needs Editor permission, not Viewer.");
    return;
  }

  // Reading it back is the part that matters: a write that "succeeds" but
  // lands in a different dataset would still leave the Orders list empty.
  try {
    const found = await sanity.fetch(
      `*[_type == "order" && orderNumber == $orderNumber][0]{ _id, orderNumber, status }`,
      { orderNumber }
    );
    check("the order is readable in the Orders list", Boolean(found?._id), true);
  } catch (err: any) {
    failed++;
    console.log(`  ✗ Could not read the order back: ${err?.message ?? err}`);
  }

  if (createdId) {
    try {
      await sanity.delete(createdId);
      console.log("  ✓ Test order deleted — your Orders list is unchanged");
    } catch (err: any) {
      console.log(`  ⚠ Could not delete the test order ${orderNumber}: ${err?.message ?? err}`);
      console.log("    Delete it by hand in Studio.");
    }
  }
}

async function main() {
  console.log("Karyana — weekly automation check");
  console.log("==================================");

  testFrequency();
  testWeekBoundaries();
  await testSanitySync();

  console.log("\n==================================");
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Test run crashed:", err);
  process.exit(1);
});
