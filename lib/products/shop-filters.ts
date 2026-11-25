/**
 * Searching, filtering and sorting the shop.
 *
 * The shop was one grid of everything with a row of category chips. With a
 * catalogue this size that means scrolling to find a concha, and no way at
 * all to ask "what is new" or "what costs under $20".
 *
 * Kept away from the markup because the rules have corners that are easy to
 * get wrong and expensive to notice: searching has to work in both
 * languages and without accents (nobody types "piña"), the price bounds have
 * to come from the catalogue rather than be guessed, and sorting must be
 * stable or products jump around as you type.
 */
import { unitsSold, hasSalesData, type SalesBySlug } from "./bestsellers";

export type ShopProduct = {
  _id: string;
  /** Needed to match a product against what the orders actually sold. */
  slug?: string | null;
  name: string;
  nameEs?: string | null;
  description?: string | null;
  descriptionEs?: string | null;
  price: number;
  tag?: string | null;
  displayOrder?: number | null;
  /** Sanity's creation time, for "newest". */
  _createdAt?: string | null;
  /**
   * Hours of notice the kitchen needs, as the Studio already stores it.
   * Used by the "quickest to make" sort the meeting asked for (Situación
   * 12): a customer who needs something today is sorting by this, not by
   * price.
   */
  leadTime?: number | null;
  /** A number here means boxes are on the shelf now — no lead time at all. */
  stockQuantity?: number | null;
  categories?: { slug: string; name?: string | null }[] | null;
};

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "fastest" | "name";

export const SORT_KEYS: SortKey[] = [
  "featured",
  "newest",
  "price-asc",
  "price-desc",
  "fastest",
  "name",
];

export function sortLabel(key: SortKey, locale: string): string {
  const es = locale === "es";
  switch (key) {
    case "featured":
      return es ? "Más vendidos" : "Bestsellers";
    case "newest":
      return es ? "Más nuevos" : "Newest";
    case "price-asc":
      return es ? "Precio: menor a mayor" : "Price: low to high";
    case "price-desc":
      return es ? "Precio: mayor a menor" : "Price: high to low";
    case "fastest":
      return es ? "Más rápidos de preparar" : "Quickest to make";
    case "name":
      return es ? "Nombre (A-Z)" : "Name (A-Z)";
  }
}

/** Lower-case, accent-free. Nobody types "piña" into a search box. */
export function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Everything a product can be found by: both languages, name, description
 * and the categories it is filed under — so "pastel" finds the cakes even
 * when no cake has that word in its name.
 */
export function searchableText(p: ShopProduct): string {
  return normalize(
    [
      p.name,
      p.nameEs,
      p.description,
      p.descriptionEs,
      ...(p.categories ?? []).map((c) => c?.name ?? ""),
      ...(p.categories ?? []).map((c) => c?.slug ?? ""),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

/** Every word typed has to appear somewhere, in any order. */
export function matchesSearch(p: ShopProduct, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = searchableText(p);
  return words.every((w) => haystack.includes(w));
}

/** How far a product is pushed up the list. Lower sorts first. */
function tagRank(tag: string | null | undefined): number {
  const t = normalize(tag);
  if (t.includes("bestseller") || t.includes("mas vendido")) return 0;
  if (t.includes("new") || t.includes("nuevo")) return 1;
  return 2;
}

/**
 * The wait, in hours, for sorting by "quickest to make".
 *
 * Anything with stock on the shelf waits for nothing — that is what
 * Stock Quantity means since Situación 13 — so it sorts ahead of
 * everything, however long its lead time says it takes to bake. A missing
 * lead time is treated as no wait, because that is what the checkout does
 * with it, and a product must not be pushed to the back of the list for a
 * field Karyana simply left blank.
 */
export function waitHours(p: ShopProduct): number {
  if ((p.stockQuantity ?? 0) > 0) return 0;
  const h = typeof p.leadTime === "number" ? p.leadTime : 0;
  return Number.isFinite(h) && h > 0 ? h : 0;
}

function createdTime(p: ShopProduct): number {
  const t = p._createdAt ? Date.parse(p._createdAt) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Sorted, and stable.
 *
 * Every comparison ends by falling back to the id, so two products that tie
 * keep a fixed order. Without that, re-sorting on every keystroke makes the
 * grid shuffle under the customer's hand.
 */
export function sortProducts<T extends ShopProduct>(
  products: readonly T[],
  key: SortKey,
  sales?: SalesBySlug | null
): T[] {
  const tie = (a: T, b: T) => a._id.localeCompare(b._id);
  const copy = [...products];

  switch (key) {
    case "newest":
      return copy.sort((a, b) => createdTime(b) - createdTime(a) || tie(a, b));
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price || tie(a, b));
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price || tie(a, b));
    case "fastest":
      // Shortest wait first, and among equal waits the cheaper one — two
      // products that are both ready now are best offered cheapest first.
      return copy.sort((a, b) => waitHours(a) - waitHours(b) || a.price - b.price || tie(a, b));
    case "name":
      return copy.sort((a, b) => normalize(a.name).localeCompare(normalize(b.name)) || tie(a, b));
    case "featured":
    default:
      // Real sales first, as the meeting asked (Situación 12): what people
      // actually bought in the last three months, most units first.
      //
      // The Studio's BESTSELLER tag stays as the tie-break rather than the
      // answer. It still decides the order among everything that has sold
      // nothing — a new product nobody has bought yet can be promoted by
      // hand, which is the only thing the tag was ever good for — and it
      // decides the whole order when no orders could be read at all, so a
      // database that is down leaves the shop looking exactly as before
      // rather than shuffled into nonsense.
      if (hasSalesData(sales)) {
        return copy.sort(
          (a, b) =>
            unitsSold(sales, b.slug) - unitsSold(sales, a.slug) ||
            tagRank(a.tag) - tagRank(b.tag) ||
            (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999) ||
            tie(a, b)
        );
      }
      return copy.sort(
        (a, b) =>
          tagRank(a.tag) - tagRank(b.tag) ||
          (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999) ||
          tie(a, b)
      );
  }
}

export type PriceBounds = { min: number; max: number };

/**
 * The cheapest and dearest in the catalogue, rounded outwards to whole
 * dollars so the slider's ends are round numbers and nothing sits exactly
 * on an edge where a rounding error could hide it.
 */
export function priceBounds(products: readonly ShopProduct[]): PriceBounds {
  const prices = products.map((p) => p.price).filter((n) => Number.isFinite(n));
  if (!prices.length) return { min: 0, max: 0 };
  return {
    min: Math.floor(Math.min(...prices)),
    max: Math.ceil(Math.max(...prices)),
  };
}

export type ShopFilters = {
  search: string;
  category: string | null;
  /** Null means "no limit", which is not the same as the catalogue's max. */
  maxPrice: number | null;
  sort: SortKey;
};

export const defaultFilters: ShopFilters = {
  search: "",
  category: null,
  maxPrice: null,
  sort: "featured",
};

export function applyFilters<T extends ShopProduct>(
  products: readonly T[],
  filters: ShopFilters,
  sales?: SalesBySlug | null
): T[] {
  const matched = products.filter((p) => {
    if (filters.category && !(p.categories ?? []).some((c) => c?.slug === filters.category)) {
      return false;
    }
    if (filters.maxPrice != null && p.price > filters.maxPrice) return false;
    return matchesSearch(p, filters.search);
  });
  return sortProducts(matched, filters.sort, sales);
}

/** Whether anything is narrowing the list, for showing a "clear" button. */
export function isFiltered(filters: ShopFilters, bounds: PriceBounds): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.category !== null ||
    (filters.maxPrice != null && filters.maxPrice < bounds.max)
  );
}
