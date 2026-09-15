import { guessLanguageFromName } from "@/lib/i18n/guess-language";

export type NotifiableStatus = "READY" | "OUT_FOR_DELIVERY" | "COMPLETED";
export type Locale = "en" | "es";

/**
 * Registered customers have preferredLang; guests have no language field at
 * all, so fall back to guessing from their name rather than defaulting
 * everyone to English (most of the customer base writes in Spanish).
 */
export function resolveCustomerLocale(input: {
  preferredLang?: string | null;
  name?: string | null;
}): Locale {
  if (input.preferredLang === "es") return "es";
  if (input.preferredLang === "en") return "en";
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
