/**
 * What a membership fee buys, and how a weekly box gets paid for.
 *
 * The fee used to do two unrelated things at once: turn into points at face
 * value AND fund a box that was charged to the card in full every week. The
 * member paid twice for the same bread and the points were decoration. Now
 * they choose, and the box spends the balance before it touches the card.
 *
 *   npm run test:benefit
 */
import { pointsForFee, pointsToSpend, wantsWeeklyBox } from "../lib/membership/benefit";
import { weeklyBoxPlan } from "../lib/membership/weekly-eligibility";
import { weekStartOf } from "../lib/membership/weekly";
import { computePricing } from "../lib/checkout/pricing";

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

console.log("\nMembership benefit\n");

console.log("1. The fee becomes points at face value\n");

check("Selecto, $30", pointsForFee(3000), 3000);
check("Legendario, $50", pointsForFee(5000), 5000);
check("a free trial earns nothing", pointsForFee(0), 0);
check("a negative never mints points", pointsForFee(-100), 0);

console.log("\n2. How many points a box may spend\n");

check("a healthy balance covers the whole box", pointsToSpend(2500, 3000), 2500);
check("a thin balance covers what it can", pointsToSpend(2500, 800), 800);
check("an empty balance spends nothing", pointsToSpend(2500, 0), 0);
check("a $25 box can never eat $30 of balance", pointsToSpend(2500, 3000) <= 2500, true);
check("a free box spends nothing", pointsToSpend(0, 3000), 0);
check("fractions of a point are not spent", pointsToSpend(2500, 800.9), 800);
check("a negative balance is not a credit", pointsToSpend(2500, -500), 0);

console.log("\n3. What the member actually pays\n");

// A box of six conchas at $6, picked up.
const items = [{ productId: "p1", price: 600, quantity: 6 }];
const price = (points: number) =>
  computePricing({
    items,
    fulfillmentType: "PICKUP",
    tier: "SELECTO",
    isSouthEastCalgary: false,
    hasUsedFirstFreeDelivery: true,
    isGuest: false,
    ...(points > 0 ? { pointsToRedeem: points } : {}),
  });

const full = price(0);
check("the box is worth $36 before anything", full.subtotalCents, 3600);

const withBalance = price(pointsToSpend(full.subtotalCents, 3000));
check("3000 points take $30 off", withBalance.pointsDiscountCents, 3000);
check(
  "so the card is charged the rest, not the whole box",
  withBalance.totalCents < full.totalCents,
  true
);
check(
  "and the points come off BEFORE tax, which is the point of pricing it here",
  withBalance.gstCents < full.gstCents,
  true
);

const covered = price(pointsToSpend(full.subtotalCents, 10000));
check("a big balance covers the box entirely", covered.totalCents, 0);
check("and nothing is charged that week", covered.totalCents === 0, true);

console.log("\n4. The choice decides whether a box is made at all\n");

const WEEK = weekStartOf(new Date("2026-10-21T12:00:00"));
const member = (benefitMode: string | null) => ({
  tier: "SELECTO",
  status: "ACTIVE",
  endsAt: null,
  benefitMode,
  weeklyMode: "REPEAT_LAST" as const,
  weeklyFrequency: "WEEKLY" as const,
  weeklyAnchorAt: null,
  hasPreviousOrder: true,
});

check(
  "points-only gets no box and no Tuesday email",
  weeklyBoxPlan(member("POINTS"), WEEK),
  { include: false, reason: "chose points instead of a weekly box" }
);
check("the box choice still gets one", weeklyBoxPlan(member("WEEKLY_BOX"), WEEK).include, true);
check(
  "and so does every member who predates the choice",
  weeklyBoxPlan(member(null), WEEK).include,
  true
);
check("which is what the fallback says", wantsWeeklyBox(null), true);
check("only an explicit POINTS opts out", wantsWeeklyBox("POINTS"), false);
check("anything unrecognised keeps the bread coming", wantsWeeklyBox("whatever"), true);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
