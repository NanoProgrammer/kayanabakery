/**
 * Who gets a weekly box, and what happens to it if nobody answers.
 *
 * Covers the two members the Tuesday reminder was silently dropping: the owner
 * herself, whose membership had gone PAST_DUE, and a brand-new Selecto member
 * who had not finished onboarding and so had no weekly mode. Neither got a
 * log, an email or an order, and nothing anywhere said why.
 *
 *   npm run test:weekly-box
 */
import { weeklyBoxPlan, defaultWeeklyMode } from "../lib/membership/weekly-eligibility";
import { weeklyDecision } from "../lib/membership/weekly-decision";
import { weekStartOf } from "../lib/membership/weekly";

let passed = 0;
let failed = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
    console.log(`      expected: ${JSON.stringify(expected)}`);
    console.log(`      got:      ${JSON.stringify(actual)}`);
  }
}

const WEEK = weekStartOf(new Date("2026-10-21T12:00:00"));
const NEXT_MONTH = new Date("2026-11-24T12:00:00Z");
const LAST_MONTH = new Date("2026-09-24T12:00:00Z");

const member = (over: Partial<Parameters<typeof weeklyBoxPlan>[0]> = {}) => ({
  tier: "SELECTO",
  status: "ACTIVE",
  endsAt: null,
  weeklyMode: "REPEAT_LAST" as const,
  weeklyFrequency: "WEEKLY" as const,
  weeklyAnchorAt: null,
  hasPreviousOrder: true,
  ...over,
});

console.log("\nWeekly box — who is included\n");

console.log("1. The two members who were being dropped\n");

check(
  "a brand-new Selecto member with no mode is included",
  weeklyBoxPlan(member({ weeklyMode: null, hasPreviousOrder: false }), WEEK),
  { include: true, mode: "CURATED", defaulted: true }
);
check(
  "with no order to repeat it goes to the bakery to fill, not to a card",
  defaultWeeklyMode(false),
  "CURATED"
);
check(
  "a member with no mode but a previous order repeats it",
  weeklyBoxPlan(member({ weeklyMode: null, hasPreviousOrder: true }), WEEK),
  { include: true, mode: "REPEAT_LAST", defaulted: true }
);
check(
  "a PAST_DUE member still paid through next month keeps their box",
  weeklyBoxPlan(member({ status: "PAST_DUE", endsAt: NEXT_MONTH }), WEEK),
  { include: true, mode: "REPEAT_LAST", defaulted: false }
);
check(
  "a cancelled member paid through next month keeps it too",
  weeklyBoxPlan(member({ status: "CANCELED", endsAt: NEXT_MONTH }), WEEK),
  { include: true, mode: "REPEAT_LAST", defaulted: false }
);

console.log("\n2. Still out, and the reason says so\n");

check(
  "a membership that has actually ended",
  weeklyBoxPlan(member({ status: "PAST_DUE", endsAt: LAST_MONTH }), WEEK),
  { include: false, reason: "membership is PAST_DUE" }
);
check(
  "a membership with no end date that is not active",
  weeklyBoxPlan(member({ status: "EXPIRED", endsAt: null }), WEEK),
  { include: false, reason: "membership is EXPIRED" }
);
check(
  "Artesano, which has no weekly box",
  weeklyBoxPlan(member({ tier: "ARTESANO" }), WEEK),
  { include: false, reason: "ARTESANO has no weekly box" }
);
check(
  "an every-4-weeks member on an off week",
  weeklyBoxPlan(
    member({
      weeklyFrequency: "EVERY_4_WEEKS",
      weeklyAnchorAt: new Date("2026-10-14T12:00:00"),
    }),
    WEEK
  ),
  { include: false, reason: "not due this week" }
);
check(
  "and included again on their own week",
  weeklyBoxPlan(
    member({
      weeklyFrequency: "EVERY_4_WEEKS",
      weeklyAnchorAt: new Date("2026-09-23T12:00:00"),
    }),
    WEEK
  ).include,
  true
);
check(
  "a member who chose MANUAL is still included — they get the email",
  weeklyBoxPlan(member({ weeklyMode: "MANUAL" }), WEEK),
  { include: true, mode: "MANUAL", defaulted: false }
);

console.log("\n3. What Thursday does when nobody answers\n");

const card = { autoDeliveryEnabled: true, hasCardOnFile: true };

check(
  "the new member's curated box goes to the bakery to prepare",
  weeklyDecision({ modeSnapshot: "CURATED", ...card }),
  { action: "queue-for-staff", reason: "curated box needs a human to fill it" }
);
check(
  "a repeat member's order is created and charged",
  weeklyDecision({ modeSnapshot: "REPEAT_LAST", ...card }),
  { action: "send" }
);
check(
  "MANUAL still needs an explicit yes",
  weeklyDecision({ modeSnapshot: "MANUAL", ...card }).action,
  "skip"
);
check(
  "a member who turned auto-delivery off is not charged",
  weeklyDecision({ modeSnapshot: "REPEAT_LAST", autoDeliveryEnabled: false, hasCardOnFile: true }).action,
  "skip"
);
check(
  "no card on file is recorded as a failure, not a silent skip",
  weeklyDecision({ modeSnapshot: "REPEAT_LAST", autoDeliveryEnabled: true, hasCardOnFile: false }),
  { action: "fail", reason: "No card on file" }
);

console.log("\n4. End to end: Karla Salazar, new Selecto, no mode, no history\n");

const karla = member({ weeklyMode: null, hasPreviousOrder: false });
const karlaPlan = weeklyBoxPlan(karla, WEEK);
check("she is included", karlaPlan.include, true);
check(
  "and the bakery is told to prepare her box",
  karlaPlan.include
    ? weeklyDecision({ modeSnapshot: karlaPlan.mode, ...card }).action
    : "never reached",
  "queue-for-staff"
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
