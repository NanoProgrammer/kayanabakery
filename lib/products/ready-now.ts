/**
 * Products that are already made and waiting on a shelf.
 *
 * Studio has had a "Stock quantity (optional)" field since the catalogue was
 * built and nothing has ever read it. Karyana wants it to mean something
 * concrete: a product with a number in that box is BAKED. It does not need
 * preparing, so it does not need notice — the customer can come and get it.
 *
 * Leaving the box empty keeps the product as it is today: made to order,
 * with its own lead time and the usual pickup floor.
 *
 * The order goes out in one handover, so one item that still has to be made
 * sets the wait for everything in it. "Ready now" is a property of the whole
 * basket, not of a line in it.
 */
export type StockedItem = {
  /** Hours of notice when it has to be made. */
  leadTime?: number | null;
  /** The number in Studio's stock box. Empty means made to order. */
  stockQuantity?: number | null;
  /** How many the customer wants. */
  quantity?: number | null;
};

/**
 * Whether this product is on the shelf in the quantity asked for.
 *
 * Asking for more than there are means the rest has to be baked, so the
 * line is not ready now — promising otherwise would have someone drive over
 * for bread that does not exist.
 */
export function isReadyNow(item: StockedItem): boolean {
  const stock = item.stockQuantity;
  if (stock == null || !Number.isFinite(stock) || stock <= 0) return false;
  const wanted = Number.isFinite(item.quantity ?? 1) ? Math.max(1, Math.floor(item.quantity ?? 1)) : 1;
  return stock >= wanted;
}

/** The notice this one line needs: none when it is already made. */
export function leadHoursFor(item: StockedItem): number {
  if (isReadyNow(item)) return 0;
  const hours = item.leadTime ?? 0;
  return Number.isFinite(hours) && hours > 0 ? hours : 0;
}

/** Nothing in the basket has to be made. */
export function orderIsReadyNow(items: readonly StockedItem[]): boolean {
  return items.length > 0 && items.every(isReadyNow);
}

/**
 * The notice the whole order needs — the slowest line in it.
 *
 * A stocked concha alongside a cake that needs a day does not make the
 * order ready now: both leave together.
 */
export function orderLeadHours(items: readonly StockedItem[]): number {
  return items.reduce((max, item) => Math.max(max, leadHoursFor(item)), 0);
}
