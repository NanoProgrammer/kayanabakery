/**
 * The climb shown on the Karyana Club page — Situación 8.
 *
 *   npm run test:roadmap
 *
 * What these guard: that the page cannot promise something the tier data
 * does not actually give, and that every step up says something. A stop
 * with an empty list of rewards is a stop nobody climbs to.
 */
import { roadmap, fastestCakeHours, PILLARS } from "../lib/loyalty/roadmap";
import { TIER_THRESHOLDS, LEGENDARIO_MIN_PERSONAL_PURCHASES } from "../lib/loyalty/klc";
import { TIERS } from "../lib/membership/tiers";

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

console.log("\nKaryana Club roadmap\n");

const stops = roadmap();

console.log("  the path");
check("four stops", stops.length, 4);
check(
  "in order, Básico first",
  stops.map((s) => s.tier),
  ["BASICO", "ARTESANO", "SELECTO", "LEGENDARIO"]
);
check("named the way Karyana names them", stops.map((s) => s.name), [
  "Básico",
  "Artesano",
  "Selecto",
  "Legendario",
]);

console.log("\n  what each one costs");
check("the first is free", stops[0].credits, 0);
check("Artesano asks the real threshold", stops[1].credits, TIER_THRESHOLDS.ARTESANO);
check("Selecto too", stops[2].credits, TIER_THRESHOLDS.SELECTO);
check("Legendario too", stops[3].credits, TIER_THRESHOLDS.LEGENDARIO);
check(
  "the cost only ever goes up",
  stops.every((s, i) => i === 0 || s.credits > stops[i - 1].credits),
  true
);
// The one condition that is not a credit count, so it has to be said.
check("Legendario states the purchase condition", stops[3].requirement !== null, true);
check(
  "...with the real number",
  stops[3].requirement!.es.includes(String(LEGENDARIO_MIN_PERSONAL_PURCHASES)),
  true
);
check("the others have no extra condition", stops.slice(0, 3).every((s) => s.requirement === null), true);

console.log("\n  what each one gives");
// A stop that rewards nothing is a stop nobody climbs to.
check("every stop says something", stops.every((s) => s.unlocks.length > 0), true);
check("both languages, always", stops.every((s) => s.unlocks.every((u) => u.es && u.en)), true);
// Nothing may be promised twice: repeating a perk at the next tier reads as
// a new reward when it is not.
const seen = new Set<string>();
let repeated: string | null = null;
for (const s of stops) for (const u of s.unlocks) {
  if (seen.has(u.en)) repeated = u.en;
  seen.add(u.en);
}
check("no reward is promised twice", repeated, null);

console.log("\n  the cake wait is the headline");
// Straight from her table: the thing a customer feels immediately.
check("a Básico's quickest cake", fastestCakeHours("BASICO"), 12);
check("an Artesano's", fastestCakeHours("ARTESANO"), 4);
check("a Selecto's", fastestCakeHours("SELECTO"), 2);
check(
  "it never gets slower as you climb",
  stops.every((s, i) => i === 0 || s.fastestCakeHours <= stops[i - 1].fastestCakeHours),
  true
);
check("the first stop states the wait", stops[0].unlocks[0].en.includes("12 h"), true);
check("Artesano states the drop", stops[1].unlocks[0].en, "Your cakes drop from 12 h to 4 h of waiting");

console.log("\n  nothing is invented");
// The page may only promise what the tier data actually grants.
check(
  "free delivery is only claimed where it exists",
  stops.every((s) => !s.unlocks.some((u) => u.en.startsWith("Free delivery")) || TIERS[s.tier].freeDelivery),
  true
);
check(
  "Karyana's own hands are only promised where the data says so",
  stops
    .filter((s) => s.unlocks.some((u) => u.en.includes("herself")))
    .every((s) => TIERS[s.tier].karyanaMakesYourCake),
  true
);
// Artesano is the first tier with free delivery, so it must appear there
// and nowhere else.
check(
  "free delivery appears at Artesano",
  stops[1].unlocks.some((u) => u.en.startsWith("Free delivery")),
  true
);
check(
  "...and not again at Selecto",
  stops[2].unlocks.some((u) => u.en.startsWith("Free delivery")),
  false
);

console.log("\n  the five ways up");
check("five of them", PILLARS.length, 5);
check(
  "each has a name and an explanation in both languages",
  PILLARS.every((p) => p.es && p.en && p.detail.es && p.detail.en),
  true
);
// Referral credit is for a purchase, not a signup — the addendum is firm
// about this and the page must not suggest otherwise.
const refer = PILLARS.find((p) => p.en === "Refer")!;
check("referring pays on the first purchase", refer.detail.en.includes("first purchase"), true);
check("...and says so in Spanish too", refer.detail.es.includes("primera compra"), true);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
