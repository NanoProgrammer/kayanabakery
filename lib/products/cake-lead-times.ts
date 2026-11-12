/**
 * How long each cake needs before it can be handed over, by membership tier.
 *
 * From Karyana's own table (TABLA DE TIEMPOS en PASTELES). A membership buys
 * time as much as it buys points: a non-member waits 48 hours for a chocoflán
 * and a Selecto waits six.
 *
 * Hours, not days, because that is how she wrote it and because the
 * difference between 2 and 6 hours decides whether an order can go out the
 * same evening.
 *
 * Nothing here is wired into the checkout yet — where it goes is what we
 * agreed to settle together. It is written down so the numbers stop living
 * only in a spreadsheet.
 */
import type { MembershipTier } from "@/lib/membership/tiers";

/** A guest with no account at all, which no tier covers. */
export type LeadTimeAudience = "GUEST" | MembershipTier;

export type CakeLeadTime = {
  /** As written in the table, for matching and for showing her the source. */
  name: string;
  hours: Record<LeadTimeAudience, number>;
};

const H = (
  guest: number,
  basico: number,
  artesano: number,
  selecto: number,
  legendario: number,
  embajador: number
): CakeLeadTime["hours"] => ({
  GUEST: guest,
  BASICO: basico,
  ARTESANO: artesano,
  SELECTO: selecto,
  LEGENDARIO: legendario,
  EMBAJADOR: embajador,
});

export const CAKE_LEAD_TIMES: CakeLeadTime[] = [
  { name: "Flan 3 Leches", hours: H(48, 24, 12, 6, 6, 6) },
  { name: "Chocoflán", hours: H(48, 24, 12, 6, 6, 6) },
  { name: "3 Leches Clásico", hours: H(24, 12, 4, 2, 2, 2) },
  { name: "3 Leches Tiramisú", hours: H(24, 12, 4, 2, 2, 2) },
  { name: "3 Leches Mango", hours: H(24, 12, 4, 2, 2, 2) },
  { name: "3 Leches Pistacho", hours: H(24, 12, 4, 2, 2, 2) },
  { name: "3 Leches Piña Colada", hours: H(24, 12, 4, 2, 2, 2) },
  { name: "3 Leches Dulce de Leche", hours: H(24, 12, 4, 2, 2, 2) },
  { name: "3 Leches Chocolate", hours: H(24, 12, 4, 2, 2, 2) },
  { name: "3 Leches Eggnog/Rompope", hours: H(24, 12, 4, 2, 2, 2) },
  { name: "Lemon Loaf", hours: H(24, 12, 4, 2, 2, 2) },
  { name: "Gelaflán", hours: H(24, 24, 12, 6, 6, 6) },
  { name: "Flan Napolitano", hours: H(24, 24, 12, 6, 6, 6) },
  { name: "Gelatina de Mosaico", hours: H(24, 24, 8, 4, 4, 4) },
  { name: "Bloom Cake", hours: H(24, 24, 8, 4, 4, 4) },
  { name: "Carlota", hours: H(24, 12, 4, 2, 2, 2) },
];

/** The eight tres leches flavours the table names. */
export const TRES_LECHES_FLAVOURS = CAKE_LEAD_TIMES.filter((c) =>
  /^3 Leches /.test(c.name)
).map((c) => c.name.replace(/^3 Leches /, ""));

function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * The table row for a product, matched loosely on its name so a product
 * called "3 Leches Mango (8 in)" in Studio still finds "3 Leches Mango".
 * The longest matching name wins, so "3 Leches Chocolate" is not answered by
 * a shorter row that happens to be contained in it.
 */
export function leadTimeFor(productName: string): CakeLeadTime | null {
  const target = normalize(productName);
  let best: CakeLeadTime | null = null;
  for (const row of CAKE_LEAD_TIMES) {
    const candidate = normalize(row.name);
    if (!target.includes(candidate)) continue;
    if (!best || candidate.length > normalize(best.name).length) best = row;
  }
  return best;
}

/**
 * Hours of notice this product needs for this customer. Null when the
 * product is not a cake in the table — those keep whatever lead time their
 * own catalog entry carries.
 */
export function leadTimeHours(
  productName: string,
  audience: LeadTimeAudience
): number | null {
  const row = leadTimeFor(productName);
  if (!row) return null;
  return row.hours[audience] ?? row.hours.GUEST;
}
