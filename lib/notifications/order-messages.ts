import { guessLanguageFromName } from "@/lib/i18n/guess-language";


/**
 * The four states the meeting asked customers to be told about —
 * confirmado, en preparación, en camino, entregado (Situación 10) — plus
 * READY, which is what "en camino" means for a pickup order.
 *
 * Defined in lib/notifications/consent.ts, alongside the rules about who
 * may be messaged, so the list and the rules cannot drift apart.
 */
export type { NotifiableStatus } from "./consent";
import type { NotifiableStatus } from "./consent";
export type Locale = "en" | "es";

/**
 * Registered customers have preferredLang; guests have no language field at
 * all, so fall back to guessing from their name rather than defaulting
 * everyone to English (most of the customer base writes in Spanish).
 */
export function resolveCustomerLocale(input: {
  preferredLang?: string | null;
  name?: string | null;
  /** True only once the customer saved a language in their preferences. */
  langChosenByUser?: boolean | null;
}): Locale {
  // A stated preference settles it, in either direction.
  if (input.langChosenByUser) {
    return input.preferredLang === "es" ? "es" : "en";
  }

  // "es" can only have been set deliberately — the column defaults to "en",
  // so nobody lands on Spanish by accident. "en" tells us nothing, because
  // it is also what every untouched account says, and taking it at face
  // value wrote to the whole customer base in English.
  if (input.preferredLang === "es") return "es";

  return guessLanguageFromName(input.name);
}

type MessageInput = {
  orderNumber: string;
  isPickup: boolean;
};

const MESSAGES: Record<
  NotifiableStatus,
  Record<Locale, (input: MessageInput) => string>
> = {
  // The first message anyone gets. Short on purpose: its job is to say
  // "we have it", not to repeat the receipt Square already sent.
  CONFIRMED: {
    es: ({ orderNumber }) =>
      `🧾 Karyana Bakery: Recibimos tu pedido ${orderNumber}. Te avisamos cuando esté listo.`,
    en: ({ orderNumber }) =>
      `🧾 Karyana Bakery: We've got your order ${orderNumber}. We'll let you know when it's ready.`,
  },
  // "En preparación". This is the one customers ask for by phone — the
  // gap between ordering a cake and hearing anything was the whole
  // complaint.
  IN_PROGRESS: {
    es: ({ orderNumber }) =>
      `👩‍🍳 Karyana Bakery: Ya estamos preparando tu pedido ${orderNumber}.`,
    en: ({ orderNumber }) =>
      `👩‍🍳 Karyana Bakery: We've started on your order ${orderNumber}.`,
  },
  READY: {
    es: ({ orderNumber, isPickup }) =>
      isPickup
        ? `🥖 Karyana Bakery: ¡Tu pedido ${orderNumber} ya está listo! Te esperamos en el horario que elegiste. ¡Gracias por tu preferencia!`
        : `🥖 Karyana Bakery: ¡Tu pedido ${orderNumber} ya está listo! Sale a entrega en tu horario programado.`,
    en: ({ orderNumber, isPickup }) =>
      isPickup
        ? `🥖 Karyana Bakery: Your order ${orderNumber} is ready! See you at your scheduled pickup time. Thank you!`
        : `🥖 Karyana Bakery: Your order ${orderNumber} is ready and goes out for delivery in your scheduled window.`,
  },
  OUT_FOR_DELIVERY: {
    es: ({ orderNumber }) =>
      `🚚 Karyana Bakery: ¡Tu pedido ${orderNumber} va en camino!`,
    en: ({ orderNumber }) =>
      `🚚 Karyana Bakery: Your order ${orderNumber} is on its way!`,
  },
  // The review ask rides on the message that was already going out, and
  // arrives while the bread is still in their hands — the only moment anyone
  // actually writes one.
  //
  // It does cost: the two emoji force UCS-2, which caps a segment at 67
  // characters, so this is three segments instead of one. Kept short for that
  // reason, and a g.page short link in GOOGLE_REVIEW_URL saves ~16 more.
  // No review link here any more. Asking lands while the customer is still in
  // the shop or just back in the car, which is the worst moment to ask anyone
  // to sit and write something — and it made this three SMS segments instead
  // of one. The ask goes out on its own the middle of the next day.
  COMPLETED: {
    es: ({ orderNumber }) =>
      `✅ Karyana Bakery: Tu pedido ${orderNumber} fue completado. ¡Gracias por tu compra! 🧡`,
    en: ({ orderNumber }) =>
      `✅ Karyana Bakery: Your order ${orderNumber} is complete. Thank you for your order! 🧡`,
  },
};

export function orderStatusMessage(
  status: NotifiableStatus,
  locale: Locale,
  input: MessageInput
): string {
  return MESSAGES[status][locale](input);
}
