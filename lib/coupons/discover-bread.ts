/**
 * "Descubre Pan" — buy a cake, get two breads on us next time.
 *
 * Every order with a cake in it earns the customer a code. The code is
 * printed on the kitchen slip for that cake, so whoever packs the box can
 * write it on the ticket and hand it over. Using it later, on an order that
 * contains bread, tells the kitchen to add two more breads of their own
 * choosing.
 *
 * THE COUPON DISCOUNTS NOTHING. It is worth two breads, but it is not a
 * money-off coupon: the breads are added to the box by the bakery, not taken
 * off the bill. That matters, because a discount equal to "two breads" means
 * guessing which two, and a percentage would come off a cake as happily as
 * off a bolillo. A zero-value coupon that prints an instruction cannot give
 * away anything by accident.
 *
 * The code is derived from the order number rather than stored, so the slip
 * can work it out again without a new column, and issuing it twice for the
 * same order produces the same code — which the unique index on the coupon
 * refuses.
 */
import { familyForProduct } from "@/lib/products/cake-families";

/** How many breads the bakery adds. They choose which. */
export const FREE_BREADS = 2;

/** How long the customer has to come back. */
export const VALID_FOR_DAYS = 90;

/**
 * The categories that count as bread for the redemption rule. A cake does
 * not: the offer is for discovering the bread.
 */
export const BREAD_CATEGORY_SLUGS = [
  "conchas",
  "pan-dulce",
  "traditional-mexican-bread",
  "pan-tradicional",
  "churros",
  "boxes",
];

export type OrderLine = {
  name: string;
  slug?: string | null;
  categorySlugs?: string[] | null;
};

export function isCake(line: OrderLine): boolean {
  if ((line.categorySlugs ?? []).some((s) => s === "cakes")) return true;
  return !!familyForProduct({ slug: line.slug ?? null, name: line.name });
}

export function isBread(line: OrderLine): boolean {
  if (isCake(line)) return false;
  return (line.categorySlugs ?? []).some((s) => BREAD_CATEGORY_SLUGS.includes(s));
}

/** An order earns a code when it contains a cake. */
export function earnsCoupon(lines: readonly OrderLine[]): boolean {
  return lines.some(isCake);
}

/** An order may use a code when it contains bread. */
export function canRedeem(lines: readonly OrderLine[]): boolean {
  return lines.some(isBread);
}

/**
 * The code for an order. Derived, never stored.
 *
 * Upper case, no vowels in the random-looking part — the slip is printed on
 * a receipt printer and read aloud over the phone, so O and 0 must not have
 * to be told apart.
 */
export function couponCodeFor(orderNumber: string): string {
  const tail = (orderNumber || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/[OIQ]/g, "0")
    .slice(-6);
  return `PAN${tail}`;
}

/** The line printed on the cake's slip, for whoever packs the box. */
export function slipNoteForEarned(orderNumber: string, locale: string): string {
  const code = couponCodeFor(orderNumber);
  return locale === "es"
    ? `CUPÓN DESCUBRE PAN: ${code} — ${FREE_BREADS} PANES GRATIS EN SU PRÓXIMO PEDIDO`
    : `DISCOVER BREAD COUPON: ${code} — ${FREE_BREADS} FREE BREADS ON THEIR NEXT ORDER`;
}

/** The line printed when the coupon is being used: an instruction, not a price. */
export function slipNoteForRedeemed(locale: string): string {
  return locale === "es"
    ? `AGREGAR ${FREE_BREADS} PANES GRATIS — LOS ESCOGEMOS NOSOTROS`
    : `ADD ${FREE_BREADS} FREE BREADS — OUR CHOICE`;
}

export function isDiscoverBreadCode(code: string | null | undefined): boolean {
  return /^PAN[A-Z0-9]{1,8}$/.test((code ?? "").trim().toUpperCase());
}

/** The Sanity coupon document for a code. Zero value, on purpose. */
export function couponDocument(orderNumber: string, now = new Date()) {
  const code = couponCodeFor(orderNumber);
  return {
    _id: `coupon-${code.toLowerCase()}`,
    _type: "coupon" as const,
    code,
    labelEn: `Discover Bread — ${FREE_BREADS} free breads, our choice`,
    labelEs: `Descubre Pan — ${FREE_BREADS} panes gratis, los escogemos nosotros`,
    // Zero, deliberately. The breads go in the box; nothing comes off the
    // bill. See the note at the top of this file.
    discountType: "FIXED" as const,
    discountValue: 0,
    appliesTo: "ALL",
    maxUses: 1,
    perUserLimit: 1,
    active: true,
    expiresAt: new Date(now.getTime() + VALID_FOR_DAYS * 86_400_000).toISOString(),
  };
}
