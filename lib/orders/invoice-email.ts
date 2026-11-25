/**
 * The invoice a customer gets for a phone order, and what it says about
 * money. Situación 7.
 *
 * A custom order is agreed by phone and often half-paid: a deposit on the
 * cake, the rest on collection. The one thing the customer and the bakery
 * both need in writing is where that stands, so the payment line is not a
 * footnote here — it is the thing the email is for.
 *
 * Amounts are in CENTS throughout, because a cake split into a deposit and
 * a balance is exactly where floating-point dollars start losing pennies.
 */
export type PaymentStatus = "UNPAID" | "DEPOSIT" | "PAID";

export type InvoiceLine = {
  name: string;
  quantity?: number | null;
  /** Unit price in cents. */
  priceCents?: number | null;
};

export type InvoiceInput = {
  orderNumber: string;
  customerName?: string | null;
  locale: string;
  lines: readonly InvoiceLine[];
  /** What the order comes to, in cents. The agreed total, not a sum of lines. */
  totalCents: number;
  paymentStatus: PaymentStatus;
  /** Cents already received. Only meaningful for a deposit. */
  amountPaidCents?: number | null;
  pickupDate?: string | null;
  pickupTime?: string | null;
};

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  return `${sign}$${(abs / 100).toFixed(2)}`;
}

/**
 * What is still owed.
 *
 * Paid is paid, whatever was recorded against it — a rounding difference
 * on a cash payment must not produce a 3-cent balance on an invoice that
 * says PAID. Unpaid owes the whole total regardless of any stale deposit
 * left on the record. Only a deposit does arithmetic, and it never goes
 * below zero: an overpayment is a conversation, not a negative invoice.
 */
export function balanceCents(input: InvoiceInput): number {
  const total = Math.max(0, Math.round(input.totalCents || 0));
  switch (input.paymentStatus) {
    case "PAID":
      return 0;
    case "UNPAID":
      return total;
    case "DEPOSIT": {
      const paid = Math.max(0, Math.round(input.amountPaidCents || 0));
      return Math.max(0, total - paid);
    }
  }
}

export type PaymentSummary = {
  /** The headline: PAGADO / PENDIENTE DE PAGO / ANTICIPO RECIBIDO. */
  label: string;
  /** One sentence saying exactly what is owed and when. */
  detail: string;
  /** Whether anything is still owed, for the email's styling. */
  owes: boolean;
};

export function paymentSummary(input: InvoiceInput): PaymentSummary {
  const es = input.locale === "es";
  const total = Math.max(0, Math.round(input.totalCents || 0));
  const owed = balanceCents(input);
  const paid = Math.max(0, Math.round(input.amountPaidCents || 0));

  switch (input.paymentStatus) {
    case "PAID":
      return {
        label: es ? "PAGADO" : "PAID",
        detail: es
          ? `Recibimos ${formatCents(total)}. No tienes nada pendiente.`
          : `We received ${formatCents(total)}. There is nothing left to pay.`,
        owes: false,
      };
    case "DEPOSIT":
      return {
        label: es ? "ANTICIPO RECIBIDO" : "DEPOSIT RECEIVED",
        detail: es
          ? `Recibimos ${formatCents(Math.min(paid, total))} de ${formatCents(total)}. Quedan ${formatCents(owed)} por pagar al recoger tu pedido.`
          : `We received ${formatCents(Math.min(paid, total))} of ${formatCents(total)}. ${formatCents(owed)} is due when you collect your order.`,
        owes: owed > 0,
      };
    case "UNPAID":
      return {
        label: es ? "PENDIENTE DE PAGO" : "PAYMENT PENDING",
        detail: es
          ? `Quedan ${formatCents(owed)} por pagar.`
          : `${formatCents(owed)} is due.`,
        owes: owed > 0,
      };
  }
}

export function invoiceSubject(input: InvoiceInput): string {
  const es = input.locale === "es";
  const { label } = paymentSummary(input);
  return es
    ? `Factura ${input.orderNumber} · ${label} — Karyana Bakery`
    : `Invoice ${input.orderNumber} · ${label} — Karyana Bakery`;
}

/** A line as the invoice prints it: "2 × Chocoflán   $90.00". */
export function describeLine(line: InvoiceLine): string {
  const qty = Math.max(1, Math.round(line.quantity || 1));
  const unit = Math.max(0, Math.round(line.priceCents || 0));
  const name = (line.name || "").trim() || "—";
  const amount = unit > 0 ? `  ${formatCents(unit * qty)}` : "";
  return `${qty} × ${name}${amount}`;
}

/**
 * The whole email as plain text.
 *
 * Plain text on purpose: this goes to someone who ordered by phone, is
 * read on a phone, and has to be forwardable and printable without a
 * layout getting in the way. The payment status leads, because that is
 * the question the customer actually has.
 */
export function invoiceBody(input: InvoiceInput): string {
  const es = input.locale === "es";
  const pay = paymentSummary(input);
  const lines = input.lines.map(describeLine);

  const when =
    input.pickupDate || input.pickupTime
      ? `${es ? "Para" : "For"}: ${[input.pickupDate, input.pickupTime].filter(Boolean).join(" · ")}`
      : null;

  return [
    `${es ? "Hola" : "Hi"}${input.customerName ? ` ${input.customerName}` : ""},`,
    "",
    es
      ? `Aquí está tu factura del pedido ${input.orderNumber}.`
      : `Here is your invoice for order ${input.orderNumber}.`,
    "",
    `${pay.label}`,
    pay.detail,
    "",
    when,
    when ? "" : null,
    es ? "Tu pedido:" : "Your order:",
    ...lines,
    "",
    `${es ? "Total" : "Total"}: ${formatCents(Math.max(0, Math.round(input.totalCents || 0)))}`,
    pay.owes ? `${es ? "Por pagar" : "Balance due"}: ${formatCents(balanceCents(input))}` : null,
    "",
    es ? "Gracias por tu pedido." : "Thank you for your order.",
    "Karyana Bakery",
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}
