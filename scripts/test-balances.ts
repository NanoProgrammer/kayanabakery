/**
 * Telling prepaid money apart from points earned by buying.
 *
 *   npm run test:balances
 *
 * This is the blocker for the Loyalty Club migration: both live in one
 * column today, so "do not erase obligations already paid for" cannot be
 * honoured without reconstructing which is which.
 */
import { splitBalance, checkBalance, isPrepaid } from "../lib/loyalty/balances";

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
const e = (type: string, amount: number, day: string) => ({
  type,
  amount,
  createdAt: new Date(`2026-${day}T12:00:00Z`),
});

console.log("\nPrepaid money vs points earned\n");

console.log("  which ledger types are money the customer paid");
check("a membership fee conversion is", isPrepaid({ type: "BONUS" }), true);
check("points earned at the till are not", isPrepaid({ type: "EARNED" }), false);
check("a referral reward is not", isPrepaid({ type: "REFERRAL" }), false);
check("a birthday gift is not", isPrepaid({ type: "BIRTHDAY" }), false);
check("an admin adjustment is not", isPrepaid({ type: "ADJUSTMENT" }), false);

console.log("\n  a simple account");
// $30 membership fee = 3000 points, then $60 of cake earns 60.
const simple = [e("BONUS", 3000, "01-05"), e("EARNED", 60, "02-10")];
check("the obligation is 3000", splitBalance(simple).prepaid, 3000);
check("the earned points are 60", splitBalance(simple).earned, 60);
check("the total matches the balance", splitBalance(simple).total, 3060);

console.log("\n  spending comes off the oldest first");
const spent = [...simple, e("REDEMPTION", -1000, "03-01")];
check("the fee is drawn down first, being oldest", splitBalance(spent).prepaid, 2000);
check("...and the earned points are untouched", splitBalance(spent).earned, 60);
check("redeemed is recorded", splitBalance(spent).redeemed, 1000);

console.log("\n  the two extremes, so the range is visible");
check("if redemptions always came from prepaid", splitBalance(spent).prepaidIfSpentFirst, 2000);
// Earned first absorbs 60 of the 1000; the other 940 has to come out of the
// fee, so 2060 — not 3000. The fee cannot be protected beyond what the
// earned points cover.
check("if they always came from earned first", splitBalance(spent).prepaidIfSpentLast, 2060);
// Where the order matters, the two differ and the range is worth seeing.
const earnedFirst = [e("EARNED", 500, "01-01"), e("BONUS", 3000, "02-01"), e("REDEMPTION", -400, "03-01")];
check("oldest-first leaves the fee whole here", splitBalance(earnedFirst).prepaid, 3000);
check("...spending prepaid first would have left 2600", splitBalance(earnedFirst).prepaidIfSpentFirst, 2600);
check("...spending it last leaves 3000", splitBalance(earnedFirst).prepaidIfSpentLast, 3000);

console.log("\n  spending more than one lot");
const deep = [
  e("BONUS", 1000, "01-01"),
  e("EARNED", 200, "02-01"),
  e("BONUS", 500, "03-01"),
  e("REDEMPTION", -1100, "04-01"),
];
// 1100 spent: the whole 1000 fee lot, then 100 of the 200 earned. The
// second fee lot is never touched.
check("the first lot empties, then the next", splitBalance(deep).prepaid, 500);
check("...and 100 of the earned 200 goes with it", splitBalance(deep).earned, 100);
check("the total is what is left", splitBalance(deep).total, 600);

console.log("\n  nothing is invented");
check("an empty ledger is zero", splitBalance([]), {
  prepaid: 0, earned: 0, total: 0, prepaidIn: 0, earnedIn: 0, redeemed: 0,
  prepaidIfSpentFirst: 0, prepaidIfSpentLast: 0,
});
// Spending a balance the ledger does not explain must not produce a
// negative obligation out of thin air.
check("over-spending does not go negative", splitBalance([e("EARNED", 10, "01-01"), e("REDEMPTION", -50, "02-01")]).total, 0);
check("...nor on the prepaid side", splitBalance([e("BONUS", 10, "01-01"), e("REDEMPTION", -50, "02-01")]).prepaid, 0);
check("a negative adjustment claws back like a redemption", splitBalance([e("BONUS", 100, "01-01"), e("ADJUSTMENT", -40, "02-01")]).prepaid, 60);
check("entries out of order are sorted by date", splitBalance([e("REDEMPTION", -100, "03-01"), e("BONUS", 500, "01-01")]).prepaid, 400);

console.log("\n  catching a balance the ledger cannot explain");
// Points that moved without a row mean the migration would hand someone a
// smaller obligation than they actually paid for.
check("a matching balance has no drift", checkBalance(3060, simple).driftsFromLedger, false);
check("a higher stored balance is drift", checkBalance(4000, simple).drift, 940);
check("...and is flagged", checkBalance(4000, simple).driftsFromLedger, true);
check("a lower stored balance is drift too", checkBalance(100, simple).drift, -2960);
check("an empty ledger with a balance is drift", checkBalance(500, []).driftsFromLedger, true);
check("zero and zero is fine", checkBalance(0, []).driftsFromLedger, false);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
