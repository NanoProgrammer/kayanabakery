/**
 * Offering toppers when a tres leches goes into the cart.
 *
 *   npm run test:addons
 */
import {
  shouldSuggestToppers,
  suggestionsToShow,
  TOPPER_CATEGORY_SLUG,
  type SuggestableProduct,
} from "../lib/products/addons";

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

console.log("\nSuggesting cake toppers\n");

console.log("  when the offer appears");
check("a tres leches gets the offer", shouldSuggestToppers(["tres-leches"]), true);
check("...even filed under Cakes as well", shouldSuggestToppers(["cakes", "tres-leches"]), true);
check("a clásico does not", shouldSuggestToppers(["clasicos"]), false);
check("a gourmet does not", shouldSuggestToppers(["gourmet"]), false);
check("a concha does not", shouldSuggestToppers(["pan-dulce"]), false);
// Otherwise adding a topper offers toppers, which offers toppers.
check("a topper never offers toppers", shouldSuggestToppers([TOPPER_CATEGORY_SLUG]), false);
check(
  "...not even one also filed under tres leches",
  shouldSuggestToppers(["tres-leches", TOPPER_CATEGORY_SLUG]),
  false
);
check("a product with no categories does not", shouldSuggestToppers([]), false);
check("nor does a missing list", shouldSuggestToppers(undefined), false);
check("nor null", shouldSuggestToppers(null), false);

const topper = (id: string, extra: Partial<SuggestableProduct> = {}): SuggestableProduct => ({
  _id: id,
  name: `Topper ${id}`,
  slug: `topper-${id}`,
  price: 500,
  ...extra,
});

console.log("\n  what the dialog shows");
check(
  "the toppers, in order",
  suggestionsToShow({ toppers: [topper("a"), topper("b")], productIdsInCart: [] }).map((t) => t._id),
  ["a", "b"]
);
check(
  "nothing sold out",
  suggestionsToShow({
    toppers: [topper("a", { soldOut: true }), topper("b")],
    productIdsInCart: [],
  }).map((t) => t._id),
  ["b"]
);
check(
  "nothing the customer already has",
  suggestionsToShow({ toppers: [topper("a"), topper("b")], productIdsInCart: ["a"] }).map((t) => t._id),
  ["b"]
);
check(
  "a handful at most",
  suggestionsToShow({
    toppers: Array.from({ length: 20 }, (_, i) => topper(String(i))),
    productIdsInCart: [],
  }).length,
  6
);
check(
  "the limit can be lowered",
  suggestionsToShow({ toppers: [topper("a"), topper("b")], productIdsInCart: [], limit: 1 }).length,
  1
);
check(
  "no toppers means nothing to show — the dialog must not open empty",
  suggestionsToShow({ toppers: [], productIdsInCart: [] }),
  []
);
check(
  "every topper already in the cart means nothing to show",
  suggestionsToShow({ toppers: [topper("a")], productIdsInCart: ["a"] }),
  []
);
check(
  "every topper sold out means nothing to show",
  suggestionsToShow({ toppers: [topper("a", { soldOut: true })], productIdsInCart: [] }),
  []
);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
