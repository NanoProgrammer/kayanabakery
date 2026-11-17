/**
 * When an order can be collected.
 *
 *   npm run test:pickup-windows
 *
 * These hours lived in three places that had drifted apart, so the picker
 * could offer a time the server did not recognise. One source now, and
 * these tests are what pins it.
 */
import {
  PICKUP_WINDOWS,
  PICKUP_MIN_LEAD_HOURS,
  windowsForDate,
  windowLabel,
  offeredPickupWindows,
  effectivePickupLeadHours,
  findWindow,
  dayOfWeek,
  bakeryDay,
  bakeryHour,
  atBakeryHour,
} from "../lib/checkout/pickup-windows";

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
const starts = (d: string) => windowsForDate(d).map((w) => `${w.startHour}-${w.endHour}`);

console.log("\nPickup windows\n");

console.log("  the schedule Karyana asked for");
// Friday
check("Mon-Sat has three windows", starts("2026-11-20"), ["16-18", "18-20", "19-21"]);
check("Monday too", starts("2026-11-16"), ["16-18", "18-20", "19-21"]);
check("Saturday too", starts("2026-11-21"), ["16-18", "18-20", "19-21"]);
check("Sunday keeps its one afternoon window", starts("2026-11-22"), ["13-15"]);
check("Sunday is day 0", dayOfWeek("2026-11-22"), 0);
check("there are nineteen windows in a week", PICKUP_WINDOWS.length, 19);
check("a nonsense date has none", windowsForDate("not-a-date"), []);

console.log("\n  how they read");
check("the afternoon one", windowLabel({ dayOfWeek: 5, startHour: 16, endHour: 18 }), "4:00 PM – 6:00 PM");
check("the first evening one", windowLabel({ dayOfWeek: 5, startHour: 18, endHour: 20 }), "6:00 PM – 8:00 PM");
check("the late one", windowLabel({ dayOfWeek: 5, startHour: 19, endHour: 21 }), "7:00 PM – 9:00 PM");
check("Sunday's", windowLabel({ dayOfWeek: 0, startHour: 13, endHour: 15 }), "1:00 PM – 3:00 PM");

console.log("\n  the eight-hour floor");
check("eight hours", PICKUP_MIN_LEAD_HOURS, 8);
check("an order with no lead time still waits eight", effectivePickupLeadHours(0), 8);
check("...and a four-hour item still waits eight", effectivePickupLeadHours(4), 8);
check("a longer item wins", effectivePickupLeadHours(48), 48);
check("a negative one is ignored", effectivePickupLeadHours(-5), 8);
check("NaN is ignored", effectivePickupLeadHours(NaN), 8);

console.log("\n  what is offered, and when");
// Friday 20 Nov 2026, 1 PM local (MST, UTC-7 → 20:00 UTC).
const fridayOnePm = new Date("2026-11-20T20:00:00Z");
check("it is 1 PM Friday", [bakeryDay(fridayOnePm), bakeryHour(fridayOnePm)], ["2026-11-20", 13]);
const offered = offeredPickupWindows({ now: fridayOnePm, days: 2 });
// 1 PM + 8 hours = 9 PM, so nothing on Friday: its last window opens at 7.
check("nothing is offered the same day", offered.filter((w) => w.date === "2026-11-20"), []);
check("Saturday is the first day offered", offered[0].date, "2026-11-21");
check("...from its first window", offered[0].label, "4:00 PM – 6:00 PM");
check(
  "Saturday offers all three",
  offered.filter((w) => w.date === "2026-11-21").map((w) => w.label),
  ["4:00 PM – 6:00 PM", "6:00 PM – 8:00 PM", "7:00 PM – 9:00 PM"]
);
check("they come back soonest first", offered.every((w, i, a) => i === 0 || w.opensAt >= a[i - 1].opensAt), true);

console.log("\n  the floor is a floor, not a guess");
// 8 AM Friday + 8 hours = 4 PM, exactly when the first window opens.
const fridayEightAm = new Date("2026-11-20T15:00:00Z");
check("8 AM reaches the same day's 4 PM window exactly", offeredPickupWindows({ now: fridayEightAm, days: 0 })[0]?.label, "4:00 PM – 6:00 PM");
// One minute later it does not.
const fridayEightOne = new Date("2026-11-20T15:01:00Z");
check("one minute later it does not", offeredPickupWindows({ now: fridayEightOne, days: 0 })[0]?.label, "6:00 PM – 8:00 PM");
// A cake needing 48 hours pushes past the floor.
check(
  "a 48-hour item pushes two days out",
  offeredPickupWindows({ now: fridayOnePm, itemLeadHours: 48, days: 4 })[0].date,
  "2026-11-22"
);

console.log("\n  the window the browser sends is checked, not trusted");
check("a real Friday window is found", findWindow("2026-11-20", "4:00 PM – 6:00 PM")?.startHour, 16);
check("the late one too", findWindow("2026-11-20", "7:00 PM – 9:00 PM")?.startHour, 19);
check("a hyphen instead of a dash still matches", findWindow("2026-11-20", "4:00 PM - 6:00 PM")?.startHour, 16);
check("extra spaces still match", findWindow("2026-11-20", "4:00 PM  –  6:00 PM")?.startHour, 16);
// Sunday has no evening window; a request claiming one is a forgery.
check("Sunday has no 7-9 PM window", findWindow("2026-11-22", "7:00 PM – 9:00 PM"), null);
check("an invented window is refused", findWindow("2026-11-20", "11:00 PM – 1:00 AM"), null);
check("an empty label is refused", findWindow("2026-11-20", ""), null);
check("a missing label is refused", findWindow("2026-11-20", null), null);

console.log("\n  Alberta's clock changes");
check("a winter 4 PM is 23:00 UTC", atBakeryHour("2026-01-15", 16).toISOString(), "2026-01-15T23:00:00.000Z");
check("a summer 4 PM is 22:00 UTC", atBakeryHour("2026-07-15", 16).toISOString(), "2026-07-15T22:00:00.000Z");
check("the 7 PM window still opens at 7 in summer", bakeryHour(atBakeryHour("2026-07-15", 19)), 19);
check("...and in winter", bakeryHour(atBakeryHour("2026-01-15", 19)), 19);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
