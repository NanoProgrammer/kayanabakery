/**
 * El cupón de 2 panes gratis, como tipo propio.
 *
 *   npm run test:free-bread-coupon
 *
 * Karyana no tenía forma de crear este cupón: en el Studio solo había
 * Percent, Fixed $ off y Free shipping. Ahora hay un cuarto tipo, y lo
 * que estos cuidan es lo único que de verdad puede salir caro: que
 * NUNCA descuente dinero. Vale dos panes que van en la caja y los
 * escoge la panadería — el cliente no elige nada.
 */
import { computePricing, COUPON_FREE_BREADS } from "../lib/checkout/pricing";

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

const items = [
  { productId: "p1", price: 500, quantity: 4, categorySlugs: ["conchas"] },
  { productId: "p2", price: 300, quantity: 4, categorySlugs: ["traditional-mexican-bread"] },
];
// 4 × $5 + 4 × $3 = $32
const base = {
  items,
  fulfillmentType: "PICKUP" as const,
  tier: "BASICO" as const,
  isSouthEastCalgary: false,
  hasUsedFirstFreeDelivery: false,
};

const freeBread = (over: Record<string, unknown> = {}) => ({
  code: "DESCUBREPAN-100042",
  discountType: "FREE_BREAD" as const,
  discountValue: 0,
  minOrderCents: 3000,
  ...over,
});

console.log("\nCupón de 2 panes gratis\n");

console.log("  lo único que no puede fallar: no toca el dinero");
const r = computePricing({ ...base, coupon: freeBread() });
check("no descuenta ni un centavo", r.couponDiscountCents, 0);
check("otorga los dos panes", r.freeBreads, 2);
check("...el número que dice la constante", COUPON_FREE_BREADS, 2);
check("no hay errores", r.errors, []);
// Éste es el que importa: aunque alguien escriba un número en el Studio
// por accidente, el cupón sigue sin descontar nada.
check(
  "un valor escrito por error no descuenta nada",
  computePricing({ ...base, coupon: freeBread({ discountValue: 100 }) }).couponDiscountCents,
  0
);
check(
  "...ni siquiera un valor enorme",
  computePricing({ ...base, coupon: freeBread({ discountValue: 99999 }) }).couponDiscountCents,
  0
);
// Y no se cuela como envío gratis por ser "otro" tipo.
check("no regala el envío", r.freeDeliveryReason, "PICKUP");

console.log("  el mínimo de $30");
// Por debajo del mínimo no se promete nada, porque el checkout lo dice
// en voz alta: prometer y después no cumplir es peor que no ofrecerlo.
const small = computePricing({
  ...base,
  items: [{ productId: "p1", price: 500, quantity: 2, categorySlugs: ["conchas"] }],
  coupon: freeBread(),
});
check("por debajo del mínimo no otorga panes", small.freeBreads, 0);
check("...y lo dice", small.errors.length > 0, true);
check("...sin descontar nada tampoco", small.couponDiscountCents, 0);
check("justo en el mínimo sí otorga", computePricing({
  ...base,
  items: [{ productId: "p1", price: 500, quantity: 6, categorySlugs: ["conchas"] }],
  coupon: freeBread(),
}).freeBreads, 2);
check("un cupón sin mínimo otorga siempre", computePricing({
  ...base,
  items: [{ productId: "p1", price: 500, quantity: 1, categorySlugs: ["conchas"] }],
  coupon: freeBread({ minOrderCents: undefined }),
}).freeBreads, 2);

console.log("\n  sin cupón, o con otro");
check("sin cupón no hay panes", computePricing({ ...base, coupon: null }).freeBreads, 0);
check(
  "un cupón de porcentaje no otorga panes",
  computePricing({
    ...base,
    coupon: { code: "WELCOME10", discountType: "PERCENT", discountValue: 10, minOrderCents: 0 },
  }).freeBreads,
  0
);
check(
  "...y sí sigue descontando lo suyo",
  computePricing({
    ...base,
    coupon: { code: "WELCOME10", discountType: "PERCENT", discountValue: 10, minOrderCents: 0 },
  }).couponDiscountCents,
  320
);
check(
  "un cupón de envío gratis no otorga panes",
  computePricing({
    ...base,
    fulfillmentType: "DELIVERY",
    coupon: { code: "SHIP", discountType: "FREE_SHIPPING", discountValue: 0 },
  }).freeBreads,
  0
);
check(
  "...y sí sigue regalando el envío",
  computePricing({
    ...base,
    fulfillmentType: "DELIVERY",
    coupon: { code: "SHIP", discountType: "FREE_SHIPPING", discountValue: 0 },
  }).freeDeliveryReason,
  "COUPON_FREE_SHIPPING"
);

console.log("\n  el total sale igual que sin cupón");
// Si el total cambiara, el cupón estaría descontando algo — que es
// justo lo que no debe hacer.
const sin = computePricing({ ...base, coupon: null });
const con = computePricing({ ...base, coupon: freeBread() });
check("mismo total", con.totalCents, sin.totalCents);
check("mismo subtotal", con.subtotalCents, sin.subtotalCents);
check("mismo impuesto", con.gstCents, sin.gstCents);
check("y los mismos puntos ganados", con.pointsEarned, sin.pointsEarned);
check("la única diferencia son los panes", [sin.freeBreads, con.freeBreads], [0, 2]);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
