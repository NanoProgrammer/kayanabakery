/**
 * The automatic order-status rules.
 *
 * These decide when a customer is told their order is ready, so getting them
 * wrong means someone drives to the bakery for bread that isn't baked. That
 * happened: pickup orders were advanced to READY an hour before the window,
 * which was a guess about the kitchen rather than something anyone knew.
 *
 *   npm run test:status
 */
import { targetStatus, nextStatus } from "../lib/orders/auto-status";

let passed = 0;
let failed = 0;

function check(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
    console.log(`      expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// A 4:00 PM – 6:00 PM Calgary window on Oct 7 starts at 22:00Z.
const PICKUP_DATE = new Date("2026-10-07T12:00:00Z");
const WINDOW_START = new Date("2026-10-07T22:00:00Z");
const PLACED = new Date("2026-10-07T14:00:00Z");

const pickup = (status = "CONFIRMED") => ({
  status,
  fulfillmentType: "PICKUP",
  createdAt: PLACED,
  pickupDate: PICKUP_DATE,
  pickupTime: "4:00 PM – 6:00 PM",
  deliverySlot: null,
});

const delivery = (status = "CONFIRMED") => ({
  status,
  fulfillmentType: "DELIVERY",
  createdAt: PLACED,
  pickupDate: null,
  pickupTime: null,
  deliverySlot: { startTime: WINDOW_START },
});

const at = (iso: string) => new Date(iso);

console.log("\nOrder status automation");
console.log("=".repeat(62));

console.log("\nPickup — never claims to be ready on its own:\n");
check("two hours before the window", targetStatus(pickup(), at("2026-10-07T20:30:00Z")), "IN_PROGRESS");
check("one hour before — the old false 'ready'", targetStatus(pickup(), at("2026-10-07T21:10:00Z")), "IN_PROGRESS");
check("inside the window", targetStatus(pickup(), at("2026-10-07T22:30:00Z")), "IN_PROGRESS");
check("never out for delivery", targetStatus(pickup(), at("2026-10-07T22:30:00Z")) !== "OUT_FOR_DELIVERY", true);
check("still closes out at 11 PM", targetStatus(pickup(), at("2026-10-08T05:30:00Z")), "COMPLETED");

console.log("\nDelivery — unchanged, the courier's times are known:\n");
check("two hours before", targetStatus(delivery(), at("2026-10-07T20:30:00Z")), "IN_PROGRESS");
check("one hour before → ready", targetStatus(delivery(), at("2026-10-07T21:10:00Z")), "READY");
check("fifteen minutes in → on the way", targetStatus(delivery(), at("2026-10-07T22:30:00Z")), "OUT_FOR_DELIVERY");
check("closes out at 11 PM", targetStatus(delivery(), at("2026-10-08T05:30:00Z")), "COMPLETED");

console.log("\nStatus only ever moves forward:\n");
check(
  "a pickup already marked ready by hand is not pulled back",
  nextStatus(pickup("READY"), at("2026-10-07T22:30:00Z")),
  null
);
check(
  "an order already completed stays completed",
  nextStatus(delivery("COMPLETED"), at("2026-10-08T05:30:00Z")),
  null
);

console.log("\nNo schedule means no promises:\n");
check(
  "an order with no pickup date only reaches in-preparation",
  targetStatus(
    { ...pickup(), pickupDate: null, pickupTime: null },
    at("2026-10-08T05:30:00Z")
  ),
  "IN_PROGRESS"
);

console.log("\n" + "=".repeat(62));
console.log(`${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
