/**
 * What the Karyana Club actually is, in the words shown to customers.
 *
 * Kept in one place because it is a statement about money. The same promise
 * appears on the memberships page, on the pricing table and at the point of
 * paying, and three hand-written versions of "your payment becomes points"
 * would drift until one of them was no longer true.
 *
 * It is true as written: lib/membership/benefit.ts converts the fee at face
 * value — one point is one cent, with no multiplier and nothing withheld — so
 * "every dollar comes back as points" is the code's behaviour, not a slogan.
 * If that conversion ever changes, this file changes with it.
 *
 * The wording is deliberately a prepayment rather than a subscription: the
 * member is buying bread in advance, not renting a perk. The old page sold it
 * as a monthly free loaf alongside a membership fee, which left people unsure
 * what they had actually bought.
 */
export type ClubCopy = {
  name: string;
  eyebrow: string;
  headline: string;
  accent: string;
  whatItIs: string;
  money: string;
  extras: string;
  reassurance: string;
};

export const CLUB_NAME = "Karyana Club";

/**
 * The automatic weekly order, named the same way everywhere it appears: on
 * the pricing table, at the point of subscribing and in the account. It was
 * called "a box every week", "weekly order" and "bread included with monthly
 * payment" in three different places, which read as three different things.
 */
export const AUTO_REORDER = {
  en: "Bread auto reorder",
  es: "Pedido automático de pan",
} as const;

export function autoReorderLabel(locale: string): string {
  return locale === "es" ? AUTO_REORDER.es : AUTO_REORDER.en;
}

export const CLUB_COPY: Record<"en" | "es", ClubCopy> = {
  es: {
    name: CLUB_NAME,
    eyebrow: "Precompra, no suscripción",
    headline: "No es una cuota.",
    accent: "Es tu dinero, guardado para después.",
    whatItIs:
      "El Karyana Club es una precompra de productos y servicios futuros. Pagas por adelantado y usas ese saldo cuando quieras.",
    money:
      "El 100% de lo que pagas vuelve a ti en puntos — 1 punto = 1 centavo, sin descuentos ni letra chica. Gástalos en lo que tú quieras: pan, pasteles, café, lo que sea.",
    extras:
      "Y mientras eres miembro, tienes prioridad en entregas y acceso a cosas que no están abiertas al público.",
    reassurance:
      "No pagas por una membresía. Pagas por adelantado por lo que ya ibas a comprar.",
  },
  en: {
    name: CLUB_NAME,
    eyebrow: "A prepayment, not a subscription",
    headline: "It isn't a fee.",
    accent: "It's your money, saved for later.",
    whatItIs:
      "The Karyana Club is a prepayment for future products and services. You pay up front and spend the balance whenever you like.",
    money:
      "100% of what you pay comes back as points — 1 point = 1 cent, nothing withheld, no small print. Spend them on whatever you want: bread, cakes, coffee, anything.",
    extras:
      "And while you're a member you get priority on deliveries and access to things that aren't open to the public.",
    reassurance:
      "You're not paying for a membership. You're paying in advance for what you were going to buy anyway.",
  },
};

export function clubCopy(locale: string): ClubCopy {
  return locale === "es" ? CLUB_COPY.es : CLUB_COPY.en;
}
