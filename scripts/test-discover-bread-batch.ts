/**
 * La primera tanda de cupones DESCUBREPAN.
 *
 *   npm run test:discover-bread-batch
 *
 * Esto reparte pan gratis mirando hacia atrás, así que lo que estos
 * cuidan es quién NO debe entrar: el que ya compró pan (ya descubrió la
 * panadería), el invitado sin cuenta (no hay "uno por cliente" posible)
 * y el mismo cliente dos veces.
 */
import {
  eligibleCustomers,
  couponCodeForCustomer,
  batchCouponDocument,
  INITIAL_BATCH_SIZE,
  type PastOrder,
} from "../lib/coupons/discover-bread-batch";

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

const cake = { name: "3 Leches Tiramisu", slug: "tres-leches-tiramisu", categorySlugs: ["cakes"] };
const otherCake = { name: "Chocoflan", slug: "chocoflan", categorySlugs: ["cakes"] };
const concha = { name: "Concha Vanilla", slug: "concha-vanilla", categorySlugs: ["conchas"] };
const topper = { name: "Floral Topper Cake", slug: "floral-topper-Cake", categorySlugs: ["cake-toppers"] };

const day = (d: string) => new Date(`2026-${d}T12:00:00Z`);
const order = (
  userId: string | null,
  email: string | null,
  date: string,
  lines: any[],
  name: string | null = "Cliente"
): PastOrder => ({ userId, email, name, createdAt: day(date), lines });

console.log("\nPrimera tanda DESCUBREPAN\n");

console.log("  quién entra");
check(
  "quien compró pastel y nunca pan",
  eligibleCustomers([order("u1", "a@x.com", "11-01", [cake])]).map((c) => c.userId),
  ["u1"]
);
check(
  "dos pasteles siguen siendo un cliente",
  eligibleCustomers([
    order("u1", "a@x.com", "11-01", [cake]),
    order("u1", "a@x.com", "11-10", [otherCake]),
  ]).length,
  1
);
check(
  "...y se cuentan sus pasteles",
  eligibleCustomers([
    order("u1", "a@x.com", "11-01", [cake]),
    order("u1", "a@x.com", "11-10", [otherCake]),
  ])[0].cakeOrders,
  2
);

console.log("\n  quién NO entra");
// La regla entera de Rubén: el cupón es para descubrir el pan. Quien ya
// lo compró, ya lo descubrió.
check(
  "quien alguna vez compró pan queda fuera",
  eligibleCustomers([
    order("u1", "a@x.com", "11-01", [cake]),
    order("u1", "a@x.com", "11-05", [concha]),
  ]),
  []
);
check(
  "...aunque el pan haya sido antes del pastel",
  eligibleCustomers([
    order("u1", "a@x.com", "10-01", [concha]),
    order("u1", "a@x.com", "11-01", [cake]),
  ]),
  []
);
check(
  "...y aunque el pan venga en el mismo pedido",
  eligibleCustomers([order("u1", "a@x.com", "11-01", [cake, concha])]),
  []
);
check("quien nunca compró pastel queda fuera", eligibleCustomers([order("u2", "b@x.com", "11-01", [concha])]), []);
// Un topper no es un pastel, por más que se llame Cake.
check("un topper no da cupón", eligibleCustomers([order("u3", "c@x.com", "11-01", [topper])]), []);
// "Cuenta verificada", dijo Rubén.
check("un invitado sin cuenta queda fuera", eligibleCustomers([order(null, "d@x.com", "11-01", [cake])]), []);
check("una cuenta sin correo queda fuera", eligibleCustomers([order("u4", null, "11-01", [cake])]), []);
check("un pedido sin fecha válida se ignora", eligibleCustomers([{ userId: "u5", email: "e@x.com", name: null, createdAt: new Date("nope"), lines: [cake] }]), []);
check("sin pedidos, nadie", eligibleCustomers([]), []);

console.log("\n  el orden y el tope");
// Los más recientes primero: son los que todavía se acuerdan de Karyana,
// y la prueba de 60 días mide justo eso.
check(
  "el pastel más reciente va primero",
  eligibleCustomers([
    order("viejo", "v@x.com", "01-01", [cake]),
    order("nuevo", "n@x.com", "11-20", [cake]),
  ]).map((c) => c.userId),
  ["nuevo", "viejo"]
);
check("el tope es el número de Rubén", INITIAL_BATCH_SIZE, 30);
const many = Array.from({ length: 50 }, (_, i) => order(`u${i}`, `u${i}@x.com`, "11-01", [cake]));
check("no se reparten más de 30", eligibleCustomers(many).length, 30);
check("se puede pedir menos", eligibleCustomers(many, 5).length, 5);
check("pedir cero no reparte nada", eligibleCustomers(many, 0).length, 0);
// Mismo resultado cada vez: si no, dos clics dan dos listas distintas.
check(
  "la lista es estable",
  eligibleCustomers(many, 5).map((c) => c.userId),
  eligibleCustomers([...many].reverse(), 5).map((c) => c.userId)
);

console.log("\n  el código");
check("lleva el nombre del cupón", couponCodeForCustomer("clx000123").startsWith("DESCUBREPAN-"), true);
check("el mismo cliente da el mismo código", couponCodeForCustomer("clx000123"), couponCodeForCustomer("clx000123"));
check("otro cliente da otro", couponCodeForCustomer("clx000124") === couponCodeForCustomer("clx000123"), false);
// Se lee en voz alta por teléfono y sale en impresora térmica.
check("sin O, I ni Q en la cola", /[OIQ]/.test(couponCodeForCustomer("clxOIQabc").split("-")[1]), false);

console.log("\n  el cupón que se guarda");
const doc = batchCouponDocument({
  userId: "clx000123",
  email: "a@x.com",
  name: "Ana",
  lastCakeAt: day("11-01"),
  cakeOrders: 1,
});
// Lo mismo que el automático: no descuenta dinero. Un cupón que vale
// cero no puede regalar nada por accidente.
check("vale cero", doc.discountValue, 0);
check("...como monto fijo, no porcentaje", doc.discountType, "FIXED");
check("pide los $30", doc.minOrderDollars, 30);
check("una sola vez", doc.maxUses, 1);
check("...por una sola persona", doc.perUserLimit, 1);
check("el id sale del código, así que crearlo dos veces no duplica", doc._id, "coupon-descubrepan-000123");
check("expira en una fecha real", Number.isNaN(Date.parse(doc.expiresAt)), false);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
