/**
 * What the checkout is actually offering while evenings-only is on.
 *
 * Pickup and delivery are restricted to 6 PM onwards for now. The two are
 * handled differently and the difference matters: every pickup window started
 * before 6 PM, so filtering them would have left no pickup times at all and
 * the checkout would refuse every pickup order.
 *
 *   npm run test:schedule
 */
import { PICKUP_WINDOWS, DELIVERY_WINDOWS } from "../lib/checkout/schedule";

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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

console.log("\nWhat the checkout offers\n");

console.log("1. Pickup\n");

check(
  "nothing starts before 6 PM",
  PICKUP_WINDOWS.filter((w) => w.startHour < 18).length,
  0
);
check(
  "and pickup is still possible every day it was before",
  PICKUP_WINDOWS.length,
  7
);
for (const w of PICKUP_WINDOWS) {
  check(`${DAYS[w.dayOfWeek]}: ${w.startHour}:00–${w.endHour}:00`, w.startHour, 18);
}

console.log("\n2. Delivery\n");

check(
  "nothing starts before 6 PM",
  DELIVERY_WINDOWS.filter((w) => w.startHour < 18).length,
  0
);
check(
  "the daytime priority slots are gone",
  DELIVERY_WINDOWS.filter((w) => w.isPriority).length,
  0
);
check("the evening slots remain", DELIVERY_WINDOWS.length, 10);

const byDay = new Map<number, string[]>();
for (const w of DELIVERY_WINDOWS) {
  if (!byDay.has(w.dayOfWeek)) byDay.set(w.dayOfWeek, []);
  byDay.get(w.dayOfWeek)!.push(w.label);
}
for (const day of [...byDay.keys()].sort()) {
  console.log(`      ${DAYS[day]}: ${byDay.get(day)!.join(", ")}`);
}
check(
  "Sunday delivery is withdrawn with the rest of the afternoon",
  byDay.has(0),
  false
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
