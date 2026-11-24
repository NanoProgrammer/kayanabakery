/**
 * Keeping a tier, and losing it.
 *
 *   npm run test:standing
 *
 * PROPOSAL — the switch is off and none of this touches a live customer.
 *
 * The failure mode these guard against is specific: a regular walking in on
 * their birthday to find they are Básico. Going up is instant, going down
 * waits, and nobody falls more than one step at a time.
 */
import {
  CREDIT_LIFETIME_DAYS,
  GRACE_DAYS,
  TIER_ORDER,
  liveCredits,
  livePurchases,
  tierFromCredits,
  standing,
  progress,
  describeStanding,
  KLC_LIVE,
} from "../lib/loyalty/standing";
import type { KlcEvent, PurchaseRecord } from "../lib/loyalty/klc";

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

const now = new Date("2026-11-24T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
const ev = (credits: number, days: number, key: string): KlcEvent => ({
  kind: "PURCHASE",
  credits,
  at: daysAgo(days),
  idempotencyKey: key,
});
const buys = (count: number, startDaysAgo = 10): PurchaseRecord[] =>
  Array.from({ length: count }, (_, i) => ({
    day: daysAgo(startDaysAgo + i * 7).toISOString().slice(0, 10),
    valid: true,
  }));

console.log("\nStanding: keeping a tier, and losing it\n");

console.log("  nothing is live");
check("the switch is off", KLC_LIVE, false);

console.log("\n  credits age out");
check("recent credits count", liveCredits([ev(10, 30, "a")], now), 10);
check("a credit from 400 days ago does not", liveCredits([ev(10, 400, "a")], now), 0);
check("the window is a year", CREDIT_LIFETIME_DAYS, 365);
check(
  "a mix counts only the recent",
  liveCredits([ev(10, 30, "a"), ev(10, 400, "b")], now),
  10
);
check("purchases age out too", livePurchases(buys(4, 400), now), 0);
check("...and recent ones count", livePurchases(buys(4), now), 4);

console.log("\n  the tier the numbers justify");
check("nothing is Básico", tierFromCredits(0, 0), "BASICO");
check("4 is Artesano", tierFromCredits(4, 0), "ARTESANO");
check("10 is Selecto", tierFromCredits(10, 0), "SELECTO");
check("18 with four purchases is Legendario", tierFromCredits(18, 4), "LEGENDARIO");
// Referrals and exploration still cannot stand in for buying.
check("18 with three purchases is not", tierFromCredits(18, 3), "SELECTO");

console.log("\n  going up is immediate");
const rising = standing({
  events: [ev(12, 10, "a")],
  purchases: buys(3),
  currentTier: "ARTESANO",
  heldSince: daysAgo(200),
  now,
});
check("a customer who earns Selecto gets it at once", rising.tier, "SELECTO");
check("...with no grace involved", rising.inGrace, false);

console.log("\n  going down waits");
// One quiet month after a year of loyalty must not cost someone their tier
// in the middle of planning a birthday.
const quiet = standing({
  events: [ev(18, 400, "old")],
  purchases: buys(4, 400),
  currentTier: "LEGENDARIO",
  heldSince: daysAgo(30),
  now,
});
check("the tier is held", quiet.tier, "LEGENDARIO");
check("...and it says it is in grace", quiet.inGrace, true);
check("...with days left", quiet.graceDaysLeft, GRACE_DAYS - 30);
check("...and what is coming", quiet.droppingTo, "SELECTO");
check("the numbers underneath are honest", quiet.earned, "BASICO");
check("grace is 90 days", GRACE_DAYS, 90);

console.log("\n  and then only one step");
const lapsed = standing({
  events: [ev(18, 400, "old")],
  purchases: buys(4, 400),
  currentTier: "LEGENDARIO",
  heldSince: daysAgo(200),
  now,
});
// A long absence is a slide, not a fall to the bottom.
check("a Legendario falls to Selecto, not Básico", lapsed.tier, "SELECTO");
check("...with grace over", lapsed.inGrace, false);
const lower = standing({
  events: [],
  purchases: [],
  currentTier: "ARTESANO",
  heldSince: daysAgo(200),
  now,
});
check("an Artesano falls to Básico", lower.tier, "BASICO");
check("a Básico cannot fall further", standing({ events: [], purchases: [], currentTier: "BASICO", heldSince: daysAgo(999), now }).tier, "BASICO");
check("the ladder has four rungs", TIER_ORDER, ["BASICO", "ARTESANO", "SELECTO", "LEGENDARIO"]);

console.log("\n  one order renews it");
const renewed = standing({
  events: [ev(18, 400, "old"), ev(10, 1, "fresh")],
  purchases: buys(4, 1),
  currentTier: "LEGENDARIO",
  heldSince: daysAgo(200),
  now,
});
check("buying again stops the slide at Selecto", renewed.tier, "SELECTO");
check("...and the fresh credits count", renewed.credits, 10);

console.log("\n  progress, without a formula");
const artesano = standing({ events: [ev(6, 5, "a")], purchases: buys(2), currentTier: "ARTESANO", heldSince: daysAgo(5), now });
check("it knows what is next", progress(artesano).next, "SELECTO");
check("...and how far", progress(artesano).creditsToNext, 4);
check("...as a fraction for a bar", Math.round(progress(artesano).fraction * 100) / 100, 0.33);
const top = standing({ events: [ev(20, 5, "a")], purchases: buys(4), currentTier: "LEGENDARIO", heldSince: daysAgo(5), now });
check("at the top there is nothing next", progress(top).next, null);
check("...and the bar is full", progress(top).fraction, 1);

console.log("\n  what it says");
check(
  "in grace, it says how to keep it",
  describeStanding(quiet, "es"),
  "Conservas LEGENDARIO por 60 días más. Una compra lo renueva."
);
check(
  "climbing, it says what is close",
  describeStanding(artesano, "en"),
  "Every purchase, recommendation and new experience brings you closer to SELECTO — 4 to go."
);
check("at the top, it just says so", describeStanding(top, "en"), "You're at the top. Keep it going.");

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
