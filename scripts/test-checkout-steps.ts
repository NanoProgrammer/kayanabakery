/**
 * The checkout in three steps.
 *
 *   npm run test:steps
 *
 * The rule that matters: a step the customer is waved through, followed by a
 * Pay button that refuses, is the same dead end as the old one-page form —
 * so these checks are the ones the Pay button uses too.
 */
import {
  detailsComplete,
  deliveryComplete,
  stepComplete,
  canAdvance,
  canJumpTo,
  firstIncompleteStep,
  stepTitle,
  whatIsMissing,
  type StepState,
} from "../lib/checkout/steps";

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

const base: StepState = {
  isSignedIn: true,
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  needsAccountPhone: false,
  accountPhone: "",
  fulfillment: "PICKUP",
  pickupDate: "2026-11-20",
  pickupTime: "18:00",
  deliverySlotId: null,
  hasDeliveryAddress: false,
};
const guest: StepState = {
  ...base,
  isSignedIn: false,
  guestName: "Carlos",
  guestEmail: "carlos@example.com",
  guestPhone: "5874291403",
};

console.log("\nThe checkout in three steps\n");

console.log("  step 1 — who the order is for");
check("a signed-in customer is done", detailsComplete(base), true);
check("a guest with all three fields is done", detailsComplete(guest), true);
check("...without a name is not", detailsComplete({ ...guest, guestName: "" }), false);
check("...without an email is not", detailsComplete({ ...guest, guestEmail: "" }), false);
check("...without a phone is not", detailsComplete({ ...guest, guestPhone: "" }), false);
// Spaces are not an answer.
check("whitespace is not a name", detailsComplete({ ...guest, guestName: "   " }), false);
check("an account with no phone on file needs one", detailsComplete({ ...base, needsAccountPhone: true }), false);
check("...and is done once it is given", detailsComplete({ ...base, needsAccountPhone: true, accountPhone: "5874291403" }), true);

console.log("\n  step 2 — when and where");
check("a pickup with a day and time is done", deliveryComplete(base), true);
check("...without a time is not", deliveryComplete({ ...base, pickupTime: "" }), false);
check("...without a day is not", deliveryComplete({ ...base, pickupDate: "" }), false);
const delivery: StepState = {
  ...base,
  fulfillment: "DELIVERY",
  deliverySlotId: "slot-1",
  hasDeliveryAddress: true,
};
check("a delivery with a slot and an address is done", deliveryComplete(delivery), true);
check("...without a slot is not", deliveryComplete({ ...delivery, deliverySlotId: null }), false);
check("...without an address is not", deliveryComplete({ ...delivery, hasDeliveryAddress: false }), false);
// A pickup date left behind from before switching to delivery must not count.
check(
  "a leftover pickup date does not satisfy a delivery",
  deliveryComplete({ ...delivery, hasDeliveryAddress: false, pickupDate: "2026-11-20", pickupTime: "18:00" }),
  false
);

console.log("\n  moving between steps");
check("step 1 can be left when it is done", canAdvance(1, base), true);
check("...and not before", canAdvance(1, { ...guest, guestEmail: "" }), false);
check("step 2 can be left when it is done", canAdvance(2, base), true);
check("going back is always allowed", canJumpTo(1, 3, { ...guest, guestEmail: "" }), true);
check("staying put is allowed", canJumpTo(2, 2, base), true);
// Otherwise the stepper's numbers are a way round the checks.
check("jumping forward over an unfinished step is not", canJumpTo(3, 1, { ...base, pickupTime: "" }), false);
check("jumping forward over finished ones is", canJumpTo(3, 1, base), true);
check(
  "jumping to 3 from 2 needs step 2 finished",
  canJumpTo(3, 2, { ...base, pickupTime: "" }),
  false
);

console.log("\n  where to send someone who presses Pay too early");
check("missing contact sends them to step 1", firstIncompleteStep({ ...guest, guestPhone: "" }), 1);
check("missing a slot sends them to step 2", firstIncompleteStep({ ...delivery, deliverySlotId: null }), 2);
// Step 1 first: it is the earlier of the two.
check(
  "both missing sends them to the first one",
  firstIncompleteStep({ ...guest, guestName: "", pickupTime: "" }),
  1
);
check("nothing missing sends them nowhere", firstIncompleteStep(base), null);
check("step 3 is reachable only when 1 and 2 are done", stepComplete(3, base), true);
check("...and not otherwise", stepComplete(3, { ...base, pickupTime: "" }), false);

console.log("\n  what the customer is told is missing");
check(
  "a guest is told which fields",
  whatIsMissing(1, { ...guest, guestName: "", guestPhone: "" }, "en"),
  "Missing: name, phone"
);
check(
  "in Spanish",
  whatIsMissing(1, { ...guest, guestEmail: "" }, "es"),
  "Falta: correo"
);
check(
  "a signed-in customer is told about the phone",
  whatIsMissing(1, { ...base, needsAccountPhone: true }, "en"),
  "Your phone number is missing"
);
check("a pickup with no time", whatIsMissing(2, { ...base, pickupTime: "" }, "en"), "Choose a pickup day and time");
check("a delivery with no slot", whatIsMissing(2, { ...delivery, deliverySlotId: null }, "en"), "Choose a delivery time");
check("a delivery with no address", whatIsMissing(2, { ...delivery, hasDeliveryAddress: false }, "en"), "A delivery address is missing");
check("nothing missing says nothing", whatIsMissing(1, base, "en"), null);
check("...on step 2 either", whatIsMissing(2, base, "en"), null);

console.log("\n  the names on the stepper");
check("1", stepTitle(1, "en"), "Your details");
check("2", stepTitle(2, "en"), "Delivery");
check("3", stepTitle(3, "en"), "Payment");
check("1 in Spanish", stepTitle(1, "es"), "Tus datos");
check("3 in Spanish", stepTitle(3, "es"), "Pago");

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
