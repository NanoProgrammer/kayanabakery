/**
 * Refusing an order the kitchen cannot make in time.
 *
 *   npm run test:lead-time
 *
 * Written from a real order: a 4:00–6:00 PM pickup accepted on the same day
 * for items needing hours of notice. The first test below is that order.
 */
import {
  pickupWindowFor,
  checkPickupLeadTime,
  checkDeliveryLeadTime,
  earliestHandover,
  firstWorkableDate,
  leadTimeMessage,
  bakeryDay,
  bakeryHour,
  atBakeryHour,
  dayOfWeek,
} from "../lib/checkout/lead-time";

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

console.log("\nProduction time on pickups\n");

console.log("  the order that got through");
// Friday 13 Nov 2026. Ordered at 1 PM local (20:00 UTC, MST) for the
// 4–6 PM window, with items needing 4 hours. The old check compared against
// the window's END (6 PM) and let it pass; it opens at 4.
const fridayOnePm = new Date("2026-11-13T20:00:00Z");
check("it is 1 PM in Edmonton", bakeryHour(fridayOnePm), 13);
check("and it is the 13th", bakeryDay(fridayOnePm), "2026-11-13");
check(
  "a same-day 4 PM pickup with 4h notice is REFUSED",
  checkPickupLeadTime({ dateStr: "2026-11-13", leadHours: 4, now: fridayOnePm }).ok,
  false
);
check(
  "...and the next day is offered",
  (checkPickupLeadTime({ dateStr: "2026-11-13", leadHours: 4, now: fridayOnePm }) as any).earliestDate,
  "2026-11-14"
);

console.log("\n  measured from when the window OPENS");
// 9 AM with 4 hours' notice: earliest 1 PM, window opens at 4 PM. Fine.
const nineAm = new Date("2026-11-13T16:00:00Z");
check("ordering at 9 AM with 4h notice is fine", checkPickupLeadTime({ dateStr: "2026-11-13", leadHours: 4, now: nineAm }).ok, true);
// Noon with 4 hours: earliest 4 PM, window opens at 4 PM exactly.
const noon = new Date("2026-11-13T19:00:00Z");
check("exactly on the boundary is allowed", checkPickupLeadTime({ dateStr: "2026-11-13", leadHours: 4, now: noon }).ok, true);
// One minute later and it is not.
const noonOne = new Date("2026-11-13T19:01:00Z");
check("one minute past it is not", checkPickupLeadTime({ dateStr: "2026-11-13", leadHours: 4, now: noonOne }).ok, false);

console.log("\n  the windows themselves");
check("a Friday opens at 4 PM", pickupWindowFor("2026-11-13"), { startHour: 16, endHour: 18 });
check("a Sunday opens at 1 PM", pickupWindowFor("2026-11-15"), { startHour: 13, endHour: 15 });
check("Sunday is day 0", dayOfWeek("2026-11-15"), 0);
check("Friday is day 5", dayOfWeek("2026-11-13"), 5);
check("a nonsense date has no window", pickupWindowFor("not-a-date"), null);

console.log("\n  a Sunday pickup, which opens three hours earlier");
const satNight = new Date("2026-11-15T03:00:00Z"); // 8 PM Saturday local
check("it is Saturday evening", bakeryDay(satNight), "2026-11-14");
check(
  "a Sunday 1 PM pickup with 24h notice is refused",
  checkPickupLeadTime({ dateStr: "2026-11-15", leadHours: 24, now: satNight }).ok,
  false
);
check(
  "...with 16h it is fine",
  checkPickupLeadTime({ dateStr: "2026-11-15", leadHours: 16, now: satNight }).ok,
  true
);

console.log("\n  no notice needed");
check("zero lead time always passes", checkPickupLeadTime({ dateStr: "2026-11-13", leadHours: 0, now: fridayOnePm }).ok, true);
check("a negative one passes too", checkPickupLeadTime({ dateStr: "2026-11-13", leadHours: -5, now: fridayOnePm }).ok, true);
// A malformed date must be refused, not waved through.
check("a malformed date is refused", checkPickupLeadTime({ dateStr: "13/11/2026", leadHours: 0, now: fridayOnePm }).ok, false);
check("...with a reason", (checkPickupLeadTime({ dateStr: "", leadHours: 4, now: fridayOnePm }) as any).reason, "bad_date");

console.log("\n  long lead times");
check(
  "48 hours pushes past tomorrow",
  (checkPickupLeadTime({ dateStr: "2026-11-14", leadHours: 48, now: fridayOnePm }) as any).earliestDate,
  "2026-11-15"
);
check(
  "a week out is accepted",
  checkPickupLeadTime({ dateStr: "2026-11-20", leadHours: 48, now: fridayOnePm }).ok,
  true
);
check("the earliest handover is now plus the notice", earliestHandover(fridayOnePm, 4).toISOString(), "2026-11-14T00:00:00.000Z");

console.log("\n  delivery slots carry their own time");
check(
  "a slot before the notice is refused",
  checkDeliveryLeadTime({ slotStart: new Date("2026-11-13T23:00:00Z"), leadHours: 4, now: fridayOnePm }).ok,
  false
);
check(
  "a slot after it is fine",
  checkDeliveryLeadTime({ slotStart: new Date("2026-11-14T02:00:00Z"), leadHours: 4, now: fridayOnePm }).ok,
  true
);
check(
  "with no notice any slot is fine",
  checkDeliveryLeadTime({ slotStart: new Date("2026-11-13T14:00:00Z"), leadHours: 0, now: fridayOnePm }).ok,
  true
);

console.log("\n  Alberta's clock changes");
// A hard-coded -07:00 would put every summer window an hour out.
check("a winter 4 PM is 23:00 UTC", atBakeryHour("2026-01-15", 16).toISOString(), "2026-01-15T23:00:00.000Z");
check("a summer 4 PM is 22:00 UTC", atBakeryHour("2026-07-15", 16).toISOString(), "2026-07-15T22:00:00.000Z");
check("the window still opens at 4 in summer", bakeryHour(atBakeryHour("2026-07-15", 16)), 16);
check("the day is the day asked for", bakeryDay(atBakeryHour("2026-07-15", 16)), "2026-07-15");

console.log("\n  what the customer is told");
const refused = checkPickupLeadTime({ dateStr: "2026-11-13", leadHours: 4, now: fridayOnePm });
check(
  "it names the hours and the first day that works",
  leadTimeMessage(refused, "en"),
  "Your order needs 4 hours to prepare. The first available day is 2026-11-14."
);
check(
  "in Spanish",
  leadTimeMessage(refused, "es"),
  "Tu pedido necesita 4 horas de preparación. El primer día disponible es 2026-11-14."
);
check(
  "a whole day reads as a day, not 24 hours",
  leadTimeMessage(checkPickupLeadTime({ dateStr: "2026-11-13", leadHours: 24, now: fridayOnePm }), "en"),
  "Your order needs 1 day to prepare. The first available day is 2026-11-14."
);
check("an allowed order says nothing", leadTimeMessage({ ok: true }, "en"), null);

console.log("\n  finding the first day that works");
check("from a Friday afternoon, Saturday", firstWorkableDate(new Date("2026-11-13T23:30:00Z")), "2026-11-14");
check("from a Saturday night, Sunday", firstWorkableDate(new Date("2026-11-15T04:00:00Z")), "2026-11-15");

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
