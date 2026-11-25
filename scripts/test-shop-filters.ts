/**
 * Searching, filtering and sorting the shop.
 *
 *   npm run test:shop-filters
 *
 * The corners worth pinning: search has to work in both languages and
 * without accents, sorting has to be stable or the grid shuffles under the
 * customer as they type, and the price slider's ends have to come from the
 * catalogue rather than a guess.
 */
import {
  normalize,
  searchableText,
  matchesSearch,
  sortProducts,
  priceBounds,
  applyFilters,
  isFiltered,
  defaultFilters,
  sortLabel,
  SORT_KEYS,
  waitHours,
  type ShopProduct,
} from "../lib/products/shop-filters";

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

const P = (over: Partial<ShopProduct> & { _id: string; name: string; price: number }): ShopProduct => ({
  displayOrder: 50,
  ...over,
});

const pina = P({
  _id: "a",
  name: "3 leches Piña Colada",
  nameEs: "3 leches Piña Colada",
  price: 60,
  tag: "NEW",
  displayOrder: 3,
  _createdAt: "2026-10-01T00:00:00Z",
  categories: [{ slug: "tres-leches", name: "Tres Leches" }],
});
const concha = P({
  _id: "b",
  name: "Concha Vanilla",
  nameEs: "Concha de Vainilla",
  price: 5,
  tag: "BESTSELLER",
  displayOrder: 10,
  _createdAt: "2026-01-01T00:00:00Z",
  categories: [{ slug: "conchas", name: "Conchas" }],
});
const lemon = P({
  _id: "c",
  name: "Lemon Loaf",
  price: 65,
  displayOrder: 1,
  _createdAt: "2026-11-01T00:00:00Z",
  categories: [{ slug: "cakes", name: "Pasteles" }],
});
const all = [pina, concha, lemon];

console.log("\nThe shop's search, filters and sort\n");

console.log("  searching, the way people actually type");
check("accents are ignored", matchesSearch(pina, "pina"), true);
check("...and typed accents still work", matchesSearch(pina, "piña"), true);
check("case is ignored", matchesSearch(concha, "CONCHA"), true);
check("the Spanish name is searched", matchesSearch(concha, "vainilla"), true);
check("...and the English one", matchesSearch(concha, "vanilla"), true);
// "pastel" finds the cakes even when no cake has that word in its name.
check("the category name is searched", matchesSearch(lemon, "pasteles"), true);
check("...and the category slug", matchesSearch(lemon, "cakes"), true);
check("every word has to appear", matchesSearch(pina, "leches colada"), true);
check("...in any order", matchesSearch(pina, "colada leches"), true);
check("...and all of them", matchesSearch(pina, "colada chocolate"), false);
check("an empty search matches everything", matchesSearch(lemon, ""), true);
check("spaces alone match everything", matchesSearch(lemon, "   "), true);
check("something absent matches nothing", matchesSearch(lemon, "zzz"), false);
check("normalising strips accents", normalize("Piña"), "pina");
check("the haystack has both languages", searchableText(concha).includes("vainilla"), true);

console.log("\n  sorting");
check(
  "bestsellers first by default, then new, then display order",
  sortProducts(all, "featured").map((p) => p._id),
  ["b", "a", "c"]
);
check("newest first", sortProducts(all, "newest").map((p) => p._id), ["c", "a", "b"]);
check("cheapest first", sortProducts(all, "price-asc").map((p) => p._id), ["b", "a", "c"]);
check("dearest first", sortProducts(all, "price-desc").map((p) => p._id), ["c", "a", "b"]);
check("by name", sortProducts(all, "name").map((p) => p._id), ["a", "b", "c"]);
// Without a tie-break the grid shuffles on every keystroke.
const tied = [
  P({ _id: "z", name: "Same", price: 10, displayOrder: 1 }),
  P({ _id: "y", name: "Same", price: 10, displayOrder: 1 }),
];
check("ties keep a fixed order", sortProducts(tied, "price-asc").map((p) => p._id), ["y", "z"]);
check("...whichever way they arrive", sortProducts([...tied].reverse(), "price-asc").map((p) => p._id), ["y", "z"]);
check("a product with no creation date sorts last under newest", sortProducts([lemon, P({ _id: "d", name: "X", price: 1 })], "newest")[0]._id, "c");
check("sorting does not mutate the input", (() => { const before = all.map((p) => p._id); sortProducts(all, "name"); return all.map((p) => p._id).join() === before.join(); })(), true);
check("every sort key has a label", SORT_KEYS.every((k) => !!sortLabel(k, "en") && !!sortLabel(k, "es")), true);
check("the default is bestsellers", defaultFilters.sort, "featured");

console.log("\n  quickest to make (Situación 12)");
// A customer who needs something today sorts by this, not by price.
const onShelf = P({ _id: "s1", name: "Box ready now", price: 25, leadTime: 48, stockQuantity: 6 });
const quick = P({ _id: "s2", name: "Concha", price: 5, leadTime: 8 });
const slow = P({ _id: "s3", name: "Chocoflan", price: 55, leadTime: 48 });
const blank = P({ _id: "s4", name: "No lead time set", price: 9 });
check("stock on the shelf means no wait at all", waitHours(onShelf), 0);
check("...even with a 48-hour lead time on the product", onShelf.leadTime, 48);
check("otherwise the wait is the lead time", waitHours(quick), 8);
// A blank field is Karyana leaving it empty, not a 1000-hour bake. The
// checkout reads it the same way, so the shop must not disagree.
check("a blank lead time is no wait, not an infinite one", waitHours(blank), 0);
check("a negative lead time cannot push a product up or down", waitHours(P({ _id: "s5", name: "X", price: 1, leadTime: -5 })), 0);
check(
  "shortest wait first",
  sortProducts([slow, quick, onShelf], "fastest").map((p) => p._id),
  ["s1", "s2", "s3"]
);
// Two things both ready now: offer the cheaper one first.
check(
  "equal waits go cheapest first",
  sortProducts([blank, onShelf], "fastest").map((p) => p._id),
  ["s4", "s1"]
);
check("it is offered in both languages", [sortLabel("fastest", "es"), sortLabel("fastest", "en")], ["Más rápidos de preparar", "Quickest to make"]);
check("and it is one of the options", SORT_KEYS.includes("fastest"), true);
check("...without displacing bestsellers as the default", defaultFilters.sort, "featured");

console.log("\n  the price slider's ends");
check("from the catalogue, rounded outwards", priceBounds(all), { min: 5, max: 65 });
check(
  "fractional prices round outwards, so nothing sits off the edge",
  priceBounds([P({ _id: "x", name: "X", price: 4.5 }), P({ _id: "y", name: "Y", price: 60.2 })]),
  { min: 4, max: 61 }
);
check("an empty catalogue has no range", priceBounds([]), { min: 0, max: 0 });
check("one product is its own range", priceBounds([concha]), { min: 5, max: 5 });

console.log("\n  the filters together");
check("nothing set returns everything", applyFilters(all, defaultFilters).length, 3);
check(
  "a category narrows it",
  applyFilters(all, { ...defaultFilters, category: "conchas" }).map((p) => p._id),
  ["b"]
);
check(
  "a price ceiling narrows it",
  applyFilters(all, { ...defaultFilters, maxPrice: 60 }).map((p) => p._id).sort(),
  ["a", "b"]
);
// The ceiling is inclusive: a $60 cake must survive a $60 ceiling.
check("the ceiling includes its own value", applyFilters([pina], { ...defaultFilters, maxPrice: 60 }).length, 1);
check("a null ceiling is no ceiling", applyFilters(all, { ...defaultFilters, maxPrice: null }).length, 3);
check(
  "search and category together",
  applyFilters(all, { ...defaultFilters, category: "tres-leches", search: "colada" }).map((p) => p._id),
  ["a"]
);
check(
  "a search that matches nothing in the category gives nothing",
  applyFilters(all, { ...defaultFilters, category: "conchas", search: "colada" }),
  []
);
check(
  "the sort still applies after filtering",
  applyFilters(all, { ...defaultFilters, sort: "price-desc", maxPrice: 60 }).map((p) => p._id),
  ["a", "b"]
);

console.log("\n  whether to offer a 'clear' button");
const bounds = priceBounds(all);
check("nothing set, nothing to clear", isFiltered(defaultFilters, bounds), false);
check("a search counts", isFiltered({ ...defaultFilters, search: "pan" }, bounds), true);
check("spaces alone do not", isFiltered({ ...defaultFilters, search: "   " }, bounds), false);
check("a category counts", isFiltered({ ...defaultFilters, category: "conchas" }, bounds), true);
check("a ceiling below the max counts", isFiltered({ ...defaultFilters, maxPrice: 30 }, bounds), true);
// Dragging the slider to the far right is not a filter.
check("a ceiling at the max does not", isFiltered({ ...defaultFilters, maxPrice: 65 }, bounds), false);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
