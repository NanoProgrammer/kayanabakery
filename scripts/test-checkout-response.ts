/**
 * What the checkout page does with every answer the server can give it —
 * including no answer at all, which is the one that cost a customer money.
 *
 *   npm run test:checkout
 */
import { interpretCheckoutResponse } from "../lib/checkout/response";

let passed = 0;
let failed = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
    console.log(`      expected: ${JSON.stringify(expected)}`);
    console.log(`      got:      ${JSON.stringify(actual)}`);
  }
}

console.log("\nCheckout — reading the server's answer\n");

console.log("1. The answers that mean the money may already be gone\n");

check(
  "an empty body — the bug the customer hit",
  interpretCheckoutResponse({ ok: false, status: 500, body: "" }),
  { kind: "unconfirmed", reference: "" }
);
check(
  "a gateway timeout with nothing in it",
  interpretCheckoutResponse({ ok: false, status: 504, body: "" }),
  { kind: "unconfirmed", reference: "" }
);
check(
  "whitespace only",
  interpretCheckoutResponse({ ok: false, status: 500, body: "\n  \n" }),
  { kind: "unconfirmed", reference: "" }
);
check(
  "an edge error page instead of JSON",
  interpretCheckoutResponse({ ok: false, status: 502, body: "<!DOCTYPE html><html>502</html>" }),
  { kind: "unconfirmed", reference: "" }
);
check(
  "truncated JSON from a cut connection",
  interpretCheckoutResponse({ ok: true, status: 200, body: '{"ok":true,"orderNum' }),
  { kind: "unconfirmed", reference: "" }
);
check(
  "the server saying it charged the card and lost the order",
  interpretCheckoutResponse({
    ok: false,
    status: 500,
    body: JSON.stringify({ code: "PAID_NOT_SAVED", paid: true, paymentId: "sq_pay_123", error: "…" }),
  }),
  { kind: "unconfirmed", reference: "sq_pay_123" }
);
check(
  "a 200 with nowhere to send the customer is not a success",
  interpretCheckoutResponse({ ok: true, status: 200, body: JSON.stringify({ ok: true }) }),
  { kind: "unconfirmed", reference: "" }
);

console.log("\n2. Real failures, where the card was never charged\n");

check(
  "a declined card keeps Square's own wording",
  interpretCheckoutResponse({
    ok: false,
    status: 402,
    body: JSON.stringify({ error: "Card declined — insufficient funds" }),
  }),
  { kind: "error", message: "Card declined — insufficient funds" }
);
check(
  "a delivery slot taken while they were typing",
  interpretCheckoutResponse({
    ok: false,
    status: 409,
    body: JSON.stringify({ error: "Unable to reserve delivery slot" }),
  }),
  { kind: "error", message: "Unable to reserve delivery slot" }
);
check(
  "an error with no message still says something",
  interpretCheckoutResponse({ ok: false, status: 400, body: JSON.stringify({}) }),
  { kind: "error", message: "Checkout failed" }
);

console.log("\n3. The order going through\n");

check(
  "the redirect the server asked for",
  interpretCheckoutResponse({
    ok: true,
    status: 200,
    body: JSON.stringify({ ok: true, orderNumber: "KAR-202610-00042", redirect: "/checkout/success?order=KAR-202610-00042" }),
  }),
  { kind: "success", redirect: "/checkout/success?order=KAR-202610-00042" }
);
check(
  "built from the order number when no redirect came back",
  interpretCheckoutResponse({
    ok: true,
    status: 200,
    body: JSON.stringify({ ok: true, orderNumber: "KAR-202610-00042" }),
  }),
  { kind: "success", redirect: "/checkout/success?order=KAR-202610-00042" }
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
