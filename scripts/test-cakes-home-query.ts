/**
 * The cakes query behind the home-page spotlight (Situación 9).
 *
 *   npm run test:cakes-home
 *
 * Run against a fake dataset with groq-js, the same engine Sanity uses, so
 * a query that quietly returns nothing is caught here rather than on the
 * live home page. The spotlight renders nothing when the query comes back
 * empty, which is exactly the failure that looks like "you didn't do it".
 */
import { parse, evaluate } from "groq-js";
import { cakesForHomeQuery } from "../sanity/lib/queries";
import { CAKE_FAMILIES, familyForProduct } from "../lib/products/cake-families";

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

const cakesCat = { _id: "cat-cakes", _type: "category", name: "Cakes", slug: { current: "cakes" } };
const conchasCat = {
  _id: "cat-conchas",
  _type: "category",
  name: "Conchas",
  slug: { current: "conchas" },
};
const toppersCat = {
  _id: "cat-toppers",
  _type: "category",
  name: "Cake Toppers",
  slug: { current: "cake-toppers" },
};

const product = (
  id: string,
  name: string,
  cats: string[],
  displayOrder: number,
  withImage = true
) => ({
  _id: id,
  _type: "product",
  name,
  nameEs: name,
  slug: { current: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
  description: "x",
  descriptionEs: "x",
  price: 40,
  displayOrder,
  image: withImage ? { _type: "image", asset: { _ref: `image-${id}` } } : null,
  inStock: true,
  categories: cats.map((c) => ({ _type: "reference", _ref: c })),
});

const dataset = [
  cakesCat,
  conchasCat,
  toppersCat,
  product("p3", "3 Leches Tiramisu", ["cat-cakes"], 3),
  product("p1", "Chocoflan", ["cat-cakes"], 1),
  product("p2", "Gelatina de Mosaico", ["cat-cakes"], 2),
  product("p4", "Flan Napolitano", ["cat-cakes"], 4),
  product("p5", "Concha Vanilla", ["cat-conchas"], 5),
  // Named like a cake, but it is a plastic topper. It must not appear.
  product("p6", "Floral Topper Cake", ["cat-toppers"], 6),
];

(async () => {
  console.log("\nHome-page cakes query\n");

  const tree = parse(cakesForHomeQuery);
  const rows = (await (await evaluate(tree, { dataset })).get()) as any[];

  console.log("  what it returns");
  check("it returns something at all", rows.length > 0, true);
  check(
    "only the cakes",
    rows.map((r) => r.name),
    ["Chocoflan", "Gelatina de Mosaico", "3 Leches Tiramisu", "Flan Napolitano"]
  );
  // The order Karyana set in the Studio, not whatever the database felt
  // like. Proved by the names above: alphabetically "3 Leches Tiramisu"
  // would lead, and it does not — it sits third, where she put it.
  check("ordered by her display order, not by name", rows[0].name, "Chocoflan");
  // displayOrder itself is deliberately not projected: the spotlight never
  // reads it, and the ordering has already happened by then.
  check("...and the field is not shipped to the browser", rows[0].displayOrder, undefined);
  check("no conchas", rows.some((r) => r.name.includes("Concha")), false);
  // The topper is the bug she reported on the home page once already.
  check("no cake toppers", rows.some((r) => r.name.includes("Topper")), false);
  check("it is not capped at four", cakesForHomeQuery.includes("[0...4]"), false);

  console.log("\n  what the spotlight needs from each row");
  const first = rows[0];
  check("a slug to link to", typeof first.slug, "string");
  check("...flattened, not an object", first.slug, "chocoflan");
  check("an image", first.image !== null, true);
  check("a name in both languages", !!first.name && !!first.nameEs, true);
  check("a description", !!first.description, true);
  check(
    "categories, flattened to slugs",
    first.categories.map((c: any) => c.slug),
    ["cakes"]
  );

  console.log("\n  the families the tiles are built from");
  // The spotlight needs at least one photographed cake per family, or the
  // tile is dropped. With the real catalogue every family has several.
  const families = CAKE_FAMILIES.map((f) => ({
    family: f.slug,
    found: rows.some((r) => familyForProduct({ slug: r.slug, name: r.name })?.slug === f.slug),
  }));
  check(
    "each cake in this dataset files into a family",
    rows.every((r) => familyForProduct({ slug: r.slug, name: r.name }) !== null),
    true
  );
  check(
    "three of the four families are represented here",
    families.filter((f) => f.found).map((f) => f.family),
    ["tres-leches", "clasicos", "gelatinas-y-flanes"]
  );

  console.log("\n  an empty catalogue");
  // The home page must not render an empty band if Sanity has no cakes.
  const empty = (await (
    await evaluate(parse(cakesForHomeQuery), { dataset: [cakesCat, product("x", "Concha", ["cat-conchas"], 1)] })
  ).get()) as any[];
  check("returns nothing rather than everything", empty.length, 0);

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  if (failed) process.exit(1);
})();
