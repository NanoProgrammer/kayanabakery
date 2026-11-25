/**
 * Taking sold items off the shelf — Situación 13.
 *
 *   npm run test:stock
 *
 * The meeting asked to verify the inventory is discounted correctly.
 * It never was: nothing reduced stockQuantity, so after the six real
 * Saturday boxes were sold the seventh customer was still promised
 * same-day pickup. These guard the fix, in both directions — selling
 * too little oversells, and counting down something Karyana never
 * stocked turns "made to order" into "sold out".
 */
import { stockDecrements, clampedStock, needsClamp } from "../lib/products/stock";
import { isReadyNow } from "../lib/products/ready-now";

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

const box = { _id: "p-box", stockQuantity: 6 };
const concha = { _id: "p-concha", stockQuantity: 20 };
// No number in the stock box: made to order, not stock-managed.
const cake = { _id: "p-cake", stockQuantity: null };
const sold = { _id: "p-sold", stockQuantity: 0 };
const catalogue = [box, concha, cake, sold];

console.log("\nStock after a sale\n");

console.log("  what comes off the shelf");
check(
  "a box sold is a box gone",
  stockDecrements([{ productId: "p-box", quantity: 1 }], catalogue),
  [{ productId: "p-box", by: 1 }]
);
check(
  "three boxes, three off",
  stockDecrements([{ productId: "p-box", quantity: 3 }], catalogue),
  [{ productId: "p-box", by: 3 }]
);
check(
  "several products in one order",
  stockDecrements(
    [
      { productId: "p-box", quantity: 2 },
      { productId: "p-concha", quantity: 6 },
    ],
    catalogue
  ),
  [{ productId: "p-box", by: 2 }, { productId: "p-concha", by: 6 }]
);
// Two lines of the same product — different options, say — must add up,
// not have one patch overwrite the other.
check(
  "two lines of the same product add up",
  stockDecrements(
    [
      { productId: "p-box", quantity: 2 },
      { productId: "p-box", quantity: 1 },
    ],
    catalogue
  ),
  [{ productId: "p-box", by: 3 }]
);

console.log("\n  what is left alone");
// A product with no number is made to order. Writing a count onto it
// would turn that into "none left" the moment somebody bought one.
check("a made-to-order cake is not counted down", stockDecrements([{ productId: "p-cake", quantity: 1 }], catalogue), []);
check("a product not in the catalogue is ignored", stockDecrements([{ productId: "ghost", quantity: 1 }], catalogue), []);
check("a line with no product is ignored", stockDecrements([{ quantity: 2 }], catalogue), []);
check("an empty order takes nothing off", stockDecrements([], catalogue), []);
// Zero IS managed: it means none on the shelf, and it should keep
// counting rather than quietly stop.
check(
  "a product already at zero is still managed",
  stockDecrements([{ productId: "p-sold", quantity: 1 }], catalogue),
  [{ productId: "p-sold", by: 1 }]
);

console.log("\n  odd quantities");
check("a missing quantity is one, not none", stockDecrements([{ productId: "p-box" }], catalogue), [{ productId: "p-box", by: 1 }]);
check("zero takes nothing", stockDecrements([{ productId: "p-box", quantity: 0 }], catalogue), []);
check("a negative cannot put stock back", stockDecrements([{ productId: "p-box", quantity: -3 }], catalogue), []);
check("a fraction rounds down", stockDecrements([{ productId: "p-box", quantity: 2.7 }], catalogue), [{ productId: "p-box", by: 2 }]);
check("nonsense is one", stockDecrements([{ productId: "p-box", quantity: NaN }], catalogue), [{ productId: "p-box", by: 1 }]);

console.log("\n  the order of the patches");
// Sorted, so a failure is reproducible and a transaction is not built in
// a different order every time.
check(
  "always the same order",
  stockDecrements([{ productId: "p-concha", quantity: 1 }, { productId: "p-box", quantity: 1 }], catalogue).map((d) => d.productId),
  ["p-box", "p-concha"]
);

console.log("\n  tidying up afterwards");
// An atomic decrement can overshoot. Behaviour is unaffected — anything
// at or below zero reads the same — but a negative in the Studio reads
// as a bug to whoever sees it.
check("a negative needs tidying", needsClamp(-2), true);
check("zero does not", needsClamp(0), false);
check("a healthy count does not", needsClamp(4), false);
check("a blank does not", needsClamp(null), false);
check("a negative becomes zero", clampedStock(-2), 0);
check("a healthy count is left alone", clampedStock(4), 4);
check("a blank reads as none", clampedStock(null), 0);

console.log("\n  and the promise it protects");
// This is the whole point: once the shelf is empty, the checkout must
// stop saying "ready today".
check("six on the shelf, one wanted: ready now", isReadyNow({ stockQuantity: 6, quantity: 1 }), true);
check("sold down to zero: not ready now", isReadyNow({ stockQuantity: 0, quantity: 1 }), false);
check("oversold below zero: still not ready now", isReadyNow({ stockQuantity: -1, quantity: 1 }), false);
check("two left, three wanted: not ready now", isReadyNow({ stockQuantity: 2, quantity: 3 }), false);
// Before the fix the count never moved, so this was the bug: six sold
// and the seventh customer still told it was waiting for them.
const startingStock = 6;
const afterSixSold = startingStock - stockDecrements([{ productId: "p-box", quantity: 6 }], catalogue)[0].by;
check("after six are sold the shelf is empty", afterSixSold, 0);
check("...and the seventh customer is not promised today", isReadyNow({ stockQuantity: afterSixSold, quantity: 1 }), false);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
