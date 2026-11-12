/**
 * When a cake can be handed over.
 *
 *   npm run test:cake-schedule
 *
 * Two-hourly from 11 AM with 8 PM the last, and the notice each customer
 * needs — a guest waits a flat 24 hours, a member waits what Karyana's table
 * says. The timezone handling is the part worth testing: Alberta changes
 * offset twice a year and a hard-coded -07:00 moves every slot by an hour
 * for half of it.
 */
import {
  CAKE_SLOT_HOURS,
  CAKE_LAST_HOUR,
  GUEST_CAKE_NOTICE_HOURS,
  noticeHoursFor,
  cakeSlots,
  atBakeryHour,
  bakeryDay,
  bakeryHour,
  formatSlotHour,
  membershipSaving,
} from "../lib/checkout/cake-schedule";

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

console.log("\nCake handover times\n");

console.log("  the schedule itself");
check("from 11 AM, every two hours, 8 PM last", CAKE_SLOT_HOURS, [11, 13, 15, 17, 19, 20]);
check("nothing after 8 PM", Math.max(...CAKE_SLOT_HOURS), CAKE_LAST_HOUR);
check("nothing before 11 AM", Math.min(...CAKE_SLOT_HOURS), 11);
check("11 AM reads as 11:00 AM", formatSlotHour(11, "en"), "11:00 AM");
check("20 reads as 8:00 PM", formatSlotHour(20, "en"), "8:00 PM");
check("noon is 12 PM, not 0 PM", formatSlotHour(12, "en"), "12:00 PM");

console.log("\n  how much notice is needed");
const mango = ["3 Leches Mango"];
const chocoflan = ["Chocoflán"];
check("a guest waits 24h for a mango", noticeHoursFor(mango, "GUEST", false), 24);
check("a Básico waits 12", noticeHoursFor(mango, "BASICO", true), 12);
check("an Artesano waits 4", noticeHoursFor(mango, "ARTESANO", true), 4);
check("a Selecto waits 2", noticeHoursFor(mango, "SELECTO", true), 2);
// The guest rule can only ever add time, never shorten it.
check("a guest still waits 48h for a chocoflán, not 24", noticeHoursFor(chocoflan, "GUEST", false), 48);
check("a Selecto waits 6 for a chocoflán", noticeHoursFor(chocoflan, "SELECTO", true), 6);
check(
  "a basket takes the slowest cake in it",
  noticeHoursFor(["3 Leches Mango", "Chocoflán"], "SELECTO", true),
  6
);
check("something that is not a cake needs no notice", noticeHoursFor(["Concha"], "SELECTO", true), 0);
check("an empty order needs none", noticeHoursFor([], "SELECTO", true), 0);
// The 24h guest wait is a rule about cakes. Applied to any order it would
// make a bag of conchas wait a day because the customer has no account.
check("a guest buying only conchas waits for nothing", noticeHoursFor(["Concha"], "GUEST", false), 0);
check("...nor on an empty order", noticeHoursFor([], "GUEST", false), 0);
check("but one cake among conchas brings the wait back", noticeHoursFor(["Concha", "3 Leches Mango"], "GUEST", false), 24);
// Signed in but on the free tier is still a member for the table's purposes.
check("a signed-in Básico is not charged the guest wait", noticeHoursFor(mango, "BASICO", true), 12);

console.log("\n  the slots that come back");
const now = new Date("2026-11-12T18:00:00Z"); // 11:00 AM in Edmonton (MST, -7)
check("it is 11 AM in Edmonton", bakeryHour(now), 11);
check("and the 12th", bakeryDay(now), "2026-11-12");

const soon = cakeSlots({ now, noticeHours: 2, days: 1 });
check("nothing sooner than the notice allows", soon[0].hour, 13);
check("...on the same day", soon[0].day, "2026-11-12");
check("they come back soonest first", soon.map((s) => s.at.getTime()).every((t, i, a) => i === 0 || t >= a[i - 1]), true);
check(
  "the rest of today is offered",
  soon.filter((s) => s.day === "2026-11-12").map((s) => s.hour),
  [13, 15, 17, 19, 20]
);
check(
  "and all of tomorrow",
  soon.filter((s) => s.day === "2026-11-13").map((s) => s.hour),
  [11, 13, 15, 17, 19, 20]
);

const guest = cakeSlots({ now, noticeHours: 24, days: 2 });
check("a 24h notice pushes a guest to tomorrow", guest[0].day, "2026-11-13");
check("...starting at 11 AM", guest[0].hour, 11);
const long = cakeSlots({ now, noticeHours: 48, days: 3 });
check("a 48h notice pushes to the day after", long[0].day, "2026-11-14");
check("no notice offers the current hour", cakeSlots({ now, noticeHours: 0, days: 0 })[0].hour, 11);
check("a negative notice is treated as none", cakeSlots({ now, noticeHours: -5, days: 0 })[0].hour, 11);
check("every slot is at or after the notice", long.every((s) => s.at.getTime() >= now.getTime() + 48 * 3600_000), true);

console.log("\n  Alberta's clock changes");
// Winter: MST is UTC-7, so 11 AM local is 18:00 UTC.
check("a winter 11 AM is 18:00 UTC", atBakeryHour("2026-01-15", 11).toISOString(), "2026-01-15T18:00:00.000Z");
// Summer: MDT is UTC-6, so 11 AM local is 17:00 UTC. A hard-coded -07:00
// would put this an hour out for half the year.
check("a summer 11 AM is 17:00 UTC", atBakeryHour("2026-07-15", 11).toISOString(), "2026-07-15T17:00:00.000Z");
check("the 8 PM slot lands on 8 PM in summer", bakeryHour(atBakeryHour("2026-07-15", 20)), 20);
check("...and in winter", bakeryHour(atBakeryHour("2026-01-15", 20)), 20);
check("the day is the day asked for", bakeryDay(atBakeryHour("2026-07-15", 20)), "2026-07-15");
// The day the clocks go forward, 2 AM does not exist; 11 AM still does.
check("the spring-forward day still has an 11 AM", bakeryHour(atBakeryHour("2026-03-08", 11)), 11);

console.log("\n  what a membership would save them");
check(
  "a guest ordering a mango would save 22 hours as a Selecto",
  membershipSaving(mango, "SELECTO"),
  { guestHours: 24, memberHours: 2, hoursSaved: 22 }
);
check(
  "...and 42 on a chocoflán",
  membershipSaving(chocoflan, "SELECTO")?.hoursSaved,
  42
);
check("an Artesano saves 20 on a mango", membershipSaving(mango, "ARTESANO")?.hoursSaved, 20);
// Nothing to sell: do not show the line.
check("a cart with no cakes saves nothing", membershipSaving(["Concha"], "SELECTO"), null);
check("an empty cart saves nothing", membershipSaving([], "SELECTO"), null);
check("the guest wait is the flat 24 by default", GUEST_CAKE_NOTICE_HOURS, 24);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
