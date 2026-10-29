/**
 * The choices a customer makes about a cake, and what they cost.
 *
 * Products were sold one way only, so a tres leches in three sizes had to be
 * three products with three prices that drift apart, and a chocoflan in
 * vanilla or strawberry could not be ordered at all.
 *
 * The half of this that matters is the refusals. The browser says which choice
 * was picked; the price comes from the catalog. A selection the catalog cannot
 * account for has to be rejected, not quietly ignored — ignoring an unknown
 * option is how someone orders a 10" cake at the 6" price.
 *
 *   npm run test:options
 */
import {
  cartLineId,
  describeChoices,
  resolveOptions,
  startingPriceCents,
  type ProductOption,
} from "../lib/products/options";

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

function rejects(label: string, result: { ok: boolean }) {
  if (result.ok) {
    failed++;
    console.log(`  ✗ ${label} — was accepted`);
  } else {
    passed++;
    console.log(`  ✓ ${label}`);
  }
}

// Tres Leches: the sizes Karyana asked for.
const size: ProductOption = {
  name: "Size",
  key: { current: "size" },
  required: true,
  choices: [
    { label: '6 inch', priceDelta: 0 },
    { label: '8 inch', priceDelta: 15 },
    { label: '10 inch', priceDelta: 30 },
  ],
};

// Clásicos: the flavours.
const flavour: ProductOption = {
  name: "Flavour",
  key: { current: "flavour" },
  required: true,
  choices: [
    { label: "Vanilla", priceDelta: 0 },
    { label: "Chocolate", priceDelta: 0 },
    { label: "Strawberry", priceDelta: 0, soldOut: true },
  ],
};

console.log("\nCake options\n");

console.log("1. Tres Leches — three sizes\n");

const six = resolveOptions([size], { size: "6 inch" }, "Tres Leches");
check("a 6 inch adds nothing", six.ok && six.priceDeltaCents, 0);

const ten = resolveOptions([size], { size: "10 inch" }, "Tres Leches");
check("a 10 inch adds $30", ten.ok && ten.priceDeltaCents, 3000);
check(
  "and the choice is recorded for the kitchen",
  ten.ok && describeChoices(ten.choices),
  "Size: 10 inch"
);

console.log("\n2. Clásicos — three flavours, same price\n");

const vanilla = resolveOptions([flavour], { flavour: "Vanilla" }, "Chocoflan");
check("vanilla costs the same", vanilla.ok && vanilla.priceDeltaCents, 0);
rejects("a sold-out flavour cannot be ordered", resolveOptions([flavour], { flavour: "Strawberry" }, "Chocoflan"));

console.log("\n3. Both at once\n");

const both = resolveOptions([size, flavour], { size: "8 inch", flavour: "Chocolate" }, "Cake");
check("the deltas add up", both.ok && both.priceDeltaCents, 1500);
check(
  "and both print",
  both.ok && describeChoices(both.choices),
  "Size: 8 inch · Flavour: Chocolate"
);

console.log("\n4. What must be refused\n");

rejects("no size chosen at all", resolveOptions([size], {}, "Tres Leches"));
rejects("a size we don't make", resolveOptions([size], { size: "14 inch" }, "Tres Leches"));
rejects("an option the product doesn't have", resolveOptions([size], { colour: "pink" }, "Tres Leches"));
rejects(
  "a second option left out",
  resolveOptions([size, flavour], { size: "8 inch" }, "Cake")
);
rejects("a label that differs by case", resolveOptions([size], { size: "10 INCH" }, "Tres Leches"));

check(
  "and the refusal says what to do",
  (resolveOptions([size], {}, "Tres Leches") as any).error,
  "Choose a size for Tres Leches"
);

console.log("\n5. Products with nothing to choose\n");

check("a concha needs no options", resolveOptions([], {}, "Concha"), {
  ok: true,
  choices: [],
  priceDeltaCents: 0,
});
check("nor does one with none defined", resolveOptions(null, null, "Concha"), {
  ok: true,
  choices: [],
  priceDeltaCents: 0,
});
rejects("but it cannot be given one", resolveOptions([], { size: "8 inch" }, "Concha"));

console.log("\n6. Optional extras\n");

const extra: ProductOption = {
  name: "Message on top",
  key: { current: "message" },
  required: false,
  choices: [{ label: "Yes", priceDelta: 5 }],
};

check("skipping it is fine", resolveOptions([extra], {}, "Cake").ok, true);
check(
  "taking it costs $5",
  (resolveOptions([extra], { message: "Yes" }, "Cake") as any).priceDeltaCents,
  500
);

console.log("\n7. The price on the shelf\n");

check("a plain product shows its own price", startingPriceCents(1200, []), 1200);
check("a cake shows its smallest size", startingPriceCents(4000, [size]), 4000);
check(
  "a product whose cheapest size costs extra includes it",
  startingPriceCents(4000, [
    { ...size, choices: [{ label: '8 inch', priceDelta: 15 }, { label: '10 inch', priceDelta: 30 }] },
  ]),
  5500
);
check(
  "a sold-out cheapest size is not advertised",
  startingPriceCents(4000, [
    {
      ...size,
      choices: [
        { label: '6 inch', priceDelta: 0, soldOut: true },
        { label: '8 inch', priceDelta: 15 },
      ],
    },
  ]),
  5500
);
check("an optional extra is not in the shelf price", startingPriceCents(4000, [extra]), 4000);

console.log("\n8. Two sizes of the same cake are two cart lines\n");

check("a product with no choices keeps its plain id", cartLineId("p1"), "p1");
check("and so does one given an empty selection", cartLineId("p1", {}), "p1");
check(
  "a 6 inch and a 10 inch are different lines",
  cartLineId("p1", { size: "6 inch" }) !== cartLineId("p1", { size: "10 inch" }),
  true
);
check(
  "the same choice is the same line, so quantity adds up",
  cartLineId("p1", { size: "10 inch" }),
  cartLineId("p1", { size: "10 inch" })
);
check(
  "choices made in either order are one line",
  cartLineId("p1", { size: "8 inch", flavour: "Vanilla" }),
  cartLineId("p1", { flavour: "Vanilla", size: "8 inch" })
);
check(
  "different products never collide",
  cartLineId("p1", { size: "8 inch" }) !== cartLineId("p2", { size: "8 inch" }),
  true
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
