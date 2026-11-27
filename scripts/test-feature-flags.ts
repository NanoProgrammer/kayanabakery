/**
 * Qué está en vivo y qué espera — el reparto de la junta.
 *
 *   npm run test:feature-flags
 *
 * Santiago va a decirle a Karyana que las situaciones 6, 7, 9, 12 y 13
 * están listas para probar, y que la 8 y la 10 todavía no se anuncian.
 * Estos comprueban que eso es verdad en el código, no solo en el
 * mensaje: que lo que dijo que está, está, y que lo que dijo que no
 * aparece, no aparece.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { KLC_PUBLIC_ROADMAP, NEW_ORDER_STATUS_MESSAGES } from "../lib/feature-flags";
import {
  NOTIFIABLE_STATUSES,
  ALL_NOTIFIABLE_STATUSES,
  EXISTING_NOTIFIABLE_STATUSES,
} from "../lib/notifications/consent";

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

const root = join(__dirname, "..");
const read = (f: string) => readFileSync(join(root, f), "utf8");

console.log("\nWhat is live, and what is waiting\n");

console.log("  the two that were held back, now switched on");
// Santiago asked for both on 27 November. These no longer assert a
// particular value — that would mean editing a test every time he
// changes his mind — they assert that the switch and what it controls
// agree with each other, which is the thing that can actually break.
check("the Club roadmap is on", KLC_PUBLIC_ROADMAP, true);
check("the two new order texts are on", NEW_ORDER_STATUS_MESSAGES, true);
check(
  "the texts that go out follow the switch",
  NOTIFIABLE_STATUSES,
  NEW_ORDER_STATUS_MESSAGES ? ALL_NOTIFIABLE_STATUSES : EXISTING_NOTIFIABLE_STATUSES
);
check("all five states are live", NOTIFIABLE_STATUSES.length, 5);
check(
  "confirmado and en preparación are among them",
  ["CONFIRMED", "IN_PROGRESS"].every((s) => NOTIFIABLE_STATUSES.includes(s as never)),
  true
);

console.log("\n  on or off, the Club is still not for sale");
// This is the one that matters. The pricing table said "$30/month ·
// Subscribe" under a roadmap explaining that levels are earned. Hiding
// the roadmap is no reason to start selling memberships again.
const clubPage = read("app/(pages)/memberships/page.tsx");
check("the page is behind the flag", clubPage.includes("KLC_PUBLIC_ROADMAP"), true);
check("the old pricing table did not come back", clubPage.includes("MembershipPricingTable"), false);
check("there is no membership checkout link on the page", clubPage.includes("membership/checkout"), false);

console.log("\n  what stays on whatever the flags say");
// Consent and the duplicate guard only ever REMOVE unwanted messages.
// Switching them off would text people who asked us to stop, and text
// the same person twice — that is not "waiting to announce it", that is
// breaking it again.
const consent = read("lib/notifications/consent.ts");
const webhook = read("app/api/webhooks/sanity-order/route.ts");
check("the send decision still checks consent", consent.includes('reason: "opted-out"'), true);
check("...and duplicates", consent.includes('reason: "duplicate"'), true);
check("the webhook asks before sending", webhook.includes("shouldNotify"), true);
check("the webhook checks the opt-out list", webhook.includes("hasOptedOut"), true);
check("the flag does not reach the consent rules", /NEW_ORDER_STATUS_MESSAGES/.test(webhook), false);

console.log("\n  the five that are live");
// Each one checked where it actually takes effect, so "it's done" is a
// fact about the code rather than a claim in a message.

// 6 — DESCUBREPAN: minted at checkout, shown to the customer.
const checkout = read("app/api/checkout/route.ts");
check("6 · the coupon is created at checkout", checkout.includes("couponDocument(orderNumber)"), true);
check("6 · the customer is told on the confirmation page", read("app/checkout/success/page.tsx").includes("CouponRegistered"), true);

// 7 — the customer search and the invoice.
check("7 · the order form searches customers", read("sanity/schemas/order.ts").includes("CustomerLookupInput"), true);
check("7 · the invoice button is registered", read("sanity.config.ts").includes("sendInvoiceAction"), true);

// 9 — both doors on the home page.
const home = read("app/page.tsx");
check("9 · cakes are on the home page", home.includes("<CakesSpotlight"), true);
check("9 · so are the bread boxes", home.includes("<BreadBoxesSpotlight"), true);
check("9 · and the cakes come first", home.indexOf("<CakesSpotlight") < home.indexOf("<BreadBoxesSpotlight"), true);

// 12 — the shop sorts.
const shop = read("app/(shop)/shop/page.tsx");
check("12 · the shop reads real sales", shop.includes("readSales"), true);
check("12 · quickest-to-make is one of the sorts", read("lib/products/shop-filters.ts").includes('"fastest"'), true);

// 13 — stock means ready today, and comes down when sold.
check("13 · stock is taken off the shelf after an order", checkout.includes("stockDecrements"), true);
check("13 · stock still means no lead time", read("lib/products/ready-now.ts").includes("isReadyNow"), true);

console.log("\n  none of the five depends on a flag");
// If one of these were gated, Santiago would be telling Karyana to test
// something that is not switched on.
for (const [label, src] of [
  ["checkout", checkout],
  ["home page", home],
  ["shop", shop],
  ["order schema", read("sanity/schemas/order.ts")],
] as const) {
  check(`the ${label} needs no flag`, /KLC_PUBLIC_ROADMAP|NEW_ORDER_STATUS_MESSAGES/.test(src), false);
}

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
