/**
 * The GROQ behind the topper suggestion, run against a fake dataset.
 *
 *   npm run test:addons:groq
 *
 * The queries are the risky part: a dereference through an array of
 * references, and a drafts filter. Neither fails loudly if it is wrong — it
 * just quietly returns nothing, and the dialog would never open.
 */
import { evaluate, parse } from "groq-js";

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

const PRODUCT_CATEGORIES = `*[_type == "product" && _id == $productId][0]{
  "categorySlugs": categories[]->slug.current
}`;

const TOPPERS = `*[_type == "product" && $slug in categories[]->slug.current && !(_id in path("drafts.**"))]
  | order(displayOrder asc, name asc) {
    _id, name, nameEs, "slug": slug.current, price, "image": image.asset->url, soldOut
  }`;

const dataset = [
  { _id: "cat-tl", _type: "category", slug: { current: "tres-leches" } },
  { _id: "cat-cakes", _type: "category", slug: { current: "cakes" } },
  { _id: "cat-dec", _type: "category", slug: { current: "decoraciones" } },
  {
    _id: "cake-1",
    _type: "product",
    name: "Tres Leches Fresa",
    slug: { current: "tres-leches-fresa" },
    price: 4000,
    categories: [
      { _type: "reference", _ref: "cat-cakes" },
      { _type: "reference", _ref: "cat-tl" },
    ],
  },
  {
    _id: "concha-1",
    _type: "product",
    name: "Concha",
    slug: { current: "concha" },
    price: 350,
    categories: [{ _type: "reference", _ref: "cat-cakes" }],
  },
  {
    _id: "top-b",
    _type: "product",
    name: "Birthday Candles",
    slug: { current: "birthday-candles" },
    price: 500,
    displayOrder: 2,
    categories: [{ _type: "reference", _ref: "cat-dec" }],
  },
  {
    _id: "top-a",
    _type: "product",
    name: "Happy Birthday Topper",
    nameEs: "Topper de Feliz Cumpleaños",
    slug: { current: "happy-birthday-topper" },
    price: 800,
    displayOrder: 1,
    soldOut: false,
    categories: [{ _type: "reference", _ref: "cat-dec" }],
  },
  {
    // A topper still being written in Studio must not reach the shop.
    _id: "drafts.top-c",
    _type: "product",
    name: "Unpublished Topper",
    slug: { current: "unpublished-topper" },
    price: 900,
    categories: [{ _type: "reference", _ref: "cat-dec" }],
  },
];

async function run(query: string, params: Record<string, unknown>) {
  const tree = parse(query);
  const value = await evaluate(tree, { dataset, params });
  return value.get();
}

(async () => {
  console.log("\nThe GROQ behind the topper offer\n");

  console.log("  reading a product's categories");
  check(
    "a tres leches names both its categories",
    await run(PRODUCT_CATEGORIES, { productId: "cake-1" }),
    { categorySlugs: ["cakes", "tres-leches"] }
  );
  check(
    "a concha names only cakes",
    await run(PRODUCT_CATEGORIES, { productId: "concha-1" }),
    { categorySlugs: ["cakes"] }
  );
  check("a product that does not exist is null", await run(PRODUCT_CATEGORIES, { productId: "nope" }), null);

  console.log("\n  reading the toppers");
  const toppers = (await run(TOPPERS, { slug: "decoraciones" })) as any[];
  check("only the published ones", toppers.map((t) => t._id), ["top-a", "top-b"]);
  check("in display order, not alphabetical", toppers[0]._id, "top-a");
  check("with the price", toppers[0].price, 800);
  check("with the Spanish name when there is one", toppers[0].nameEs, "Topper de Feliz Cumpleaños");
  check("with the slug flattened", toppers[0].slug, "happy-birthday-topper");
  check(
    "the draft is excluded",
    toppers.some((t) => t._id.startsWith("drafts.")),
    false
  );
  check(
    "a category with no products returns nothing, so the dialog stays shut",
    await run(TOPPERS, { slug: "does-not-exist" }),
    []
  );

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  if (failed) process.exit(1);
})();
