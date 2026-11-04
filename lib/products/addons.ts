/**
 * What to offer alongside something just added to the cart.
 *
 * A tres leches goes out plain unless the customer thinks to go looking for a
 * topper, and almost nobody does — by the time the cake is in the cart they
 * are heading for the checkout. So the toppers are brought to them at the one
 * moment they are definitely thinking about that cake.
 *
 * The decision is here, and on the server, rather than in the dialog: the
 * dialog should only ever draw what it is handed, and "is this a tres leches"
 * is a question about the catalog, which the browser does not have.
 */

/** The category holding cake toppers and decorations. */
export const TOPPER_CATEGORY_SLUG = "decoraciones";

/**
 * The categories whose products get the offer. Tres leches only for now, by
 * Karyana's instruction — not every cake, and certainly not a topper, which
 * would offer toppers for toppers.
 */
export const SUGGEST_FOR_CATEGORY_SLUGS = ["tres-leches"];

export function shouldSuggestToppers(categorySlugs: readonly string[] | null | undefined): boolean {
  if (!categorySlugs?.length) return false;
  if (categorySlugs.includes(TOPPER_CATEGORY_SLUG)) return false;
  return categorySlugs.some((slug) => SUGGEST_FOR_CATEGORY_SLUGS.includes(slug));
}

export type SuggestableProduct = {
  _id: string;
  name: string;
  nameEs?: string | null;
  slug: string;
  price: number;
  image?: string | null;
  soldOut?: boolean | null;
};

/**
 * What the dialog actually shows: what is in stock, minus what the customer
 * already has. Offering someone a topper sitting in their cart reads as the
 * site not knowing what they are doing.
 */
export function suggestionsToShow({
  toppers,
  productIdsInCart,
  limit = 6,
}: {
  toppers: readonly SuggestableProduct[];
  productIdsInCart: readonly string[];
  limit?: number;
}): SuggestableProduct[] {
  const inCart = new Set(productIdsInCart);
  return toppers
    .filter((t) => !t.soldOut)
    .filter((t) => !inCart.has(t._id))
    .slice(0, Math.max(0, limit));
}
