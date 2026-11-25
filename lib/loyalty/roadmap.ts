/**
 * The game, written down: Básico to Legendario.
 *
 * Situación 8 asked for the climb to be SHOWN to customers — "como es el
 * juego de empezar por básico hasta llegar a legendario". A ladder nobody
 * can see is not a game, it is a filing system.
 *
 * Every number here is read from the tier data and the lead-time table
 * rather than typed again, because the one certain thing about thresholds
 * and perks is that they move. If Karyana changes a lead time, this page
 * changes with it.
 *
 * It describes the EARNED scheme (lib/loyalty/standing.ts), which is still
 * switched off. What customers see today is the ladder and the benefits —
 * true under either scheme — while the KLC counts are shown as what it
 * takes, not as a balance anybody holds yet.
 */
import { TIER_THRESHOLDS, LEGENDARIO_MIN_PERSONAL_PURCHASES, type EarnedTier } from "./klc";
import { TIER_ORDER } from "./standing";
import { TIERS } from "@/lib/membership/tiers";
import { CAKE_LEAD_TIMES } from "@/lib/products/cake-lead-times";

export type Bilingual = { es: string; en: string };

export type RoadmapStop = {
  tier: EarnedTier;
  /** As Karyana writes it: Básico, Artesano... */
  name: string;
  /** KLC needed to stand here. Zero for the first one. */
  credits: number;
  /** Extra condition, if any. */
  requirement: Bilingual | null;
  /** The fastest a cake can be ready at this tier, in hours. */
  fastestCakeHours: number;
  /** What this stop unlocks that the one below it did not. */
  unlocks: Bilingual[];
};

/** The quickest cake in the table for a tier. The headline benefit. */
export function fastestCakeHours(tier: EarnedTier): number {
  return Math.min(...CAKE_LEAD_TIMES.map((c) => c.hours[tier]));
}

function creditsFor(tier: EarnedTier): number {
  if (tier === "BASICO") return 0;
  return TIER_THRESHOLDS[tier];
}

/**
 * What changes on arrival. Only the differences against the tier below, so
 * the list reads as a reward rather than as a specification.
 */
function unlocksFor(tier: EarnedTier, previous: EarnedTier | null): Bilingual[] {
  const now = TIERS[tier];
  const before = previous ? TIERS[previous] : null;
  const out: Bilingual[] = [];
  const gained = (key: keyof typeof now) => !!now[key] && !(before && before[key]);

  const fast = fastestCakeHours(tier);
  const fastBefore = previous ? fastestCakeHours(previous) : null;
  if (fastBefore === null) {
    out.push({ es: `Pasteles listos desde ${fast} h`, en: `Cakes ready from ${fast} h` });
  } else if (fast < fastBefore) {
    out.push({
      es: `Tus pasteles bajan de ${fastBefore} h a ${fast} h de espera`,
      en: `Your cakes drop from ${fastBefore} h to ${fast} h of waiting`,
    });
  }

  if (gained("outOfStockAccess")) {
    out.push({ es: "Puedes pedir lo agotado", en: "You can order what's sold out" });
  }
  if (gained("offSeasonAccess")) {
    out.push({ es: "Sabores de temporada fuera de temporada", en: "Seasonal flavours out of season" });
  }
  if (gained("freeDelivery")) {
    const min = now.freeDeliveryMinOrderCents;
    const from = min ? ` desde $${(min / 100).toFixed(0)}` : "";
    const fromEn = min ? ` on orders over $${(min / 100).toFixed(0)}` : "";
    out.push({ es: `Envío gratis${from}`, en: `Free delivery${fromEn}` });
  }
  if (gained("firstBoxWith6FreePieces")) {
    out.push({ es: "6 piezas de regalo en tu primera caja", en: "6 free pieces in your first box" });
  }
  if (gained("weeklyOrderSkip")) {
    out.push({
      es: "Puedes saltarte una semana del pedido automático",
      en: "Skip a week of the auto reorder",
    });
  }
  if (gained("freeAdvanceSamples")) {
    out.push({ es: "Pruebas gratis antes que nadie", en: "Free samples before anyone else" });
  }
  if (gained("karyanaMakesYourCake")) {
    out.push({ es: "Karyana hace tu pastel ella misma", en: "Karyana makes your cake herself" });
  }
  if (gained("partnerDiscounts")) {
    out.push({ es: "Descuentos con negocios aliados", en: "Discounts with partner businesses" });
  }
  if (gained("personalizedService")) {
    out.push({ es: "Atención personalizada", en: "Service that knows you by name" });
  }
  if (now.birthdayPoints > (before?.birthdayPoints ?? 0)) {
    out.push({
      es: `${now.birthdayPoints} puntos en tu cumpleaños`,
      en: `${now.birthdayPoints} points on your birthday`,
    });
  }
  if (now.pointsMultiplier > (before?.pointsMultiplier ?? 0)) {
    out.push({
      es: `${now.pointsMultiplier}× puntos en todo lo que compras`,
      en: `${now.pointsMultiplier}× points on everything you buy`,
    });
  }

  return out;
}

export function roadmap(): RoadmapStop[] {
  return TIER_ORDER.map((tier, i) => ({
    tier,
    name: TIERS[tier].name,
    credits: creditsFor(tier),
    requirement:
      tier === "LEGENDARIO"
        ? {
            es: `y al menos ${LEGENDARIO_MIN_PERSONAL_PURCHASES} compras tuyas en días distintos`,
            en: `plus at least ${LEGENDARIO_MIN_PERSONAL_PURCHASES} purchases of your own, on different days`,
          }
        : null,
    fastestCakeHours: fastestCakeHours(tier),
    unlocks: unlocksFor(tier, i === 0 ? null : TIER_ORDER[i - 1]),
  }));
}

/** How KLC is earned. The five pillars, in the words a customer would use. */
export const PILLARS: { es: string; en: string; detail: Bilingual }[] = [
  { es: "Compra", en: "Buy", detail: { es: "Cada compra cuenta.", en: "Every purchase counts." } },
  {
    es: "Gasta",
    en: "Spend",
    detail: { es: "Los pedidos más grandes cuentan más.", en: "Bigger orders count for more." },
  },
  {
    es: "Quédate",
    en: "Stay",
    detail: {
      es: "El tiempo que llevas con nosotros también suma.",
      en: "Time with us adds up on its own.",
    },
  },
  {
    es: "Invita",
    en: "Refer",
    detail: {
      es: "Cuando quien invitas hace su primera compra.",
      en: "When the person you invited makes their first purchase.",
    },
  },
  {
    es: "Descubre",
    en: "Explore",
    detail: {
      es: "La primera vez que pruebas una familia nueva: conchas, pan tradicional, pasteles, postres.",
      en: "The first time you try a new family: conchas, traditional bread, cakes, desserts.",
    },
  },
];
