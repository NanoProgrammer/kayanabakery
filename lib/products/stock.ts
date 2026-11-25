/**
 * Taking sold items off the shelf. Situación 13.
 *
 * The meeting asked to verify that inventory is discounted correctly. It
 * is not — nothing in the codebase has ever reduced `stockQuantity`. The
 * checkout READS it, to decide that a box needs no lead time and can be
 * collected today, and then leaves it exactly as it was.
 *
 * So Karyana puts 6 in the stock box on a Saturday, six people buy those
 * boxes, and the seventh, the eighth and the hundredth customer are all
 * still told their box is ready for pickup today. The bakery has sold
 * same-day collection on boxes that do not exist. That is worse than
 * having no stock field at all, because the promise is specific.
 *
 * The decision of WHAT to decrement is here, away from the checkout,
 * because getting it wrong in either direction is expensive: too little
 * and we oversell, too much and Karyana's counts drift down for no
 * reason and she stops trusting the field.
 */

export type SoldItem = {
  /** The Sanity product id. */
  productId?: string | null;
  quantity?: number | null;
};

export type StockedProduct = {
  _id: string;
  /** The number in Studio's stock box. Null means made to order. */
  stockQuantity?: number | null;
};

export type StockDecrement = {
  productId: string;
  /** How many units to take off, always at least 1. */
  by: number;
};

/**
 * What to take off the shelf for an order.
 *
 * Every sold unit of a stock-managed product counts, whether or not the
 * customer chose immediate pickup: the number is a count of physical
 * things in the bakery, and selling one removes one however it leaves.
 *
 * A product with no number set is not stock-managed and is left alone —
 * writing a count onto it would turn "made to order" into "none left"
 * the moment somebody bought one.
 *
 * Lines are summed per product, so two lines of the same box (different
 * options, say) take two off rather than one patch overwriting the
 * other.
 */
export function stockDecrements(
  items: readonly SoldItem[],
  products: readonly StockedProduct[]
): StockDecrement[] {
  const managed = new Map<string, number>();
  for (const p of products) {
    const stock = p.stockQuantity;
    // Zero IS managed: it means "none on the shelf", and selling against
    // it should still count down rather than silently do nothing.
    if (typeof stock === "number" && Number.isFinite(stock)) {
      managed.set(p._id, stock);
    }
  }

  const totals = new Map<string, number>();
  for (const item of items) {
    const id = typeof item.productId === "string" ? item.productId : "";
    if (!id || !managed.has(id)) continue;
    const q = Number(item.quantity);
    // A missing quantity is one item, not zero: the customer is holding
    // something. A nonsensical one is ignored rather than guessed at.
    const units = Number.isFinite(q) ? Math.floor(q) : 1;
    if (units <= 0) continue;
    totals.set(id, (totals.get(id) ?? 0) + units);
  }

  return [...totals.entries()]
    .map(([productId, by]) => ({ productId, by }))
    .sort((a, b) => a.productId.localeCompare(b.productId));
}

/**
 * What a count becomes after the sale, never below zero.
 *
 * The write itself uses Sanity's atomic `dec`, which is what keeps two
 * simultaneous orders from both reading 1 and both selling it. This is
 * for tidying up afterwards: an atomic decrement can leave -2 on the
 * document, and a negative number in Studio reads as a bug to whoever
 * sees it, even though the code treats anything at or below zero the
 * same way.
 */
export function clampedStock(current: number | null | undefined): number {
  const n = Number(current);
  if (!Number.isFinite(n)) return 0;
  return n < 0 ? 0 : Math.floor(n);
}

/** Whether a count needs tidying after an atomic decrement. */
export function needsClamp(current: number | null | undefined): boolean {
  const n = Number(current);
  return Number.isFinite(n) && n < 0;
}
