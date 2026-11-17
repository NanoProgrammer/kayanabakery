/**
 * The four cake subcategories, built into the code.
 *
 *   npm run test:cake-families
 *
 * They were meant to be Sanity categories created by a setup script that has
 * never been run, so the Cakes page kept showing one long grid. These tests
 * use the product names actually on karyanabakery.ca today.
 */
import {
  CAKE_FAMILIES,
  familyForProductName,
  familyBySlug,
  groupIntoFamilies,
  unfiled,
  normalizeName,
} from "../lib/products/cake-families";

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
const fam = (name: string) => familyForProductName(name)?.slug ?? null;

console.log("\nThe four cake families\n");

console.log("  there are four");
check("four, in order", CAKE_FAMILIES.map((f) => f.slug), [
  "tres-leches",
  "gourmet",
  "clasicos",
  "gelatinas-y-flanes",
]);
check("gelatinas is the gluten-free one", familyBySlug("gelatinas-y-flanes")?.tagline, "Gluten free");
check("an unknown slug is nothing", familyBySlug("pasteles"), null);

console.log("\n  the products on the site today");
check("3 Leches Tiramisu", fam("3 Leches Tiramisu"), "tres-leches");
check("Classic 3 Leches", fam("Classic 3 Leches"), "tres-leches");
check("Neapolitan Flan Tres Leches", fam("Neapolitan Flan Tres Leches"), "gourmet");
check("Lemon Loaf", fam("Lemon Loaf"), "clasicos");
check("Chocoflan", fam("Chocoflan"), "clasicos");

console.log("\n  the rest of Karyana's table");
check("3 Leches Mango", fam("3 Leches Mango"), "tres-leches");
check("3 Leches Pistacho", fam("3 Leches Pistacho"), "tres-leches");
check("3 Leches Piña Colada", fam("3 Leches Piña Colada"), "tres-leches");
check("3 Leches Dulce de Leche", fam("3 Leches Dulce de Leche"), "tres-leches");
check("3 Leches Chocolate", fam("3 Leches Chocolate"), "tres-leches");
check("3 Leches Eggnog/Rompope", fam("3 Leches Eggnog/Rompope"), "tres-leches");
check("Flan 3 Leches", fam("Flan 3 Leches"), "gourmet");
check("Pineapple Upside Down", fam("Pineapple Upside Down Cake"), "clasicos");
check("Bloom Cake", fam("Bloom Cake"), "clasicos");
check("Gelaflán", fam("Gelaflán"), "gelatinas-y-flanes");
check("Flan Napolitano", fam("Flan Napolitano"), "gelatinas-y-flanes");
check("Gelatina de Mosaico", fam("Gelatina de Mosaico"), "gelatinas-y-flanes");
check("Carlota", fam("Carlota"), "gelatinas-y-flanes");

console.log("\n  the longest match wins");
// "Flan Napolitano" must not be swallowed by the bare "flan" rules, and
// "3 Leches Chocolate" must not be taken by a shorter phrase.
check("flan napolitano beats flan", fam("Flan Napolitano"), "gelatinas-y-flanes");
check("gelaflan is not a gourmet flan", fam("Gelaflan"), "gelatinas-y-flanes");
check("3 leches chocolate is a tres leches", fam("3 Leches Chocolate"), "tres-leches");
check("accents do not matter", fam("Chocoflán"), fam("Chocoflan"));
check("case does not matter", fam("CLASSIC 3 LECHES"), "tres-leches");
check("a size in the name does not matter", fam('3 Leches Mango (8")'), "tres-leches");
check("punctuation does not matter", fam("Pineapple Upside-Down"), "clasicos");
check("normalizing strips accents", normalizeName("Piña Colada"), "pina colada");

console.log("\n  nothing is guessed into a family");
// A cake that matches nothing is shown separately so Karyana can see it
// needs filing — not quietly dropped, and not put somewhere it is not.
check("a topper is not a cake family", fam("Happy Birthday Topper Cake"), null);
check("a concha is not", fam("Concha Tradicional"), null);
check("a brand new cake is not", fam("Mystery Cake 2027"), null);

console.log("\n  splitting a list");
const catalog = [
  { name: "3 Leches Tiramisu" },
  { name: "Classic 3 Leches" },
  { name: "Neapolitan Flan Tres Leches" },
  { name: "Lemon Loaf" },
  { name: "Chocoflan" },
  { name: "Gelatina de Mosaico" },
  { name: "Happy Birthday Topper Cake" },
];
const grouped = groupIntoFamilies(catalog);
check("tres leches gets two", grouped[0].products.map((p) => p.name), ["3 Leches Tiramisu", "Classic 3 Leches"]);
check("gourmet gets the neapolitan", grouped[1].products.map((p) => p.name), ["Neapolitan Flan Tres Leches"]);
check("clásicos gets two", grouped[2].products.map((p) => p.name), ["Lemon Loaf", "Chocoflan"]);
check("gelatinas gets one", grouped[3].products.map((p) => p.name), ["Gelatina de Mosaico"]);
check("the topper is left over", unfiled(catalog).map((p) => p.name), ["Happy Birthday Topper Cake"]);
check(
  "every product lands in exactly one place",
  grouped.reduce((n, g) => n + g.products.length, 0) + unfiled(catalog).length,
  catalog.length
);
check("an empty catalog splits into four empty families", groupIntoFamilies([]).length, 4);
check("...with nothing left over", unfiled([]), []);

/* ------------------------------------------------------------------ */
/* The real catalog, by slug                                           */
/* ------------------------------------------------------------------ */
import { familyForProduct, PRODUCT_FAMILY_BY_SLUG } from "../lib/products/cake-families";

const bySlug = (slug: string, name = "") => familyForProduct({ slug, name })?.slug ?? null;

console.log("\nThe catalog as it stands, by slug\n");

console.log("  tres leches — the eight flavours");
for (const slug of [
  "classic-3-leches",
  "tres-leches-tiramisu",
  "3-leches-mango",
  "pistachio-raspberry-tres-leches-cake",
  "piña-colada",
  "dulce-de-leche",
  "double-chocolate-tres-leches-cake",
  "eggnog-tres-leches-cake",
]) {
  check(slug, bySlug(slug), "tres-leches");
}
check(
  "there are exactly eight of them",
  Object.values(PRODUCT_FAMILY_BY_SLUG).filter((f) => f === "tres-leches").length,
  9 // eight products, plus the unaccented spelling of piña-colada
);

console.log("\n  the two flans, which their names cannot separate");
// "Neapolitan Flan Tres Leches" ($70) and "Artisan Neapolitan Flan" ($50)
// are different products. By name alone both read as a neapolitan flan.
check("flan-tres-leches is the Gourmet one", bySlug("flan-tres-leches"), "gourmet");
check("flan-napolitan is with the flanes", bySlug("flan-napolitan"), "gelatinas-y-flanes");
check("they are not in the same family", bySlug("flan-tres-leches") === bySlug("flan-napolitan"), false);

console.log("\n  clásicos");
check("chocoflan", bySlug("chocoflan"), "clasicos");
check("pineapple-upside-down", bySlug("pineapple-upside-down"), "clasicos");
check("bloom-cake", bySlug("bloom-cake"), "clasicos");
check("lemon-loaf (never assigned by Karyana)", bySlug("lemon-loaf"), "clasicos");

console.log("\n  gelatinas y flanes");
check("mosaic-gelatin", bySlug("mosaic-gelatin"), "gelatinas-y-flanes");
check("gelaflan", bySlug("gelaflan"), "gelatinas-y-flanes");

console.log("\n  the toppers are not a cake family");
check("floral-topper-Cake", bySlug("floral-topper-Cake", "Floral Topper Cake"), null);
check("hp-topper-cake", bySlug("hp-topper-cake", "Happy Birthday Topper Cake"), null);

console.log("\n  slug beats name");
// The slug is what the catalog keys on and never reads two ways.
check(
  "a misleading name does not override the slug",
  bySlug("flan-napolitan", "Neapolitan Flan Tres Leches"),
  "gelatinas-y-flanes"
);
check("case in the slug does not matter", bySlug("CHOCOFLAN"), "clasicos");
check("the unaccented piña colada works too", bySlug("pina-colada"), "tres-leches");
check(
  "a product added later still falls back to its name",
  familyForProduct({ slug: "brand-new-slug", name: "3 Leches Mango" })?.slug,
  "tres-leches"
);
check("...and an unknown one is still nothing", familyForProduct({ slug: "x", name: "Mystery" }), null);

console.log("\n  every cake on the site is filed");
const live = [
  "tres-leches-tiramisu", "classic-3-leches", "flan-tres-leches", "lemon-loaf",
  "dulce-de-leche", "chocoflan", "pistachio-raspberry-tres-leches-cake",
  "mosaic-gelatin", "double-chocolate-tres-leches-cake", "3-leches-mango",
  "piña-colada", "eggnog-tres-leches-cake", "bloom-cake",
  "pineapple-upside-down", "gelaflan", "flan-napolitan",
];
check("all sixteen have a family", live.filter((s) => bySlug(s) === null), []);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
