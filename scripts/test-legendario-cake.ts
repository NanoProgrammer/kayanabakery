/**
 * Karyana makes the Legendario's cake herself.
 *
 *   npm run test:legendario-cake
 *
 * The point of these is the kitchen slip. A promise the people making the
 * order cannot see is a promise that does not happen.
 */
import {
  karyanaMakesThisCake,
  isBirthdayNear,
  hasCake,
  cakeNames,
  slipNote,
  TIERS_WITH_KARYANA_CAKE,
  BIRTHDAY_WINDOW_DAYS,
} from "../lib/membership/legendario-cake";

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

const cake = { name: "3 Leches Tiramisu", slug: "tres-leches-tiramisu" };
const concha = { name: "Concha Vanilla", slug: "concha-vanilla" };
const handover = new Date(Date.UTC(2026, 10, 20)); // 20 Nov 2026
const birthdayOnTheDay = new Date(Date.UTC(1990, 10, 20));
const birthdayFarOff = new Date(Date.UTC(1990, 4, 3));

console.log("\nThe Legendario's cake\n");

console.log("  who it applies to");
check("Legendario, yes", karyanaMakesThisCake({ tier: "LEGENDARIO", items: [cake] }).applies, true);
check("Embajador too", karyanaMakesThisCake({ tier: "EMBAJADOR", items: [cake] }).applies, true);
check("Selecto, no", karyanaMakesThisCake({ tier: "SELECTO", items: [cake] }).applies, false);
check("Artesano, no", karyanaMakesThisCake({ tier: "ARTESANO", items: [cake] }).applies, false);
check("Básico, no", karyanaMakesThisCake({ tier: "BASICO", items: [cake] }).applies, false);
check("no tier at all, no", karyanaMakesThisCake({ tier: null, items: [cake] }).applies, false);
check("the two top tiers", TIERS_WITH_KARYANA_CAKE, ["LEGENDARIO", "EMBAJADOR"]);

console.log("\n  it has to be a cake");
check("conchas alone, no", karyanaMakesThisCake({ tier: "LEGENDARIO", items: [concha] }).applies, false);
check("an empty order, no", karyanaMakesThisCake({ tier: "LEGENDARIO", items: [] }).applies, false);
check("a cake among conchas, yes", karyanaMakesThisCake({ tier: "LEGENDARIO", items: [concha, cake] }).applies, true);
check("the cake is named", (karyanaMakesThisCake({ tier: "LEGENDARIO", items: [concha, cake] }) as any).cakes, ["3 Leches Tiramisu"]);
check("hasCake agrees", hasCake([concha, cake]), true);
check("...and says no when there is none", hasCake([concha]), false);
check("only the cakes are named", cakeNames([concha, cake, { name: "Chocoflan", slug: "chocoflan" }]), ["3 Leches Tiramisu", "Chocoflan"]);

console.log("\n  the birthday");
check("a birthday on the day counts", isBirthdayNear(birthdayOnTheDay, handover), true);
check("three days before counts", isBirthdayNear(new Date(Date.UTC(1990, 10, 17)), handover), true);
check("seven days after counts", isBirthdayNear(new Date(Date.UTC(1990, 10, 27)), handover), true);
check("eight days does not", isBirthdayNear(new Date(Date.UTC(1990, 10, 28)), handover), false);
check("a birthday in May does not", isBirthdayNear(birthdayFarOff, handover), false);
check("no birthday on file does not", isBirthdayNear(null, handover), false);
check("the window is a week", BIRTHDAY_WINDOW_DAYS, 7);
// A birthday on 2 January must still match an order on 30 December.
check(
  "it works across the turn of the year",
  isBirthdayNear(new Date(Date.UTC(1990, 0, 2)), new Date(Date.UTC(2026, 11, 30))),
  true
);
check(
  "...and the other way round",
  isBirthdayNear(new Date(Date.UTC(1990, 11, 30)), new Date(Date.UTC(2027, 0, 2))),
  true
);
// A leap-day birthday in a non-leap year still lands inside the window.
check(
  "a 29 February birthday still counts in a normal year",
  isBirthdayNear(new Date(Date.UTC(1992, 1, 29)), new Date(Date.UTC(2026, 2, 1))),
  true
);

console.log("\n  what the kitchen reads");
const birthdayOrder = karyanaMakesThisCake({
  tier: "LEGENDARIO",
  items: [cake],
  birthday: birthdayOnTheDay,
  handover,
});
check("a birthday cake is called a birthday cake", (birthdayOrder as any).reason, "birthday");
check("...and says so loudly", slipNote(birthdayOrder), "BIRTHDAY CAKE — KARYANA MAKES THIS ONE");
const plainOrder = karyanaMakesThisCake({
  tier: "LEGENDARIO",
  items: [cake],
  birthday: birthdayFarOff,
  handover,
});
// Over-delivering on a cake is cheaper than breaking the promise the top
// tier was sold on, so a Legendario's cake is flagged either way.
check("any other cake still gets the note", (plainOrder as any).reason, "cake");
check("...more quietly", slipNote(plainOrder), "LEGENDARIO — KARYANA MAKES THIS CAKE");
check("no handover date falls back to the quieter note", (karyanaMakesThisCake({ tier: "LEGENDARIO", items: [cake], birthday: birthdayOnTheDay }) as any).reason, "cake");
check("nothing to say prints nothing", slipNote({ applies: false }), null);
check("a Selecto's cake prints nothing", slipNote(karyanaMakesThisCake({ tier: "SELECTO", items: [cake] })), null);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
