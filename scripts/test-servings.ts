/**
 * How many people a cake feeds, read from the size the customer picked.
 *
 *   npm run test:servings
 *
 * The product page showed one fixed line — "Serves approximately 8–18
 * people" — whichever size button was pressed, so the number never answered
 * the question the customer was actually asking.
 */
import {
  inchesFromLabel,
  servingsForLabel,
  servingsForInches,
  servingsForOptions,
  describeServings,
  SERVINGS_BY_INCHES,
} from "../lib/products/servings";

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

console.log("\nServings by size\n");

console.log("  Karyana's numbers");
check('6" feeds 6-8', SERVINGS_BY_INCHES[6], { min: 6, max: 8 });
check('8" feeds 10-12', SERVINGS_BY_INCHES[8], { min: 10, max: 12 });
check('10" feeds 14-18', SERVINGS_BY_INCHES[10], { min: 14, max: 18 });

console.log("\n  reading the size off a label, however Studio spells it");
for (const label of ['8"', "8 inch", "8 in", "8 inches", "8''", "8 pulgadas", '8" (Serves 10-12)']) {
  check(`${label} is 8 inches`, inchesFromLabel(label), 8);
}
check("a bare number is a size", inchesFromLabel("10"), 10);
// Otherwise a flavour would be read as a size and the page would promise
// servings for a cake nobody picked.
check("a flavour names no size", inchesFromLabel("Chocolate"), null);
check("...not even one with a number in it", inchesFromLabel("Dulce 3 Leches"), null);
check("an empty label names none", inchesFromLabel(""), null);
check("nor does a missing one", inchesFromLabel(null), null);

console.log("\n  the range that goes on the page");
check('picking 8" gives 10-12', servingsForLabel('8"'), { min: 10, max: 12 });
check('picking 6" gives 6-8', servingsForLabel("6 inch"), { min: 6, max: 8 });
check('picking 10" gives 14-18', servingsForLabel('10"'), { min: 14, max: 18 });
// A size with no number of its own must show nothing rather than guess.
check("a 4 inch has no range set, so nothing is claimed", servingsForLabel('4"'), null);
check("a flavour shows nothing", servingsForLabel("Vanilla"), null);
check("an unknown size shows nothing", servingsForInches(7), null);
check("no size at all shows nothing", servingsForInches(null), null);

console.log("\n  at the checkout, from the choices already made");
check("the size option is used", servingsForOptions({ size: '8"' }), { min: 10, max: 12 });
check("the Spanish key works too", servingsForOptions({ tamaño: '6"' }), { min: 6, max: 8 });
check("...and the unaccented one", servingsForOptions({ tamano: '10"' }), { min: 14, max: 18 });
check(
  "a size under some other key is still found",
  servingsForOptions({ cakeSize: '6"', flavour: "Chocolate" }),
  { min: 6, max: 8 }
);
check("a flavour alone gives nothing", servingsForOptions({ flavour: "Chocolate" }), null);
check("no options give nothing", servingsForOptions(null), null);
check("empty options give nothing", servingsForOptions({}), null);
check(
  "the size wins over another option that happens to parse",
  servingsForOptions({ size: '10"', note: "6" }),
  { min: 14, max: 18 }
);

console.log("\n  how it reads");
check("English", describeServings({ min: 10, max: 12 }, "en"), "Serves 10–12 people");
check("Spanish", describeServings({ min: 10, max: 12 }, "es"), "Rinde 10–12 porciones");
check("a single number does not read as a range", describeServings({ min: 8, max: 8 }, "en"), "Serves 8 people");
check("nothing to say says nothing", describeServings(null, "en"), null);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
