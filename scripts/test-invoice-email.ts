/**
 * The invoice email for a phone order — Situación 7.
 *
 *   npm run test:invoice-email
 *
 * The money is the whole reason this email exists: a cake agreed by
 * phone is usually half paid, and the customer needs the balance in
 * writing. So these are mostly about arithmetic that must never be
 * wrong in the customer's favour OR the bakery's.
 */
import {
  formatCents,
  balanceCents,
  paymentSummary,
  invoiceSubject,
  describeLine,
  invoiceBody,
  type InvoiceInput,
} from "../lib/orders/invoice-email";

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

const base: InvoiceInput = {
  orderNumber: "Custom Order #7",
  customerName: "Ana",
  locale: "es",
  lines: [
    { name: "Chocoflán — Size: 10 inch", quantity: 1, priceCents: 9000 },
    { name: "Conchas", quantity: 6, priceCents: 350 },
  ],
  totalCents: 11100,
  paymentStatus: "UNPAID",
};

console.log("\nInvoice email\n");

console.log("  money on the page");
check("cents become dollars", formatCents(9000), "$90.00");
check("...with the cents kept", formatCents(11105), "$111.05");
check("zero is zero", formatCents(0), "$0.00");

console.log("\n  what is owed");
check("unpaid owes the whole total", balanceCents(base), 11100);
check("paid owes nothing", balanceCents({ ...base, paymentStatus: "PAID" }), 0);
check(
  "a deposit owes the difference",
  balanceCents({ ...base, paymentStatus: "DEPOSIT", amountPaidCents: 5000 }),
  6100
);
// Paid is paid. A few cents recorded against a cash payment must not
// produce a balance on an invoice whose headline says PAGADO.
check(
  "paid owes nothing even with an odd amount recorded",
  balanceCents({ ...base, paymentStatus: "PAID", amountPaidCents: 11097 }),
  0
);
// A stale deposit left on a record that was then marked unpaid must not
// quietly reduce the bill.
check(
  "unpaid owes the whole total even with a deposit left on the record",
  balanceCents({ ...base, paymentStatus: "UNPAID", amountPaidCents: 5000 }),
  11100
);
check(
  "an overpayment is never a negative invoice",
  balanceCents({ ...base, paymentStatus: "DEPOSIT", amountPaidCents: 99999 }),
  0
);
check(
  "a deposit of nothing is just unpaid",
  balanceCents({ ...base, paymentStatus: "DEPOSIT", amountPaidCents: 0 }),
  11100
);
check("a nonsense total cannot owe a negative", balanceCents({ ...base, totalCents: -50 }), 0);

console.log("\n  what the customer is told");
const unpaid = paymentSummary(base);
check("unpaid says so", unpaid.label, "PENDIENTE DE PAGO");
check("...and names the amount", unpaid.detail.includes("$111.00"), true);
check("...and flags that something is owed", unpaid.owes, true);

const deposit = paymentSummary({ ...base, paymentStatus: "DEPOSIT", amountPaidCents: 5000 });
check("a deposit says what came in and what is left", deposit.label, "ANTICIPO RECIBIDO");
check("...the amount received", deposit.detail.includes("$50.00"), true);
check("...the total", deposit.detail.includes("$111.00"), true);
check("...and the balance", deposit.detail.includes("$61.00"), true);

const paid = paymentSummary({ ...base, paymentStatus: "PAID" });
check("paid says nothing is owed", paid.owes, false);
check("...in plain words", paid.detail.includes("No tienes nada pendiente"), true);
check("...and in English", paymentSummary({ ...base, locale: "en", paymentStatus: "PAID" }).label, "PAID");

console.log("\n  the subject line");
// The payment status goes in the subject: it is the question the
// customer has before they open anything.
check("it carries the order and the status", invoiceSubject(base), "Factura Custom Order #7 · PENDIENTE DE PAGO — Karyana Bakery");
check(
  "in English too",
  invoiceSubject({ ...base, locale: "en", paymentStatus: "PAID" }),
  "Invoice Custom Order #7 · PAID — Karyana Bakery"
);

console.log("\n  the lines");
check("quantity, name and what that line costs", describeLine({ name: "Conchas", quantity: 6, priceCents: 350 }), "6 × Conchas  $21.00");
check("one is still written out", describeLine({ name: "Chocoflán", quantity: 1, priceCents: 9000 }), "1 × Chocoflán  $90.00");
check("a missing quantity is one", describeLine({ name: "Flan", priceCents: 1000 }), "1 × Flan  $10.00");
check("a line with no price shows no price rather than $0.00", describeLine({ name: "Vela", quantity: 2 }), "2 × Vela");
check("a nameless line does not print 'undefined'", describeLine({ name: "", quantity: 1 }), "1 × —");

console.log("\n  the whole email");
const body = invoiceBody({ ...base, paymentStatus: "DEPOSIT", amountPaidCents: 5000, pickupDate: "2026-12-24 15:00" });
check("it greets them by name", body.startsWith("Hola Ana,"), true);
check("the payment status comes before the items", body.indexOf("ANTICIPO") < body.indexOf("Tu pedido:"), true);
check("the items are there", body.includes("6 × Conchas"), true);
check("the total is there", body.includes("Total: $111.00"), true);
check("the balance is there", body.includes("Por pagar: $61.00"), true);
check("when it is for is there", body.includes("2026-12-24 15:00"), true);
// A paid invoice must not show a balance line at all — a "$0.00 due" on
// an invoice is just something else to phone about.
check("a paid invoice has no balance line", invoiceBody({ ...base, paymentStatus: "PAID" }).includes("Por pagar"), false);
check("no stray 'null' anywhere", /null|undefined/.test(body), false);
check(
  "an order with no name still reads properly",
  invoiceBody({ ...base, customerName: null }).startsWith("Hola,"),
  true
);
check(
  "an order with no items does not crash",
  invoiceBody({ ...base, lines: [] }).includes("Total:"),
  true
);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
