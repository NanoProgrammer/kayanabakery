/**
 * What actually sells, counted from the orders.
 *
 * "Más vendidos" was the shop's default sort and it read a BESTSELLER tag
 * typed into the Studio by hand. That is a guess, kept up to date by
 * whoever remembers to: a product can stay tagged a bestseller for a year
 * after people stopped buying it, and a genuine hit nobody tagged never
 * surfaces at all. The meeting asked for real sales (Situación 12), so
 * this counts them.
 *
 * Counted in units rather than dollars. Sorting by revenue puts the cakes
 * on top of a bread shop permanently — one $80 cake outweighs forty
 * conchas — and the question the sort answers is "what do people buy",
 * not "what makes the most money".
 *
 * Only a recent window counts, because a bestseller is a present tense.
 */

/** How far back a sale still says something about what is popular now. */
export const SALES_WINDOW_DAYS = 90;

/** Orders that never happened must not count. */
export const COUNTED_STATUSES = [
  "CONFIRMED",
  "IN_PROGRESS",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
] as const;

export type SoldLine = {
  slug?: string | null;
  quantity?: number | null;
};

export type SoldOrder = {
  createdAt: Date;
  /** The Json column, which is an array of lines when all is well. */
  items: unknown;
};

/** Units sold per product slug. Absent means none, not zero-and-known. */
export type SalesBySlug = Record<string, number>;

/**
 * The lines of an order, defensively.
 *
 * `items` is a Json column: it can be null, an object, or an array holding
 * anything at all, including rows written by older versions of the
 * checkout. A single malformed order must not take the whole shop's
 * sorting down with it.
 */
function linesOf(items: unknown): SoldLine[] {
  if (!Array.isArray(items)) return [];
  return items.filter((l): l is SoldLine => !!l && typeof l === "object");
}

function unitsOf(line: SoldLine): number {
  const q = typeof line.quantity === "number" ? line.quantity : 1;
  // A negative or absurd quantity is data corruption, not a hit product.
  if (!Number.isFinite(q) || q <= 0) return 0;
  return Math.min(Math.floor(q), 1000);
}

/**
 * Units sold per slug within the window.
 *
 * `now` is passed in rather than read, so the window is testable and so a
 * server and a test agree about where it starts.
 */
export function tallySales(
  orders: readonly SoldOrder[],
  now: Date,
  windowDays: number = SALES_WINDOW_DAYS
): SalesBySlug {
  const cutoff = now.getTime() - windowDays * 86_400_000;
  const out: SalesBySlug = {};
  for (const order of orders) {
    const at = order.createdAt?.getTime?.();
    if (typeof at !== "number" || Number.isNaN(at) || at < cutoff) continue;
    for (const line of linesOf(order.items)) {
      const slug = typeof line.slug === "string" ? line.slug.trim() : "";
      if (!slug) continue;
      const units = unitsOf(line);
      if (units <= 0) continue;
      out[slug] = (out[slug] ?? 0) + units;
    }
  }
  return out;
}

/** Units sold, or zero for a product nobody has bought in the window. */
export function unitsSold(sales: SalesBySlug | null | undefined, slug?: string | null): number {
  if (!sales || !slug) return 0;
  return sales[slug] ?? 0;
}

/**
 * Whether we know enough to sort by real sales.
 *
 * With no orders read — a fresh database, or the read failed — falling
 * back to the Studio tag is right. Sorting a whole shop by a tally of
 * nothing would shuffle it into id order and look broken.
 */
export function hasSalesData(sales: SalesBySlug | null | undefined): boolean {
  return !!sales && Object.keys(sales).length > 0;
}
