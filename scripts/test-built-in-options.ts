/**
 * Cake options filled in from code when Sanity has none.
 *
 *   npm run test:built-in-options
 *
 * The dangerous part is the merge. These options land on products that
 * already carry price differences Karyana typed into Studio — a 10" at
 * +$20 on the live site today. Sanity must win every time.
 */
import { withBuiltInOptions, BUILT_IN_OPTIONS } from "../lib/products/built-in-options";

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
const keys = (opts: any[]) => opts.map((o) => o.key?.current ?? o.key);
const labels = (opts: any[], key: string) =>
  opts.find((o) => (o.key?.current ?? o.key) === key)?.choices.map((c: any) => c.label) ?? null;

console.log("\nBuilt-in cake options\n");

console.log("  the flavours Karyana asked for");
const chocoflan = withBuiltInOptions({ slug: "chocoflan", options: [] });
check("chocoflán gets a flavour choice", keys(chocoflan), ["flavour"]);
check("...vanilla and strawberry", labels(chocoflan, "flavour"), ["Vanilla", "Strawberry"]);
check("...and not chocolate", labels(chocoflan, "flavour")?.includes("Chocolate"), false);
check("...in Spanish too", (chocoflan[0].choices ?? []).map((c: any) => c.labelEs), ["Vainilla", "Fresa"]);
// Its text says 10 x 4 inches, serves 12-15: one size, on purpose.
check("chocoflán gets NO size choice", labels(chocoflan, "size"), null);

console.log("\n  sold one way, on purpose");
check("pineapple upside down gets nothing", withBuiltInOptions({ slug: "pineapple-upside-down", options: [] }), []);
check("bloom cake gets nothing", withBuiltInOptions({ slug: "bloom-cake", options: [] }), []);

console.log("\n  sizes");
check(
  "the gourmet flan is 6 and 8",
  labels(withBuiltInOptions({ slug: "flan-tres-leches", options: [] }), "size"),
  ['6"', '8"']
);
check(
  "a tres leches is 6, 8 and 10",
  labels(withBuiltInOptions({ slug: "classic-3-leches", options: [] }), "size"),
  ['6"', '8"', '10"']
);
check("the accented piña colada is covered", !!BUILT_IN_OPTIONS["piña-colada"], true);
check("...and the unaccented spelling too", !!BUILT_IN_OPTIONS["pina-colada"], true);

console.log("\n  Sanity always wins — this is the money part");
// The live tiramisu carries 6" at -$10 and 10" at +$20. Those must survive.
const liveSizes = {
  name: "Size",
  key: { current: "size" },
  choices: [
    { label: '6"', priceDelta: -1000 },
    { label: '8"', priceDelta: 0 },
    { label: '10"', priceDelta: 2000 },
  ],
};
const merged = withBuiltInOptions({ slug: "tres-leches-tiramisu", options: [liveSizes as any] });
check("the existing size option is kept, not duplicated", keys(merged), ["size"]);
check("the 6 inch keeps its -$10", (merged[0] as any).choices[0].priceDelta, -1000);
check("the 10 inch keeps its +$20", (merged[0] as any).choices[2].priceDelta, 2000);
check(
  "a product with options for every built-in key is untouched",
  withBuiltInOptions({ slug: "chocoflan", options: [{ name: "Flavour", key: { current: "flavour" }, choices: [{ label: "Only one", priceDelta: 500 }] } as any] }),
  [{ name: "Flavour", key: { current: "flavour" }, choices: [{ label: "Only one", priceDelta: 500 }] }]
);
check(
  "a missing option is added alongside, not instead",
  keys(withBuiltInOptions({ slug: "flan-tres-leches", options: [{ name: "Flavour", key: { current: "flavour" }, choices: [] } as any] })),
  ["flavour", "size"]
);
// Removing a Sanity option from code nobody is looking at is how a 10" cake
// starts selling at a 6" price.
check(
  "an empty built-in entry does not strip real options",
  keys(withBuiltInOptions({ slug: "bloom-cake", options: [liveSizes as any] })),
  ["size"]
);

console.log("\n  everything built in is free");
const allChoices = Object.values(BUILT_IN_OPTIONS)
  .flat()
  .flatMap((o) => o.choices);
check("there are choices to check", allChoices.length > 0, true);
check(
  "no built-in choice carries a price",
  (withBuiltInOptions({ slug: "chocoflan", options: [] })[0].choices ?? []).every((c: any) => c.priceDelta === 0),
  true
);

console.log("\n  products with no entry");
check("an unknown cake keeps exactly what Sanity gave it", withBuiltInOptions({ slug: "lemon-loaf", options: [liveSizes as any] }), [liveSizes]);
check("...and nothing when Sanity gave nothing", withBuiltInOptions({ slug: "lemon-loaf", options: [] }), []);
check("a concha is untouched", withBuiltInOptions({ slug: "concha", options: [] }), []);
check("a missing slug is safe", withBuiltInOptions({ options: [] }), []);
check("missing options are safe", withBuiltInOptions({ slug: "chocoflan" }).length, 1);
check("case in the slug does not matter", keys(withBuiltInOptions({ slug: "CHOCOFLAN", options: [] })), ["flavour"]);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
