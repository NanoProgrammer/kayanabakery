/**
 * "Descubre Pan" — buy a cake, get two breads next time.
 *
 *   npm run test:discover-bread
 *
 * The thing these guard above all: the coupon must never take money off a
 * bill. It is worth two breads, and two breads go IN THE BOX — chosen by the
 * bakery. A coupon that discounts nothing cannot give anything away by
 * accident.
 */
import {
  FREE_BREADS,
  VALID_FOR_DAYS,
  MIN_ORDER_DOLLARS,
  COUPON_NAME,
  REGISTERED_MESSAGE,
  isCake,
  isBread,
  earnsCoupon,
  canRedeem,
  couponCodeFor,
  slipNoteForEarned,
  slipNoteForRedeemed,
  isDiscoverBreadCode,
  couponDocument,
} from "../lib/coupons/discover-bread";

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
const chocoflan = { name: "Chocoflan", slug: "chocoflan", categorySlugs: ["cakes"] };
const concha = { name: "Concha Vanilla", slug: "concha-vanilla", categorySlugs: ["conchas"] };
const bolillo = { name: "Bolillo", slug: "bolillo", categorySlugs: ["traditional-mexican-bread"] };
const topper = { name: "Floral Topper Cake", slug: "floral-topper-Cake", categorySlugs: ["cake-toppers"] };

console.log("\nDiscover Bread\n");

console.log("  the coupon is worth nothing in money");
// This is the whole safety of the design. A percentage would come off a
// cake as happily as off a bolillo; a fixed amount means guessing which
// two breads. Zero cannot be wrong.
const doc = couponDocument("KAR-202611-00042");
check("its value is zero", doc.discountValue, 0);
check("...as a fixed amount, not a percentage", doc.discountType, "FIXED");
check("it can be used once", doc.maxUses, 1);
check("...by one person", doc.perUserLimit, 1);
check("it expires", VALID_FOR_DAYS, 90);
check("...on a real date", Number.isNaN(Date.parse(doc.expiresAt)), false);
check("two breads", FREE_BREADS, 2);
check("the document id follows the code", doc._id, "coupon-descubrepan-100042");
// Thirty dollars of bread, before tax. Enforced by the coupon so it cannot
// be forgotten at the till.
check("it needs a $30 order", doc.minOrderDollars, 30);
check("...the number from the meeting", MIN_ORDER_DOLLARS, 30);

console.log("\n  who earns one");
check("an order with a cake does", earnsCoupon([cake, concha]), true);
check("a cake on its own does", earnsCoupon([cake]), true);
check("bread alone does not", earnsCoupon([concha, bolillo]), false);
check("an empty order does not", earnsCoupon([]), false);
// A topper is not a cake, however it is named.
check("a topper does not", earnsCoupon([topper]), false);
check("a chocoflán counts as a cake", isCake(chocoflan), true);
check("a cake is recognised by category", isCake({ name: "Mystery", categorySlugs: ["cakes"] }), true);
check("...and by its name when the category is missing", isCake({ name: "3 Leches Mango" }), true);

console.log("\n  who can use one");
check("an order with conchas can", canRedeem([concha]), true);
check("traditional bread can", canRedeem([bolillo]), true);
// The offer is for discovering the BREAD. A cake alone is not bread.
check("a cake alone cannot", canRedeem([cake]), false);
check("a cake plus bread can", canRedeem([cake, concha]), true);
check("an empty order cannot", canRedeem([]), false);
check("a cake is never counted as bread", isBread(cake), false);
check("a topper is not bread either", isBread(topper), false);

console.log("\n  the code");
check("it is named DESCUBREPAN", COUPON_NAME, "DESCUBREPAN");
check("the code carries the name and the order", couponCodeFor("KAR-202611-00042"), "DESCUBREPAN-100042");
check("the same order gives the same code", couponCodeFor("KAR-202611-00042"), couponCodeFor("KAR-202611-00042"));
check("a different order gives a different one", couponCodeFor("KAR-202611-00043") === couponCodeFor("KAR-202611-00042"), false);
// It gets read aloud over the phone and printed on a receipt printer.
// The tail is read aloud and printed on a receipt printer, so O and 0
// must not have to be told apart. (The name itself has an O, which is
// fine — nobody mishears "DESCUBREPAN".)
check("the tail has no letter O", couponCodeFor("KAR-2026-OOOO11").split("-")[1].includes("O"), false);
check("no I or Q in the tail either", /[IQ]/.test(couponCodeFor("KAR-IQIQIQ").split("-")[1]), false);
check("it is upper case and safe to type", /^DESCUBREPAN-[A-Z0-9]+$/.test(couponCodeFor("kar-202611-00042")), true);
check("an empty order number still gives a code", couponCodeFor(""), "DESCUBREPAN-");
check("a DESCUBREPAN code is recognised", isDiscoverBreadCode("DESCUBREPAN-100042"), true);
check("...in lower case too", isDiscoverBreadCode("descubrepan-100042"), true);
check("...and the bare name", isDiscoverBreadCode("DESCUBREPAN"), true);
check("another coupon is not", isDiscoverBreadCode("WELCOME10"), false);
check("nor the free-cake one", isDiscoverBreadCode("CAKE10-ABC-1"), false);
check("nor nothing", isDiscoverBreadCode(null), false);

console.log("\n  what the kitchen reads");
const earnedEs = slipNoteForEarned("KAR-202611-00042", "es");
check("the cake's slip carries the code", earnedEs.includes("DESCUBREPAN-100042"), true);
// The exact words the meeting asked the customer to receive.
check("...and says the coupon is registered", earnedEs.includes(REGISTERED_MESSAGE.es), true);
check("the registered message is the one agreed", REGISTERED_MESSAGE.es, "¡TU CUPÓN HA SIDO REGISTRADO!");
// An instruction, not a price: nobody should be working out a discount.
// Worded exactly as the meeting asked: this is the line the kitchen acts on.
check("the comanda line is the agreed wording", slipNoteForRedeemed("es"), "DESCUBREPAN — AGREGAR 2 PANES GRATIS");
check("...and in English", slipNoteForRedeemed("en"), "DESCUBREPAN — ADD 2 FREE BREADS");

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
