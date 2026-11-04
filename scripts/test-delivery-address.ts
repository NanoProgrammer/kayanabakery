/**
 * The address an order was delivered to, kept as a copy.
 *
 *   npm run test:delivery-address
 *
 * Without the copy, editing a saved address rewrote it on every past order
 * and deleting one blanked it — which is why customers could not be allowed
 * to tidy up their old addresses in the first place.
 */
import {
  snapshotAddress,
  orderDeliveryAddress,
  formatDeliveryAddress,
  formatDeliveryAddressLines,
} from "../lib/orders/delivery-address";

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

const oldHome = {
  street: "438 24 Ave NE",
  city: "Calgary",
  province: "AB",
  postalCode: "T2E 1X1",
};
const newHome = {
  street: "77 Panatella Blvd NW",
  city: "Calgary",
  province: "AB",
  postalCode: "T3K 0J5",
};

console.log("\nThe address an order went to\n");

console.log("  the copy wins over the saved address");
check(
  "an order keeps where it was actually delivered",
  orderDeliveryAddress({ deliveryAddress: oldHome, address: newHome })?.street,
  "438 24 Ave NE"
);
check(
  "editing the saved address does not rewrite history",
  formatDeliveryAddress(orderDeliveryAddress({ deliveryAddress: oldHome, address: newHome })),
  "438 24 Ave NE, Calgary, AB T2E 1X1"
);
check(
  "deleting the saved address does not blank it",
  orderDeliveryAddress({ deliveryAddress: oldHome, address: null })?.street,
  "438 24 Ave NE"
);

console.log("\n  orders placed before the copy existed");
check(
  "fall back to the saved address",
  orderDeliveryAddress({ address: oldHome })?.street,
  "438 24 Ave NE"
);
check("a pickup order has no address at all", orderDeliveryAddress({ address: null }), null);
check("neither does an order with nothing on it", orderDeliveryAddress({}), null);
check("nor does a missing order", orderDeliveryAddress(null), null);

console.log("\n  the stored copy is JSON, so it is checked, not trusted");
check("a string falls back to the relation", orderDeliveryAddress({ deliveryAddress: "nope", address: oldHome })?.street, "438 24 Ave NE");
check("an array does too", orderDeliveryAddress({ deliveryAddress: [], address: oldHome })?.street, "438 24 Ave NE");
check("so does an object with no street", orderDeliveryAddress({ deliveryAddress: { city: "Calgary" }, address: oldHome })?.street, "438 24 Ave NE");
check("null falls back", orderDeliveryAddress({ deliveryAddress: null, address: oldHome })?.street, "438 24 Ave NE");
check(
  "a copy with a street but nothing else is still usable",
  orderDeliveryAddress({ deliveryAddress: { street: "12 Main St" } }),
  { street: "12 Main St", city: "", province: "", postalCode: "", buzzer: null, notes: null }
);

console.log("\n  making the copy");
check("an address with no street is not worth copying", snapshotAddress({ city: "Calgary" }), null);
check("nor is nothing", snapshotAddress(null), null);
check(
  "the buzzer and the driver's notes are kept — the driver needs them",
  snapshotAddress({ ...oldHome, buzzer: "304", notes: "Gate code 1234" }),
  { ...oldHome, buzzer: "304", notes: "Gate code 1234" }
);

console.log("\n  how it reads");
check("one line", formatDeliveryAddress(snapshotAddress(oldHome)), "438 24 Ave NE, Calgary, AB T2E 1X1");
check("nothing to show is an empty string, not 'null'", formatDeliveryAddress(null), "");
check(
  "missing parts are dropped, not printed as gaps",
  formatDeliveryAddress(snapshotAddress({ street: "12 Main St" })),
  "12 Main St"
);
check(
  "a missing province does not leave a stray comma",
  formatDeliveryAddress(snapshotAddress({ street: "12 Main St", city: "Calgary", postalCode: "T2E 1X1" })),
  "12 Main St, Calgary T2E 1X1"
);
check(
  "several lines, for a slip",
  formatDeliveryAddressLines(snapshotAddress({ ...oldHome, buzzer: "304" })),
  ["438 24 Ave NE", "Calgary, AB T2E 1X1", "Buzzer: 304"]
);
check(
  "the driver's note is the last line",
  formatDeliveryAddressLines(snapshotAddress({ ...oldHome, notes: "Leave at the door" })),
  ["438 24 Ave NE", "Calgary, AB T2E 1X1", "Leave at the door"]
);
check("no address, no lines", formatDeliveryAddressLines(null), []);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
