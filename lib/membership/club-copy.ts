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
  en: "Autoorder",
  es: "Autoorden",
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

/* ------------------------------------------------------------------ */
/* The proposed earned scheme                                          */
/* ------------------------------------------------------------------ */

/**
 * How the Club is described once tiers are EARNED rather than bought.
 *
 * Not shown anywhere yet: it appears only when KLC_LIVE is turned on, and
 * that is false. Written now so the page can be seen at the meeting beside
 * the one customers actually have.
 */
export const EARNED_CLUB_COPY: Record<"en" | "es", ClubCopy & { keeping: string }> = {
  es: {
    name: CLUB_NAME,
    eyebrow: "Se gana, no se compra",
    headline: "No se paga.",
    accent: "Se gana comprando pan.",
    whatItIs:
      "Tu nivel en el Karyana Club sube solo: cada compra, cada persona que invitas y cada cosa nueva que pruebas te acerca al siguiente.",
    money:
      "No hay cuota. Nada que cobrar, nada que cancelar. Los puntos que ya tienes siguen siendo tuyos.",
    extras:
      "Entre más alto tu nivel, más prioridad en entregas, más acceso a cosas que no están abiertas al público, y en Legendario Karyana hace tu pastel de cumpleaños ella misma.",
    reassurance: "Una familia a la vez.",
    keeping:
      "El nivel se conserva comprando. Si dejas de venir baja poco a poco — nunca de golpe, y siempre con aviso antes.",
  },
  en: {
    name: CLUB_NAME,
    eyebrow: "Earned, not bought",
    headline: "There's nothing to pay.",
    accent: "You earn it by buying bread.",
    whatItIs:
      "Your place in the Karyana Club rises on its own: every order, every person you invite and every new thing you try moves you closer to the next one.",
    money:
      "No fee. Nothing to charge, nothing to cancel. The points you already have stay yours.",
    extras:
      "The higher you are, the more priority on deliveries, the more access to things that aren't open to the public — and at Legendario, Karyana makes your birthday cake herself.",
    reassurance: "One family at a time.",
    keeping:
      "You keep your place by buying. Stop coming and it eases back down — never all at once, and never without telling you first.",
  },
};

export function earnedClubCopy(locale: string) {
  return locale === "es" ? EARNED_CLUB_COPY.es : EARNED_CLUB_COPY.en;
}
