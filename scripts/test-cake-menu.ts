/**
 * The cake menu, and applying it without destroying prices.
 *
 *   npm run test:cakes
 *
 * The dangerous part is not the menu, it is the merge. These rules are
 * applied to products that already exist in Studio, some carrying price
 * differences Karyana typed in by hand. An overwrite would zero them in
 * silence and a 10" cake would ship priced like a 6".
 */
import {
  choiceIdentity,
  TOPPER_CATEGORY,
  SUBCATEGORIES,
  PRODUCT_RULES,
  ruleForProduct,
  optionsForProduct,
  normalizeName,
  mergeProductOptions,
  optionKey,
} from "../lib/products/cake-menu";

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

const sub = (slug: string) => SUBCATEGORIES.find((s) => s.slug === slug)!;
const labels = (opts: ReturnType<typeof optionsForProduct>, key: string) =>
  opts.find((o) => o.key === key)?.choices.map((c) => c.label) ?? null;

console.log("\nThe cake menu\n");

console.log("  four subcategories under Cakes");
check("there are four", SUBCATEGORIES.length, 4);
check(
  "named as asked",
  SUBCATEGORIES.map((s) => s.slug),
  ["tres-leches", "gourmet", "clasicos", "gelatinas-y-flanes"]
);
check("gelatinas y flanes is marked gluten free", sub("gelatinas-y-flanes").tagline, "Gluten free");
// Toppers are something you add to a cake, not a kind of cake. If they were a
// subcategory the Cakes page would show five cards instead of four.
check(
  "toppers are not one of the four",
  SUBCATEGORIES.some((s) => s.slug === TOPPER_CATEGORY.slug),
  false
);

console.log("\n  sizes");
// Shown the way the customer decides: nobody knows what 8" means, everybody
// knows whether they are feeding twelve people.
check("tres leches comes in three sizes", labels(sub("tres-leches").defaultOptions, "size"), ['6"', '8"', '10"']);
check("gourmet comes in two", labels(sub("gourmet").defaultOptions, "size"), ['6"', '8"']);
// The serving count is NOT in the label: it has to change with the choice.
check("no serving count is baked into the label", /serves|porciones/i.test(labels(sub("gourmet").defaultOptions, "size")!.join(" ")), false);

console.log("\n  the clásicos, each sold its own way");
check(
  "chocoflán is strawberry and vanilla, not chocolate",
  labels(optionsForProduct("Chocoflán", sub("clasicos")), "flavour"),
  ["Vanilla", "Strawberry"]
);
check(
  "...and does not come in 10 inch",
  labels(optionsForProduct("Chocoflán", sub("clasicos")), "size"),
  ['6"', '8"']
);
check(
  "pineapple upside down has no choices at all",
  optionsForProduct("Pineapple Upside Down Cake", sub("clasicos")),
  []
);
// Spelled "blum cake" in chat; her lead-time table says Bloom. Matching on
// "bundt" found nothing at all, so this product kept the subcategory's three
// flavours instead of being sold one way.
check("the bloom cake has none either — it is 4 inch only", optionsForProduct("Bloom Cake", sub("clasicos")), []);
check("...however it is capitalised", optionsForProduct("BLOOM CAKE", sub("clasicos")), []);
check(
  "a clásico with no rule falls back to the three flavours",
  labels(optionsForProduct("Carrot Cake", sub("clasicos")), "flavour"),
  ["Vanilla", "Chocolate", "Strawberry"]
);

console.log("\n  gourmet");
check(
  "the flan tres leches is 6 and 8 inch",
  labels(optionsForProduct("Flan Tres Leches", sub("gourmet")), "size"),
  ['6"', '8"']
);
check(
  "...and has no flavour choice",
  labels(optionsForProduct("Flan Tres Leches", sub("gourmet")), "flavour"),
  null
);
// It is filed under Gourmet, but the rule must not steal plain tres leches
// cakes, which are a different subcategory with three sizes.
check(
  "a plain tres leches is untouched by it",
  labels(optionsForProduct("Tres Leches", sub("tres-leches")), "size"),
  ['6"', '8"', '10"']
);

console.log("\n  matching the names Studio actually holds");
check("accents do not matter", ruleForProduct("Chocoflán")?.label, "Chocoflán");
check("...with or without", ruleForProduct("Chocoflan")?.label, "Chocoflán");
check("case does not matter", ruleForProduct("CHOCOFLAN")?.label, "Chocoflán");
check("extra words do not matter", ruleForProduct("Mini Chocoflan Cake")?.label, "Chocoflán");
check("punctuation does not matter", ruleForProduct("Pineapple Upside-Down")?.label, "Pineapple Upside Down");
check("the bloom cake is found by name", ruleForProduct("Bloom Cake")?.label, "Bloom Cake");
check("an unrelated cake matches nothing", ruleForProduct("Tres Leches Fresa"), null);
check("normalizing strips accents and punctuation", normalizeName("Piña — Upside-Down!"), "pina upside down");

console.log("\n  the merge: money already in Studio survives");
const existing = [
  {
    key: { current: "size" },
    name: "Size",
    choices: [
      { label: "6 inch", priceDelta: 0, soldOut: false },
      { label: "8 inch", priceDelta: 1500, soldOut: false },
      { label: "10 inch", priceDelta: 3000, soldOut: true },
    ],
  },
];
const merged = mergeProductOptions(existing, optionsForProduct("Chocoflán", sub("clasicos")));
const size = merged.options.find((o) => o.key === "size")!;
// The labels in Studio still read "8 inch"; the menu now says
// '8" (Serves 12-20)'. Matching on the whole label would call that a delete
// plus an add and drop the $15.
check("the 8 inch keeps its $15 through the rename", size.choices.find((c) => c.label.startsWith('8"'))?.priceDelta, 1500);
check("the 6 inch keeps its zero", size.choices.find((c) => c.label.startsWith('6"'))?.priceDelta, 0);
check("the 10 inch is gone, as asked", size.choices.map((c) => c.label), ['6"', '8"']);
check(
  "and removing it is reported, not done quietly",
  merged.changes.some((c) => c.includes("10 inch") && c.includes("removed")),
  true
);
check(
  "a sold-out flag survives too",
  mergeProductOptions(
    [{ key: "size", name: "Size", choices: [{ label: "6 inch", priceDelta: 500, soldOut: true }] }],
    [{ key: "size", name: "Size", nameEs: "Tamaño", choices: [{ label: '6"', labelEs: '6"' }] }]
  ).options[0].choices[0],
  { label: '6"', labelEs: '6"', priceDelta: 500, soldOut: true }
);

console.log("\n  a size is the same size however it is written");
check('6 inch and 6"', choiceIdentity("6 inch"), choiceIdentity('6"'));
check('6" and 6" (Serves 8-12)', choiceIdentity('6"'), choiceIdentity('6" (Serves 8-12)'));
check("6 in and 6 inches", choiceIdentity("6 in"), choiceIdentity("6 inches"));
check("6 and 8 are not the same size", choiceIdentity('6" (Serves 8-12)') === choiceIdentity('8" (Serves 12-20)'), false);
check("a flavour is matched on its name", choiceIdentity("Fresa"), choiceIdentity("fresa"));
check("a flavour is not mistaken for a size", choiceIdentity("Vanilla"), "vanilla");
check(
  "a 10 inch is not read as a 1",
  choiceIdentity('10" (Serves 20-30)'),
  choiceIdentity("10 inch")
);
check(
  "...and is not the same as a 1 inch",
  choiceIdentity("10 inch") === choiceIdentity("1 inch"),
  false
);
check(
  "a label whose accents differ is still the same choice, so its price is kept",
  mergeProductOptions(
    [{ key: "flavour", name: "Flavour", choices: [{ label: "Fresa", priceDelta: 200 }] }],
    [{ key: "flavour", name: "Flavour", nameEs: "Sabor", choices: [{ label: "fresa", labelEs: "Fresa" }] }]
  ).options[0].choices[0].priceDelta,
  200
);

console.log("\n  the merge: what it says it is doing");
check(
  "a brand new option is reported as added",
  mergeProductOptions([], [{ key: "size", name: "Size", nameEs: "Tamaño", choices: [{ label: "6 inch", labelEs: "6 pulgadas" }] }])
    .changes.some((c) => c.includes('option "Size"')),
  true
);
check(
  "an option that is going away is reported",
  mergeProductOptions([{ key: "flavour", name: "Flavour", choices: [] }], []).changes,
  ['- option "Flavour" (removed)']
);
check(
  "nothing to do is recognised as nothing to do",
  mergeProductOptions(
    [{ key: "size", name: "Size", choices: [{ label: '6"', priceDelta: 0, soldOut: false }] }],
    [{ key: "size", name: "Size", nameEs: "Tamaño", choices: [{ label: '6"', labelEs: '6"' }] }]
  ).unchanged,
  true
);
check(
  "stripping a product down to no options is a change",
  mergeProductOptions([{ key: "size", name: "Size", choices: [{ label: "6 inch" }] }], []).unchanged,
  false
);
check("a product with nothing and nothing wanted is unchanged", mergeProductOptions([], []).unchanged, true);
check("a missing options array is treated as empty", mergeProductOptions(undefined, []).unchanged, true);

console.log("\n  reading keys the two ways Sanity stores them");
check("a slug object", optionKey({ key: { current: "size" } }), "size");
check("a plain string", optionKey({ key: "size" }), "size");
check("neither", optionKey({ name: "Size" }), "");

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
