/**
 * Splitting an order into parts with different dates.
 *
 *   npm run test:groups
 *
 * The cart used to take one date — the slowest item's — so a bag of conchas
 * waited two days for a chocoflán. These tests are the Amazon behaviour:
 * each part gets the date it is actually ready on.
 */
import {
  groupByLeadTime,
  needsSplitDelivery,
  describeGroup,
  slowestLeadTime,
} from "../lib/checkout/delivery-groups";
import {
  leadTimeHours,
  leadTimeFor,
  TRES_LECHES_FLAVOURS,
  CAKE_LEAD_TIMES,
} from "../lib/products/cake-lead-times";

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

const item = (productId: string, leadTime?: number | null) => ({
  productId,
  name: productId,
  quantity: 1,
  leadTime,
});

console.log("\nSplitting a delivery\n");

console.log("  when it splits");
check("conchas and a 48h chocoflán are two deliveries", groupByLeadTime([item("concha", 0), item("chocoflan", 48)]).length, 2);
check("...soonest first", groupByLeadTime([item("chocoflan", 48), item("concha", 0)]).map((g) => g.leadTimeHours), [0, 48]);
check("conchas alone are one", needsSplitDelivery([item("concha", 0), item("pan", 0)]), false);
// Grouped by how much notice they need, not by what they are: two cakes that
// are both ready in a day are one delivery, not two.
check(
  "two cakes with the same notice travel together",
  groupByLeadTime([item("3 leches mango", 24), item("3 leches chocolate", 24)]).length,
  1
);
check(
  "a 2-hour cake rides with the conchas",
  groupByLeadTime([item("concha", 0), item("carlota", 2), item("chocoflan", 48)]).map((g) => g.leadTimeHours),
  [0, 2, 48]
);
check("an empty cart has no groups", groupByLeadTime([]), []);
check("...and does not split", needsSplitDelivery([]), false);
check("one item is one group", groupByLeadTime([item("pan", 0)]).length, 1);

console.log("  odd lead times");
check("a missing lead time counts as none", groupByLeadTime([item("pan")]).map((g) => g.leadTimeHours), [0]);
check("null counts as none", groupByLeadTime([item("pan", null)]).map((g) => g.leadTimeHours), [0]);
check("a negative one counts as none", groupByLeadTime([item("pan", -5)]).map((g) => g.leadTimeHours), [0]);
check("so none of those split the order", needsSplitDelivery([item("a"), item("b", null), item("c", -5)]), false);
check("a fractional one rounds up — never promise sooner", groupByLeadTime([item("pan", 2.5)])[0].leadTimeHours, 3);
check("NaN counts as none rather than crashing", groupByLeadTime([item("pan", NaN)])[0].leadTimeHours, 0);
check("Infinity counts as none", groupByLeadTime([item("pan", Infinity)])[0].leadTimeHours, 0);

console.log("\n  nothing is lost in the split");
const cart = [item("concha", 0), item("chocoflan", 48), item("carlota", 2), item("pan", 0)];
check(
  "every item ends up in exactly one group",
  groupByLeadTime(cart).flatMap((g) => g.items.map((i) => i.productId)).sort(),
  ["carlota", "chocoflan", "concha", "pan"]
);
check(
  "the slowest item still sets the date when it is NOT split",
  slowestLeadTime([item("concha", 0), item("chocoflan", 48)]),
  48
);

console.log("\n  what the customer is told");
const groups = groupByLeadTime(cart);
check("the first is 1 of 3", describeGroup(groups[0], 0, groups.length, "en").title, "Delivery 1 of 3");
check("in Spanish too", describeGroup(groups[0], 0, groups.length, "es").title, "Entrega 1 de 3");
// Two dates with no reason given read as a double charge.
check("a same-day group says so", describeGroup(groups[0], 0, 3, "en").reason, "Ready on the earliest date");
check("a 48h group says 2 days, not 48 hours", describeGroup(groups[2], 2, 3, "en").reason, "Needs 2 days to prepare");
check("...and in Spanish", describeGroup(groups[2], 2, 3, "es").reason, "Necesita 2 días de preparación");
check("24h reads as one day, singular", describeGroup({ leadTimeHours: 24, items: [] }, 0, 2, "en").reason, "Needs 1 day to prepare");
check("2h stays in hours", describeGroup({ leadTimeHours: 2, items: [] }, 0, 2, "en").reason, "Needs 2 hours to prepare");
check("a part-day stays in hours", describeGroup({ leadTimeHours: 30, items: [] }, 0, 2, "en").reason, "Needs 30 hours to prepare");

console.log("\nKaryana's lead-time table\n");
check("sixteen cakes", CAKE_LEAD_TIMES.length, 16);
check("a guest waits 48h for a chocoflán", leadTimeHours("Chocoflán", "GUEST"), 48);
check("a Selecto waits 6", leadTimeHours("Chocoflán", "SELECTO"), 6);
check("a guest waits 24h for a 3 leches mango", leadTimeHours("3 Leches Mango", "GUEST"), 24);
check("an Artesano waits 4", leadTimeHours("3 Leches Mango", "ARTESANO"), 4);
check("a Selecto waits 2", leadTimeHours("3 Leches Mango", "SELECTO"), 2);
check("accents do not matter", leadTimeHours("Chocoflan", "GUEST"), 48);
check("a size in the name does not matter", leadTimeHours('3 Leches Mango (8")', "BASICO"), 12);
// "3 Leches Chocolate" contains no shorter row, but this guards the rule.
check(
  "the longest matching name wins",
  leadTimeFor("3 Leches Dulce de Leche")?.name,
  "3 Leches Dulce de Leche"
);
check("something that is not in the table has no lead time", leadTimeHours("Concha", "GUEST"), null);
check("the table names eight tres leches flavours", TRES_LECHES_FLAVOURS.length, 8);
check(
  "...these ones",
  TRES_LECHES_FLAVOURS,
  ["Clásico", "Tiramisú", "Mango", "Pistacho", "Piña Colada", "Dulce de Leche", "Chocolate", "Eggnog/Rompope"]
);
// Every tier must be covered, or a member silently gets the guest wait.
for (const tier of ["GUEST", "BASICO", "ARTESANO", "SELECTO", "LEGENDARIO", "EMBAJADOR"] as const) {
  check(
    `every cake has a time for ${tier}`,
    CAKE_LEAD_TIMES.every((c) => typeof c.hours[tier] === "number"),
    true
  );
}
check(
  "no tier ever waits longer than a guest",
  CAKE_LEAD_TIMES.every((c) =>
    (["BASICO", "ARTESANO", "SELECTO", "LEGENDARIO", "EMBAJADOR"] as const).every(
      (t) => c.hours[t] <= c.hours.GUEST
    )
  ),
  true
);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
