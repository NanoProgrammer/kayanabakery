/**
 * The checkout, in three steps.
 *
 * It was one long column: contact, pickup or delivery, the slot, the
 * address, discounts, tip and the card, all at once. On a phone that is a lot
 * of scrolling to find the one field that is stopping you, and the Pay button
 * sat at the bottom disabled with no indication of which of the seven
 * sections above it was incomplete.
 *
 * Three steps, each with its own answer to "what is missing":
 *
 *   1. Your details  — who the order is for and how to reach them
 *   2. Delivery      — pickup or delivery, when, and where
 *   3. Payment       — discounts, tip, card
 *
 * The completeness rules live here, away from the markup, because they are
 * what decides whether someone can get to the end — and because the Pay
 * button's own check has to agree with them. A step the customer was waved
 * through and a Pay button that then refuses is the same dead end as before.
 */
export type CheckoutStep = 1 | 2 | 3;

export const CHECKOUT_STEPS: CheckoutStep[] = [1, 2, 3];

export type StepState = {
  /** Signed in, or a guest who has given name, email and phone. */
  isSignedIn: boolean;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  /** A signed-in customer whose account has no phone number yet. */
  needsAccountPhone: boolean;
  accountPhone: string;

  fulfillment: "PICKUP" | "DELIVERY";
  pickupDate: string;
  pickupTime: string;
  deliverySlotId: string | null;
  /** Whether an address has actually resolved — see address-choice.ts. */
  hasDeliveryAddress: boolean;
};

function hasText(value: string | null | undefined): boolean {
  return !!value && value.trim().length > 0;
}

/** Step 1: we know who this is and how to reach them. */
export function detailsComplete(s: StepState): boolean {
  if (s.isSignedIn) return !s.needsAccountPhone || hasText(s.accountPhone);
  return hasText(s.guestName) && hasText(s.guestEmail) && hasText(s.guestPhone);
}

/** Step 2: we know when, and for delivery, where. */
export function deliveryComplete(s: StepState): boolean {
  if (s.fulfillment === "PICKUP") {
    return hasText(s.pickupDate) && hasText(s.pickupTime);
  }
  return !!s.deliverySlotId && s.hasDeliveryAddress;
}

export function stepComplete(step: CheckoutStep, s: StepState): boolean {
  if (step === 1) return detailsComplete(s);
  if (step === 2) return deliveryComplete(s);
  // Step 3 is complete when the card is, which only Square can say.
  return detailsComplete(s) && deliveryComplete(s);
}

/** Whether the customer may move on from this step. */
export function canAdvance(step: CheckoutStep, s: StepState): boolean {
  return stepComplete(step, s);
}

/**
 * Stepping back is always allowed; stepping forward only over completed
 * steps, so the stepper's numbers cannot be used to skip a step the Pay
 * button will then refuse.
 */
export function canJumpTo(target: CheckoutStep, current: CheckoutStep, s: StepState): boolean {
  if (target <= current) return true;
  for (let step = current; step < target; step++) {
    if (!stepComplete(step as CheckoutStep, s)) return false;
  }
  return true;
}

/**
 * The first step that is not finished — where to send someone who presses
 * Pay with something missing, rather than leaving them to hunt for it.
 */
export function firstIncompleteStep(s: StepState): CheckoutStep | null {
  if (!detailsComplete(s)) return 1;
  if (!deliveryComplete(s)) return 2;
  return null;
}

export function stepTitle(step: CheckoutStep, locale: string): string {
  const es = locale === "es";
  if (step === 1) return es ? "Tus datos" : "Your details";
  if (step === 2) return es ? "Entrega" : "Delivery";
  return es ? "Pago" : "Payment";
}

/** What is missing on this step, for the line under a disabled button. */
export function whatIsMissing(step: CheckoutStep, s: StepState, locale: string): string | null {
  const es = locale === "es";
  if (step === 1 && !detailsComplete(s)) {
    if (s.isSignedIn) return es ? "Falta tu teléfono" : "Your phone number is missing";
    const missing: string[] = [];
    if (!hasText(s.guestName)) missing.push(es ? "nombre" : "name");
    if (!hasText(s.guestEmail)) missing.push(es ? "correo" : "email");
    if (!hasText(s.guestPhone)) missing.push(es ? "teléfono" : "phone");
    return es ? `Falta: ${missing.join(", ")}` : `Missing: ${missing.join(", ")}`;
  }
  if (step === 2 && !deliveryComplete(s)) {
    if (s.fulfillment === "PICKUP") {
      return es ? "Elige el día y la hora de recolección" : "Choose a pickup day and time";
    }
    if (!s.deliverySlotId) return es ? "Elige un horario de entrega" : "Choose a delivery time";
    return es ? "Falta la dirección de entrega" : "A delivery address is missing";
  }
  return null;
}
