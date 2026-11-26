/**
 * Qué sale en la portada — Situación 9.
 *
 *   npm run test:home-sections
 *
 * Estos existen por un error concreto: la portada buscaba el slug
 * exacto `cakes` en Sanity. No puedo abrir Sanity desde aquí para
 * comprobar cómo se llama esa categoría, así que lo adiviné, y si el
 * slug es otro la sección devuelve cero productos y no se pinta nada.
 * El cliente ve la portada idéntica y parece que nadie hizo nada.
 *
 * Así que la prueba central es ésa: los pasteles tienen que aparecer
 * AUNQUE la categoría se llame de otra forma.
 */
import { selectCakes, selectBreadBoxes, isCakeProduct, isBreadBoxProduct } from "../lib/products/home-sections";

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

const img = { _type: "image", asset: { _ref: "image-x" } };
const P = (
  name: string,
  slug: string,
  cats: { slug?: string; name?: string }[],
  extra: Record<string, unknown> = {}
) => ({ _id: `id-${slug}`, name, slug, image: img, categories: cats, displayOrder: 50, ...extra });

// Los 16 pasteles reales del catálogo de Karyana.
const REAL_CAKES: [string, string][] = [
  ["Classic 3 Leches", "classic-3-leches"],
  ["3 Leches Tiramisu", "tres-leches-tiramisu"],
  ["3 Leches Mango", "3-leches-mango"],
  ["Pistachio Raspberry Tres Leches Cake", "pistachio-raspberry-tres-leches-cake"],
  ["Piña Colada", "pina-colada"],
  ["Dulce de Leche", "dulce-de-leche"],
  ["Double Chocolate Tres Leches Cake", "double-chocolate-tres-leches-cake"],
  ["Eggnog Tres Leches Cake", "eggnog-tres-leches-cake"],
  ["Flan Tres Leches", "flan-tres-leches"],
  ["Chocoflan", "chocoflan"],
  ["Pineapple Upside Down", "pineapple-upside-down"],
  ["Bloom Cake", "bloom-cake"],
  ["Lemon Loaf", "lemon-loaf"],
  ["Mosaic Gelatin", "mosaic-gelatin"],
  ["Gelaflan", "gelaflan"],
  ["Flan Napolitan", "flan-napolitan"],
];

console.log("\nLa portada\n");

console.log("  el error que esto arregla");
// ÉSTE es el que importa. Categoría con un slug que no es "cakes": la
// versión anterior devolvía cero y la portada se veía igual que siempre.
const weirdCategory = [{ slug: "confectionery", name: "Confectionery" }];
check(
  "los 16 pasteles aparecen aunque la categoría NO se llame 'cakes'",
  selectCakes(REAL_CAKES.map(([n, s]) => P(n, s, weirdCategory))).length,
  16
);
check(
  "...y aunque no tengan categoría ninguna",
  selectCakes(REAL_CAKES.map(([n, s]) => P(n, s, []))).length,
  16
);
check(
  "...y aunque la categoría venga en null",
  selectCakes([{ _id: "x", name: "Chocoflan", slug: "chocoflan", image: img, categories: null }]).length,
  1
);
// Y si el slug SÍ es "cakes", sigue funcionando por el camino normal.
check(
  "un producto que no conozco entra por su categoría",
  isCakeProduct(P("Pastel Nuevo de Karyana", "pastel-nuevo", [{ slug: "cakes", name: "Cakes" }])),
  true
);
check(
  "...o por el nombre de la categoría en español",
  isCakeProduct(P("Algo Nuevo", "algo-nuevo", [{ slug: "xyz", name: "Pasteles" }])),
  true
);

console.log("\n  lo que NO es pastel");
// Un topper es plástico. Ya se coló una vez y Karyana lo reportó.
check("un topper no es pastel", isCakeProduct(P("Floral Topper Cake", "floral-topper-Cake", [{ slug: "cake-toppers", name: "Cake Toppers" }])), false);
check("...ni aunque lo metan en la categoría de pasteles", isCakeProduct(P("HP Topper Cake", "hp-topper-cake", [{ slug: "cakes", name: "Cakes" }])), false);
check("una concha no es pastel", isCakeProduct(P("Concha Vanilla", "concha-vanilla", [{ slug: "conchas", name: "Conchas" }])), false);
check("un bolillo tampoco", isCakeProduct(P("Bolillo", "bolillo", [{ slug: "traditional-mexican-bread", name: "Traditional Mexican Bread" }])), false);

console.log("\n  las cajas de pan");
check("por su categoría", isBreadBoxProduct(P("Family Box", "family-box", [{ slug: "boxes", name: "Boxes" }])), true);
// La categoría que de verdad se ve en su tienda.
check("por 'Pan Dulce Assortments', que es como se llama en su tienda", isBreadBoxProduct(P("Mix", "mix", [{ slug: "pan-dulce-assortments", name: "Pan Dulce Assortments" }])), true);
check("por el nombre, sin categoría útil", isBreadBoxProduct(P("Fiesta Box", "fiesta-box", [{ slug: "otra", name: "Otra" }])), true);
check("una caja en español", isBreadBoxProduct(P("Caja Familiar", "caja-familiar", [])), true);
check("un paquete de conchas", isBreadBoxProduct(P("Conchas Pack 6", "conchas-pack-6", [{ slug: "conchas", name: "Conchas" }])), true);
// Lo importante: un pastel nunca cae en la sección de cajas.
check("un pastel no es una caja", isBreadBoxProduct(P("Chocoflan", "chocoflan", [{ slug: "cakes", name: "Cakes" }])), false);
check("...ni un 'Bloom Cake' por decir Cake", isBreadBoxProduct(P("Bloom Cake", "bloom-cake", [])), false);
check("una concha suelta no es una caja", isBreadBoxProduct(P("Concha Vanilla", "concha-vanilla", [{ slug: "conchas", name: "Conchas" }])), false);

console.log("\n  lo que se muestra");
const catalogue = [
  ...REAL_CAKES.map(([n, s]) => P(n, s, weirdCategory)),
  P("Family Box", "family-box", [{ slug: "boxes" }]),
  P("Fiesta Box", "fiesta-box", [{ slug: "boxes" }], { displayOrder: 1 }),
  P("Mega Fiesta Box", "mega-fiesta-box", [{ slug: "boxes" }]),
  P("Pan Dulce Mix Box", "pan-dulce-mix-box", [{ slug: "boxes" }]),
  P("Conchas Pack 6", "conchas-pack-6", [{ slug: "conchas" }]),
  P("Concha Vanilla", "concha-vanilla", [{ slug: "conchas" }]),
  P("Floral Topper Cake", "floral-topper-Cake", [{ slug: "cake-toppers" }]),
];
check("los pasteles salen", selectCakes(catalogue).length, 16);
check("ningún topper entre ellos", selectCakes(catalogue).some((p) => p.name.includes("Topper")), false);
check("las cajas se limitan a cuatro, para que la fila quede pareja", selectBreadBoxes(catalogue).length, 4);
check("la primera es la que Karyana puso primero", selectBreadBoxes(catalogue)[0].name, "Fiesta Box");
// Un hueco gris en la portada es peor que una sección más corta.
check(
  "un producto sin foto no se muestra",
  selectCakes([{ _id: "n", name: "Chocoflan", slug: "chocoflan", image: null, categories: [] }]).length,
  0
);
check("sin catálogo, no hay secciones", [selectCakes([]).length, selectBreadBoxes([]).length], [0, 0]);
// Mismo orden siempre: si no, la portada baila entre recargas.
check(
  "el orden es estable",
  selectCakes(catalogue).map((p) => p._id),
  selectCakes([...catalogue].reverse()).map((p) => p._id)
);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
