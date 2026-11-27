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
import {
  TIER_THRESHOLDS,
  LEGENDARIO_MIN_PERSONAL_PURCHASES,
  KLC_PER_PURCHASE,
  DOLLARS_PER_SPEND_KLC,
  KLC_PER_YEAR,
  MAX_TENURE_KLC,
  KLC_PER_CONVERTED_REFERRAL,
  KLC_PER_NEW_FAMILY,
  BONUS_KLC_CAP_PER_YEAR,
  type EarnedTier,
} from "./klc";
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
  /**
   * Maneras concretas de llegar hasta aquí. No beneficios: el roadmap
   * responde "qué tengo que hacer", y lo que se recibe ya está en la
   * tabla de niveles que va justo debajo.
   */
  routes: Bilingual[];
  /** La advertencia del tope, cuando aplica. */
  caution: Bilingual | null;
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
 * Maneras concretas de juntar los KLC que pide un nivel.
 *
 * Esto es lo que el roadmap tiene que contestar: qué hago para llegar.
 * Todas las rutas se calculan con los valores reales de la tabla de
 * Rubén, así que si cambia un número cambian las rutas — nunca hay dos
 * verdades sobre cuánto cuesta subir.
 *
 * Son ejemplos, no requisitos: cualquier combinación que sume funciona.
 */
function routesTo(credits: number): Bilingual[] {
  if (credits <= 0) {
    return [
      { es: "Crea tu cuenta. Ya estás dentro.", en: "Create your account. You're in." },
    ];
  }

  const out: Bilingual[] = [];
  const buys = Math.ceil(credits / KLC_PER_PURCHASE);

  // Solo comprando: la ruta que todos entienden.
  out.push({
    es: `${buys} compras`,
    en: `${buys} purchases`,
  });

  // Con una persona invitada que llegue a comprar.
  const afterReferral = credits - KLC_PER_CONVERTED_REFERRAL;
  if (afterReferral > 0) {
    out.push({
      es: `${Math.ceil(afterReferral / KLC_PER_PURCHASE)} compras + 1 persona que invitas y compra`,
      en: `${Math.ceil(afterReferral / KLC_PER_PURCHASE)} purchases + 1 person you invite who buys`,
    });
  }

  // Probando cosas nuevas: dos familias distintas.
  const families = Math.min(2, credits - 1);
  const afterFamilies = credits - families * KLC_PER_NEW_FAMILY;
  if (families >= 2 && afterFamilies > 0) {
    out.push({
      es: `${Math.ceil(afterFamilies / KLC_PER_PURCHASE)} compras + probar ${families} familias nuevas`,
      en: `${Math.ceil(afterFamilies / KLC_PER_PURCHASE)} purchases + trying ${families} new families`,
    });
  }

  return out;
}

/**
 * El aviso del tope, en los niveles donde de verdad muerde.
 *
 * Invitar y descubrir suman como máximo 6 KLC al año entre los dos. A
 * partir de cierto nivel eso deja de ser un detalle: significa que una
 * parte del camino TIENE que venir de comprar, y es mejor decirlo antes
 * de que alguien invite a diez personas esperando llegar así.
 */
function cautionFor(credits: number): Bilingual | null {
  if (credits <= BONUS_KLC_CAP_PER_YEAR) return null;
  const fromBuying = credits - BONUS_KLC_CAP_PER_YEAR;
  return {
    es: `Invitar y descubrir suman máximo ${BONUS_KLC_CAP_PER_YEAR} KLC al año entre los dos, así que al menos ${fromBuying} tienen que venir de tus compras.`,
    en: `Inviting and exploring are capped at ${BONUS_KLC_CAP_PER_YEAR} KLC a year between them, so at least ${fromBuying} have to come from buying.`,
  };
}

export function roadmap(): RoadmapStop[] {
  return TIER_ORDER.map((tier) => ({
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
    routes: routesTo(creditsFor(tier)),
    caution: cautionFor(creditsFor(tier)),
  }));
}

/**
 * Cómo se gana un KLC. Los cinco pilares, CON su valor.
 *
 * Antes decían "cada compra cuenta" sin decir cuánto, que para planear
 * un camino es lo mismo que no decir nada. Los números salen de la
 * tabla de Rubén, no están escritos aquí a mano.
 */
export const PILLARS: { es: string; en: string; value: string; detail: Bilingual }[] = [
  {
    es: "Compra",
    en: "Buy",
    value: `+${KLC_PER_PURCHASE} KLC`,
    detail: { es: "Por cada pedido.", en: "For every order." },
  },
  {
    es: "Gasta",
    en: "Spend",
    value: "+1 KLC",
    detail: {
      es: `Por cada $${DOLLARS_PER_SPEND_KLC} que acumulas en productos.`,
      en: `For every $${DOLLARS_PER_SPEND_KLC} you accumulate in products.`,
    },
  },
  {
    es: "Quédate",
    en: "Stay",
    value: `+${KLC_PER_YEAR} KLC`,
    detail: {
      es: `Por cada año con nosotros, hasta ${MAX_TENURE_KLC}.`,
      en: `For each year with us, up to ${MAX_TENURE_KLC}.`,
    },
  },
  {
    es: "Invita",
    en: "Invite",
    value: `+${KLC_PER_CONVERTED_REFERRAL} KLC`,
    detail: {
      es: "Cuando la persona que invitas hace su primera compra. Registrarse no basta.",
      en: "When the person you invite makes their first purchase. Signing up isn't enough.",
    },
  },
  {
    es: "Descubre",
    en: "Explore",
    value: `+${KLC_PER_NEW_FAMILY} KLC`,
    detail: {
      es: "La primera vez que pruebas una familia nueva: conchas, pan tradicional, pasteles, postres.",
      en: "The first time you try a new family: conchas, traditional bread, cakes, desserts.",
    },
  },
];

/** El tope conjunto de invitar y descubrir, dicho una sola vez. */
export const BONUS_CAP_NOTE: Bilingual = {
  es: `Invitar y descubrir suman como máximo ${BONUS_KLC_CAP_PER_YEAR} KLC al año entre los dos. El Club premia sobre todo a quien regresa a comprar.`,
  en: `Inviting and exploring add at most ${BONUS_KLC_CAP_PER_YEAR} KLC a year between them. The Club rewards coming back to buy above all.`,
};

