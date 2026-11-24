/**
 * Products already on the shelf.
 *
 *   npm run test:ready-now
 *
 * Studio's "Stock quantity" box has never been read by anything. It now
 * means the product is baked and needs no notice — so these tests are about
 * one thing above all: not telling someone to come and collect bread that
 * is not there.
 */
import {
  isReadyNow,
  leadHoursFor,
  orderIsReadyNow,
  orderLeadHours,
} from "../lib/products/ready-now";

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

console.log("\nReady now\n");

console.log("  a number in the stock box means baked");
check("six on the shelf, one wanted", isReadyNow({ stockQuantity: 6, quantity: 1 }), true);
check("...and it needs no notice", leadHoursFor({ stockQuantity: 6, quantity: 1, leadTime: 12 }), 0);
check("an empty box is made to order", isReadyNow({ quantity: 1, leadTime: 12 }), false);
check("...and keeps its own lead time", leadHoursFor({ quantity: 1, leadTime: 12 }), 12);
check("zero in stock is not ready", isReadyNow({ stockQuantity: 0, quantity: 1 }), false);
check("null is not ready", isReadyNow({ stockQuantity: null, quantity: 1 }), false);
check("a negative count is not ready", isReadyNow({ stockQuantity: -3, quantity: 1 }), false);
check("NaN is not ready", isReadyNow({ stockQuantity: NaN, quantity: 1 }), false);

console.log("\n  asking for more than there are");
// Promising otherwise sends someone over for bread that does not exist.
check("three on the shelf, three wanted", isReadyNow({ stockQuantity: 3, quantity: 3 }), true);
check("three on the shelf, four wanted", isReadyNow({ stockQuantity: 3, quantity: 4 }), false);
check("...so the rest has to be baked", leadHoursFor({ stockQuantity: 3, quantity: 4, leadTime: 8 }), 8);
check("no quantity given counts as one", isReadyNow({ stockQuantity: 1 }), true);
check("a fractional quantity rounds down to one", isReadyNow({ stockQuantity: 1, quantity: 1.4 }), true);

console.log("\n  the basket leaves together");
const concha = { stockQuantity: 10, quantity: 2, leadTime: 4 };
const cake = { quantity: 1, leadTime: 24 };
check("all stocked, nothing to wait for", orderIsReadyNow([concha, { stockQuantity: 5, quantity: 1 }]), true);
check("...so no notice at all", orderLeadHours([concha, { stockQuantity: 5, quantity: 1 }]), 0);
// One unmade item sets the wait for everything: they go out in one handover.
check("one cake among stocked bread is not ready now", orderIsReadyNow([concha, cake]), false);
check("...and the order waits the cake's 24 hours", orderLeadHours([concha, cake]), 24);
check("the stocked bread does not shorten it", orderLeadHours([concha, cake]) === 24, true);
check("an empty basket is not 'ready now'", orderIsReadyNow([]), false);
check("...and needs no notice either", orderLeadHours([]), 0);
check(
  "two unmade items take the slower",
  orderLeadHours([{ quantity: 1, leadTime: 4 }, { quantity: 1, leadTime: 48 }]),
  48
);
check(
  "out of stock falls back to the lead time, not to zero",
  orderLeadHours([{ stockQuantity: 0, quantity: 1, leadTime: 6 }]),
  6
);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
