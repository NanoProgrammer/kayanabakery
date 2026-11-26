/**
 * El reporte que deja comprobar la Situación 13.
 *
 *   npm run test:stock-report
 *
 * Santiago no quiere decirle a su cliente que el pickup inmediato
 * funciona sin haberlo visto. Esta pantalla es para que lo compruebe
 * él, así que lo que estos cuidan es que la pantalla no mienta: que
 * diga "hoy mismo" exactamente cuando el checkout lo diría, y que
 * levante la bandera justo en la forma que tenía el bug.
 */
import { stockReport, stockSummary } from "../lib/products/stock-report";
import { isReadyNow } from "../lib/products/ready-now";

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

const P = (name: string, slug: string, stockQuantity: number | null, leadTime = 24) => ({
  _id: `id-${slug}`,
  name,
  slug,
  stockQuantity,
  leadTime,
});

console.log("\nReporte de inventario\n");

console.log("  quién sale en la tabla");
const catalogue = [
  P("Family Box", "family-box", 6),
  P("Fiesta Box", "fiesta-box", 0),
  // Sin número: es por encargo, no pertenece a este reporte.
  P("Chocoflan", "chocoflan", null, 48),
];
check("solo los que tienen inventario", stockReport(catalogue, {}).map((r) => r.name), [
  "Fiesta Box",
  "Family Box",
]);
check("un producto por encargo no aparece", stockReport(catalogue, {}).some((r) => r.name === "Chocoflan"), false);
// Cero SÍ se maneja: significa agotado, y hay que poder verlo.
check("el agotado sí aparece", stockReport(catalogue, {}).find((r) => r.name === "Fiesta Box")?.stock, 0);
check("sin catálogo, tabla vacía", stockReport([], {}), []);

console.log("\n  lo que dice de cada uno coincide con el checkout");
// Si la pantalla dice "hoy mismo" y el checkout no lo ofrece, la
// pantalla miente y la prueba de Santiago no vale nada.
for (const stock of [0, 1, 3, 10]) {
  const row = stockReport([P("X", "x", stock)], {})[0];
  check(
    `con ${stock} en stock dice lo mismo que el checkout`,
    row.readyNow,
    isReadyNow({ stockQuantity: stock, quantity: 1 })
  );
}
check("un stock negativo no se ofrece para hoy", stockReport([P("X", "x", -2)], {})[0].readyNow, false);

console.log("\n  las ventas");
const sales = { "family-box": 4, "fiesta-box": 2 };
check("cuenta lo vendido", stockReport(catalogue, sales).find((r) => r.name === "Family Box")?.sold, 4);
check("sin ventas, cero", stockReport(catalogue, {}).find((r) => r.name === "Family Box")?.sold, 0);
check("sin datos de ventas tampoco truena", stockReport(catalogue, null).find((r) => r.name === "Family Box")?.sold, 0);

console.log("\n  la bandera que delata el bug");
// El bug era exactamente éste: se vendieron seis cajas y el número
// seguía en seis. Vender tanto o más de lo que dice haber, sin que el
// número se moviera, es la forma que tenía.
check(
  "vendió 6 y sigue marcando 6: sospechoso",
  stockReport([P("Box", "box", 6)], { box: 6 })[0].suspicious,
  true
);
check(
  "vendió 2 de 6: normal",
  stockReport([P("Box", "box", 6)], { box: 2 })[0].suspicious,
  false
);
check(
  "no vendió nada: normal",
  stockReport([P("Box", "box", 6)], {})[0].suspicious,
  false
);
// Un agotado que vendió es lo correcto, no un error: bajó hasta cero.
check(
  "agotado después de vender: correcto, no sospechoso",
  stockReport([P("Box", "box", 0)], { box: 6 })[0].suspicious,
  false
);

console.log("\n  el orden");
// Lo que hay que mirar, arriba.
const mixed = [
  P("Normal", "normal", 9),
  P("Agotado", "agotado", 0),
  P("Sospechoso", "sospechoso", 5),
];
check(
  "primero lo sospechoso, luego lo que se está acabando",
  stockReport(mixed, { sospechoso: 5 }).map((r) => r.name),
  ["Sospechoso", "Agotado", "Normal"]
);
check(
  "el orden es estable",
  stockReport(mixed, {}).map((r) => r.name),
  stockReport([...mixed].reverse(), {}).map((r) => r.name)
);

console.log("\n  el resumen de arriba");
const rows = stockReport(
  [P("A", "a", 5), P("B", "b", 0), P("C", "c", 3)],
  { c: 3 }
);
check("cuenta los que manejan inventario", stockSummary(rows).managed, 3);
check("cuenta los listos hoy", stockSummary(rows).readyNow, 2);
check("cuenta los agotados", stockSummary(rows).soldOut, 1);
check("cuenta los que hay que revisar", stockSummary(rows).suspicious, 1);
check("con la tabla vacía, todo en cero", stockSummary([]), { managed: 0, readyNow: 0, soldOut: 0, suspicious: 0 });

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
