/**
 * Ten referrals who join the Club earn a free cake.
 *
 *   npm run test:free-cake
 *
 * The counting is the part that can be wrong for months before anyone
 * notices, so it is tested on its own: who counts, who does not, and what
 * happens at exactly ten.
 */
import {
  FREE_CAKE_AT,
  countsTowardCake,
  cakeProgress,
  describeProgress,
  freeCakeCode,
  QUALIFYING_TIERS,
} from "../lib/referrals/free-cake";

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

const member = (tier: string, verified = true, userId = Math.random().toString(36)) => ({
  userId,
  tier,
  verified,
});
const tenMembers = () => Array.from({ length: 10 }, (_, i) => member("SELECTO", true, `u${i}`));

console.log("\nTen referrals, one free cake\n");

console.log("  who counts");
for (const tier of QUALIFYING_TIERS) {
  check(`a ${tier} counts`, countsTowardCake(member(tier)), true);
}
// The milestone is ten people who GET A MEMBERSHIP. Básico is the free
// default everyone has, so counting it would earn a cake for ten sign-ups.
check("a Básico does not — it is the free default", countsTowardCake(member("BASICO")), false);
check("an unverified sign-up does not count", countsTowardCake(member("SELECTO", false)), false);
check("...not even on a paid tier", countsTowardCake(member("LEGENDARIO", false)), false);
check("an unknown tier does not count", countsTowardCake(member("MYSTERY")), false);

console.log("\n  reaching it");
check("ten is the number", FREE_CAKE_AT, 10);
check("nine is not enough", cakeProgress(tenMembers().slice(0, 9)).earned, false);
check("...and says three are left at seven", cakeProgress(tenMembers().slice(0, 7)).remaining, 3);
check("ten earns it", cakeProgress(tenMembers()).earned, true);
check("...and nothing more is needed", cakeProgress(tenMembers()).remaining, 0);
check("eleven still earns exactly one", cakeProgress([...tenMembers(), member("SELECTO")]).cakesEarned, 1);
check("twenty earns two", cakeProgress(Array.from({ length: 20 }, (_, i) => member("SELECTO", true, `u${i}`))).cakesEarned, 2);

console.log("\n  not paying twice for the same ten");
check(
  "once the cake is issued, ten no longer earns another",
  cakeProgress(tenMembers(), 1).earned,
  false
);
check(
  "...and the count toward the next starts again",
  cakeProgress(tenMembers(), 1).remaining,
  10
);
check(
  "a second ten earns a second cake",
  cakeProgress(Array.from({ length: 20 }, (_, i) => member("SELECTO", true, `u${i}`)), 1).earned,
  true
);
check(
  "...but not a third",
  cakeProgress(Array.from({ length: 20 }, (_, i) => member("SELECTO", true, `u${i}`)), 2).earned,
  false
);

console.log("\n  a mixed list");
const mixed = [
  member("SELECTO"),
  member("BASICO"),
  member("ARTESANO"),
  member("SELECTO", false),
  member("LEGENDARIO"),
];
check("only the paid, verified ones count", cakeProgress(mixed).qualified, 3);
check("nobody at all is zero", cakeProgress([]).qualified, 0);
check("...and ten away", cakeProgress([]).remaining, 10);

console.log("\n  what the member is told");
check("progress reads plainly", describeProgress(cakeProgress(tenMembers().slice(0, 7)), "en"), "7 of 10 — 3 more for a free cake");
check("in Spanish", describeProgress(cakeProgress(tenMembers().slice(0, 7)), "es"), "7 de 10 — te faltan 3 para un pastel gratis");
check("earned says so", describeProgress(cakeProgress(tenMembers()), "en"), "You've earned a free cake!");
check(
  "after eleven it reads 1 of 10, not 11 of 10",
  describeProgress(cakeProgress([...tenMembers(), member("SELECTO")], 1), "en"),
  "1 of 10 — 9 more for a free cake"
);

console.log("\n  the coupon code");
check("it is stable for the same milestone", freeCakeCode("cmw2eu1ob0003p1s1", 1), freeCakeCode("cmw2eu1ob0003p1s1", 1));
check("a second cake gets a different code", freeCakeCode("cmw2eu1ob0003p1s1", 1) === freeCakeCode("cmw2eu1ob0003p1s1", 2), false);
check("two members get different codes", freeCakeCode("aaaaaaaaaaaa", 1) === freeCakeCode("bbbbbbbbbbbb", 1), false);
check("it is upper case and safe to type", /^CAKE10-[A-Z0-9]+-\d+$/.test(freeCakeCode("cmw2eu1ob0003p1s1", 1)), true);
check("punctuation in the id does not leak in", /^CAKE10-[A-Z0-9]+-1$/.test(freeCakeCode("a-b_c.d/e!f", 1)), true);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
