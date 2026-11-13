/**
 * A coupon limited to one category.
 *
 *   npm run test:coupon-scope
 *
 * Every coupon carries an `appliesTo`, and until now nothing read it: a
 * "cakes only" coupon took its percentage off the whole order. That was
 * harmless while the coupons were 10% off, and stops being harmless the
 * moment a 100% one exists — the free-cake referral reward is exactly that,
 * and without this it would have given away the entire cart.
 */
import { computePricing, couponCovers } from "../lib/checkout/pricing";

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

const base = {
  fulfillmentType: "PICKUP" as const,
  tier: "BASICO" as const,
  isSouthEastCalgary: false,
  hasUsedFirstFreeDelivery: false,
};

// A $60 cake and a $10 bag of conchas.
const cart = [
  { productId: "cake", slug: "tres-leches-mango", price: 6000, quantity: 1, categorySlugs: ["cakes", "tres-leches"] },
  { productId: "concha", slug: "concha", price: 1000, quantity: 1, categorySlugs: ["pan-dulce"] },
];

const freeCake = {
  code: "CAKE10-ABC-1",
  discountType: "PERCENT" as const,
  discountValue: 100,
  // Studio's own format: "ALL or CATEGORY:slug or PRODUCT:slug".
  appliesTo: "CATEGORY:cakes",
};

console.log("\nA coupon limited to one category\n");

const scoped = computePricing({ ...base, items: cart, coupon: freeCake });
check("the subtotal is the whole cart", scoped.subtotalCents, 7000);
// THE test. Without the scope this was 7000 and the conchas were free too.
check("100% off cakes discounts the cake only", scoped.couponDiscountCents, 6000);
check("...so the conchas are still paid for", scoped.subtotalCents - scoped.couponDiscountCents, 1000);

const unscoped = computePricing({
  ...base,
  items: cart,
  coupon: { ...freeCake, appliesTo: "ALL" },
});
check('"ALL" still discounts everything', unscoped.couponDiscountCents, 7000);
const noScope = computePricing({
  ...base,
  items: cart,
  coupon: { code: "X", discountType: "PERCENT", discountValue: 100, discountValue2: undefined } as any,
});
check("a coupon with no scope set discounts everything, as before", noScope.couponDiscountCents, 7000);

console.log("\n  partial amounts");
check(
  "10% off cakes is 10% of the cake",
  computePricing({ ...base, items: cart, coupon: { ...freeCake, discountValue: 10 } }).couponDiscountCents,
  600
);
check(
  "a fixed $15 off cakes never exceeds the cake",
  computePricing({
    ...base,
    items: cart,
    coupon: { code: "X", discountType: "FIXED", discountValue: 1500, appliesTo: "cakes" },
  }).couponDiscountCents,
  1500
);
check(
  "...and a fixed $80 off cakes stops at the cake's price",
  computePricing({
    ...base,
    items: cart,
    coupon: { code: "X", discountType: "FIXED", discountValue: 8000, appliesTo: "cakes" },
  }).couponDiscountCents,
  6000
);

console.log("\n  nothing eligible");
check(
  "a cakes coupon on a cart with no cake discounts nothing",
  computePricing({
    ...base,
    items: [{ productId: "concha", slug: "concha", price: 1000, quantity: 1, categorySlugs: ["pan-dulce"] }],
    coupon: freeCake,
  }).couponDiscountCents,
  0
);
check(
  "an item with no categories is not eligible",
  computePricing({
    ...base,
    items: [{ productId: "mystery", price: 1000, quantity: 1 }],
    coupon: freeCake,
  }).couponDiscountCents,
  0
);

console.log("\n  the formats Studio accepts");
const cake = cart[0];
const concha = cart[1];
check('"ALL" covers everything', couponCovers("ALL", concha), true);
check("an empty scope covers everything", couponCovers("", concha), true);
check("a missing scope covers everything", couponCovers(null, concha), true);
check("CATEGORY:cakes covers the cake", couponCovers("CATEGORY:cakes", cake), true);
check("...and not the concha", couponCovers("CATEGORY:cakes", concha), false);
check("PRODUCT:slug covers that product", couponCovers("PRODUCT:tres-leches-mango", cake), true);
check("...and not another", couponCovers("PRODUCT:tres-leches-mango", concha), false);
check("a bare slug is read as a category", couponCovers("cakes", cake), true);
check("case does not matter", couponCovers("category:CAKES", cake), true);
check("whitespace does not matter", couponCovers(" CATEGORY : cakes ", cake), true);
// A typo in Studio must not turn a cake coupon into one for the whole cart.
check("an unknown prefix covers nothing", couponCovers("BASKET:cakes", cake), false);
check("a prefix with no value covers nothing", couponCovers("CATEGORY:", cake), false);
check("an unknown bare value covers nothing", couponCovers("pasteles", cake), false);
check("an item with no categories is covered by nothing but ALL", couponCovers("CATEGORY:cakes", { productId: "x" }), false);

console.log("\n  quantity and the minimum order");
check(
  "two cakes, 100% off cakes, both free",
  computePricing({
    ...base,
    items: [{ productId: "cake", slug: "c", price: 6000, quantity: 2, categorySlugs: ["cakes"] }],
    coupon: freeCake,
  }).couponDiscountCents,
  12000
);
// "Spend $30" means the order, not the part the coupon can touch.
const minOrder = computePricing({
  ...base,
  items: cart,
  coupon: { ...freeCake, minOrderCents: 6500 },
});
check("a $65 minimum is met by the $70 order", minOrder.couponDiscountCents, 6000);
check("...with no error", minOrder.errors.length, 0);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
