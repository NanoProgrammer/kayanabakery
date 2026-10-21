/**
 * Reading the checkout server's answer — including when there isn't one.
 *
 * The card is charged before the order is written, so the dangerous case is
 * not "it failed", it is "we don't know". A function cut short after the
 * charge comes back with an empty body; calling res.json() on that throws
 * "Unexpected end of JSON input", which the customer saw as a plain error and
 * reasonably answered by paying again.
 *
 * So anything we cannot read is treated as "the money may be gone", never as a
 * failure, because the cost of guessing wrong in that direction is a double
 * charge and the cost of guessing wrong the other way is a phone call.
 */
export type CheckoutOutcome =
  | { kind: "success"; redirect: string }
  | { kind: "unconfirmed"; reference: string }
  | { kind: "error"; message: string };

export function interpretCheckoutResponse(input: {
  ok: boolean;
  status: number;
  body: string;
}): CheckoutOutcome {
  let data: any = null;
  if (input.body.trim()) {
    try {
      data = JSON.parse(input.body);
    } catch {
      data = null;
    }
  }

  // No readable answer: a timeout, a crash, an edge error page. The request may
  // well have reached Square before whatever went wrong.
  if (data === null || typeof data !== "object") {
    return { kind: "unconfirmed", reference: "" };
  }

  if (!input.ok) {
    // The server got far enough to tell us it charged the card and then lost
    // the order, and handed us the reference to quote.
    if (data.code === "PAID_NOT_SAVED" || data.paid === true) {
      return { kind: "unconfirmed", reference: typeof data.paymentId === "string" ? data.paymentId : "" };
    }
    return {
      kind: "error",
      message: typeof data.error === "string" && data.error ? data.error : "Checkout failed",
    };
  }

  const redirect =
    typeof data.redirect === "string" && data.redirect
      ? data.redirect
      : data.orderNumber
      ? `/checkout/success?order=${encodeURIComponent(String(data.orderNumber))}`
      : null;

  // A 200 we cannot act on is not a success — there is nowhere to send the
  // customer, and the money is just as gone.
  if (!redirect) return { kind: "unconfirmed", reference: "" };

  return { kind: "success", redirect };
}
