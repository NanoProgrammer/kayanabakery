/**
 * "Más vendidos" from real sales — Situación 12.
 *
 *   npm run test:bestsellers
 *
 * The shop's default sort used to read a BESTSELLER tag typed by hand in
 * the Studio. These guard the thing that replaced it, and above all the
 * fallback: if the orders cannot be read, the shop must look exactly as
 * it did before rather than shuffle itself into nonsense.
 */
import {
  tallySales,
  unitsSold,
  hasSalesData,
  SALES_WINDOW_DAYS,
  COUNTED_STATUSES,
} from "../lib/products/bestsellers";
import { sortProducts, type ShopProduct } from "../lib/products/shop-filters";

let passed = 0;
let failed = 0;
function check(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
    console.log(`      expected: ${JSON.stringify(expected)}`);
    console.log(`      got:      ${JSON.stringify(actual)}`);
  }
}

const NOW = new Date("2026-11-25T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const order = (days: number, items: unknown) => ({ createdAt: daysAgo(days), items });

console.log("\nBestsellers from real sales\n");

console.log("  counting");
const sales = tallySales(
  [
    order(1, [
      { slug: "concha-vanilla", quantity: 6 },
      { slug: "chocoflan", quantity: 1 },
    ]),
    order(10, [{ slug: "concha-vanilla", quantity: 4 }]),
    order(40, [{ slug: "bolillo", quantity: 2 }]),
  ],
  NOW
);
check("units add up across orders", sales["concha-vanilla"], 10);
check("a single line counts too", sales["chocoflan"], 1);
check("something nobody bought is simply absent", sales["lemon-loaf"], undefined);
check("...and reads as zero", unitsSold(sales, "lemon-loaf"), 0);

console.log("\n  the window");
check("the window is three months", SALES_WINDOW_DAYS, 90);
const windowed = tallySales(
  [order(5, [{ slug: "a", quantity: 1 }]), order(200, [{ slug: "b", quantity: 99 }])],
  NOW
);
check("a recent sale counts", windowed["a"], 1);
// A bestseller is a present tense. Last winter's hit is not today's.
check("a sale from last year does not", windowed["b"], undefined);
check(
  "the edge of the window is included",
  tallySales([order(89, [{ slug: "edge", quantity: 1 }])], NOW)["edge"],
  1
);

console.log("\n  which orders count");
// A cancelled order is not a sale. The shop page filters on these, so the
// list must not quietly grow a status that never happened.
check("cancelled is not in the counted list", COUNTED_STATUSES.includes("CANCELLED" as never), false);
check("pending is not either", COUNTED_STATUSES.includes("PENDING" as never), false);
check("completed is", COUNTED_STATUSES.includes("COMPLETED"), true);
check("confirmed is, so today's orders count", COUNTED_STATUSES.includes("CONFIRMED"), true);

console.log("\n  a malformed order must not break the shop");
// `items` is a Json column. It has held whatever past versions of the
// checkout wrote, and one bad row must not take the sorting down.
const messy = tallySales(
  [
    order(1, null),
    order(1, "not an array"),
    order(1, [null, 42, "x"]),
    order(1, [{ quantity: 3 }]),
    order(1, [{ slug: "  " }]),
    order(1, [{ slug: "ok", quantity: -5 }]),
    order(1, [{ slug: "ok", quantity: 1e9 }]),
    order(1, [{ slug: "ok" }]),
    order(1, [{ slug: "good", quantity: 2 }]),
  ],
  NOW
);
check("the good line still counts", messy["good"], 2);
check("a line with no quantity counts as one", messy["ok"] >= 1, true);
check("a negative quantity adds nothing", messy["ok"], 1001);
check("a line with no slug is skipped", messy[""], undefined);
check("a blank slug is skipped too", messy["  "], undefined);
check("an order with no date is skipped", tallySales([{ createdAt: undefined as any, items: [{ slug: "x", quantity: 1 }] }], NOW), {});

console.log("\n  how the shop sorts with it");
const P = (over: Partial<ShopProduct> & { _id: string; name: string; price: number }): ShopProduct => ({
  displayOrder: 50,
  ...over,
});
const tagged = P({ _id: "t", name: "Tagged but unsold", price: 10, slug: "tagged", tag: "BESTSELLER", displayOrder: 1 });
const real = P({ _id: "r", name: "Actually sells", price: 5, slug: "concha-vanilla", displayOrder: 9 });
const quiet = P({ _id: "q", name: "Sells a bit", price: 7, slug: "chocoflan", displayOrder: 2 });
const catalogue = [tagged, real, quiet];

check(
  "what sells most goes first, whatever the Studio says",
  sortProducts(catalogue, "featured", sales).map((p) => p._id),
  ["r", "q", "t"]
);
// The tag still earns its keep: it orders everything that has sold nothing.
check(
  "among products that sold nothing, the tag still decides",
  sortProducts([P({ _id: "x", name: "X", price: 1, slug: "x", displayOrder: 5 }), tagged], "featured", sales).map((p) => p._id),
  ["t", "x"]
);

console.log("\n  and when the orders cannot be read");
check("no data is recognised as no data", hasSalesData({}), false);
check("...as is a failed read", hasSalesData(null), false);
check("real data is recognised", hasSalesData(sales), true);
// This is the important one. A database outage must leave the shop
// looking exactly as it did before any of this existed.
check(
  "the shop falls back to the tag, not to id order",
  sortProducts(catalogue, "featured", null).map((p) => p._id),
  ["t", "q", "r"]
);
check(
  "...and an empty tally does the same",
  sortProducts(catalogue, "featured", {}).map((p) => p._id),
  ["t", "q", "r"]
);
check(
  "sales never disturb the other sorts",
  sortProducts(catalogue, "price-asc", sales).map((p) => p._id),
  ["r", "q", "t"]
);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
