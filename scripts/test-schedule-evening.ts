/**
 * What the checkout is actually offering for DELIVERY.
 *
 *   npm run test:schedule
 *
 * This file used to pin the temporary "6 PM onwards only" state. That has
 * been lifted: Karyana asked for Sunday 1–3 PM back on delivery, and the
 * evenings-only filter was what had withdrawn it — Sunday's only window is
 * an afternoon one, so filtering by start hour removed the whole day.
 *
 * PICKUP windows moved to lib/checkout/pickup-windows.ts, which is the one
 * source the picker, the server and the lead-time check all read; they are
 * tested by `npm run test:pickup-windows`.
 */
import { DELIVERY_WINDOWS } from "../lib/checkout/schedule";

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

const onDay = (dow: number) =>
  DELIVERY_WINDOWS.filter((w) => w.dayOfWeek === dow)
    .map((w) => w.label)
    .sort();

console.log("\nWhat the checkout offers for delivery\n");

console.log("  Sunday, which the evenings-only filter had withdrawn");
check("Sunday has a window again", onDay(0).length, 1);
check("...and it is the 1–3 PM one", onDay(0), ["1–3 PM"]);
check(
  "its capacity is the Sunday one, not a weekday's",
  DELIVERY_WINDOWS.find((w) => w.dayOfWeek === 0)?.capacity,
  10
);

console.log("\n  the rest of the week");
for (const dow of [2, 3, 4, 5, 6]) {
  check(`day ${dow} has its five windows`, onDay(dow).length, 5);
}
check(
  "Tuesday's windows",
  onDay(2),
  ["1–2 PM", "2–4 PM", "4–6 PM", "6–8 PM", "7–9 PM"]
);
// Monday has never had delivery.
check("Monday has none", onDay(1), []);

console.log("\n  the daytime slots are back, and they are the paid ones");
const daytime = DELIVERY_WINDOWS.filter((w) => w.startHour < 18);
check("there are daytime slots again", daytime.length > 0, true);
check(
  "every weekday daytime slot is marked priority",
  daytime.filter((w) => w.dayOfWeek !== 0).every((w) => w.isPriority === true),
  true
);
// Sunday's afternoon window is the normal Sunday service, not a paid
// priority slot — charging for it would be charging for the only Sunday
// delivery there is.
check(
  "Sunday's afternoon window is NOT a priority slot",
  DELIVERY_WINDOWS.find((w) => w.dayOfWeek === 0)?.isPriority ?? false,
  false
);
check(
  "every priority slot carries a fee for Básico",
  DELIVERY_WINDOWS.filter((w) => w.isPriority).every((w) => (w.feeCentsBasico ?? 0) > 0),
  true
);
check(
  "the evening slots carry no fee",
  DELIVERY_WINDOWS.filter((w) => w.startHour >= 18).every((w) => !w.isPriority),
  true
);

console.log("\n  nothing malformed");
check(
  "every window ends after it starts",
  DELIVERY_WINDOWS.every((w) => w.endHour > w.startHour),
  true
);
check(
  "every window has a capacity",
  DELIVERY_WINDOWS.every((w) => w.capacity > 0),
  true
);
check(
  "every window has a label",
  DELIVERY_WINDOWS.every((w) => !!w.label),
  true
);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
