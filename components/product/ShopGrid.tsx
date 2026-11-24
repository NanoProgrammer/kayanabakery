"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { useLocale, pickI18n } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import {
  applyFilters,
  priceBounds,
  isFiltered,
  defaultFilters,
  sortLabel,
  SORT_KEYS,
  type ShopFilters,
  type SortKey,
} from "@/lib/products/shop-filters";
import type { Product, Category } from "@/types";

/**
 * The shop.
 *
 * It was one grid of everything behind a row of category chips, which with
 * this many products means scrolling to find a concha and no way to ask
 * what is new or what costs under twenty dollars.
 *
 * The rules live in lib/products/shop-filters.ts; this draws them.
 */
export function ShopGrid({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const { locale } = useLocale();
  const es = locale === "es";

  const bounds = useMemo(() => priceBounds(products as any), [products]);
  const [filters, setFilters] = useState<ShopFilters>(defaultFilters);
  const [showPrice, setShowPrice] = useState(false);

  const shown = useMemo(
    () => applyFilters(products as any, filters) as unknown as Product[],
    [products, filters]
  );

  const filtering = isFiltered(filters, bounds);
  // Null means "no ceiling", which is not the same as the catalogue's max —
  // the slider still has to sit somewhere, so it sits at the top.
  const ceiling = filters.maxPrice ?? bounds.max;

  function set(patch: Partial<ShopFilters>) {
    setFilters((f) => ({ ...f, ...patch }));
  }

  return (
    <div className="container-bakery py-16">
      <header className="mb-8">
        <span className="eyebrow">{es ? "Menú completo" : "Full menu"}</span>
        <h1 className="section-title mt-2">
          {es ? "Todo lo que" : "Everything we"}{" "}
          <span className="font-script text-canela-dark">
            {es ? "horneamos." : "bake."}
          </span>
        </h1>
      </header>

      {/* Search and sort */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder={es ? "Buscar pan, pastel, sabor…" : "Search bread, cake, flavour…"}
            aria-label={es ? "Buscar" : "Search"}
            className="w-full rounded-full border border-canela/30 bg-cream py-3 pl-11 pr-4 text-sm focus:border-canela-dark focus:outline-none"
          />
        </div>

        <label className="sr-only" htmlFor="shop-sort">
          {es ? "Ordenar" : "Sort"}
        </label>
        <select
          id="shop-sort"
          value={filters.sort}
          onChange={(e) => set({ sort: e.target.value as SortKey })}
          className="rounded-full border border-canela/30 bg-cream px-4 py-3 text-sm focus:border-canela-dark focus:outline-none"
        >
          {SORT_KEYS.map((k) => (
            <option key={k} value={k}>
              {sortLabel(k, locale)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setShowPrice((v) => !v)}
          aria-expanded={showPrice}
          className={cn(
            "flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm transition",
            filters.maxPrice != null && filters.maxPrice < bounds.max
              ? "border-canela-dark bg-canela-light font-medium"
              : "border-canela/30 bg-cream hover:border-canela"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {es ? "Precio" : "Price"}
        </button>
      </div>

      {showPrice && bounds.max > bounds.min && (
        <div className="mb-5 rounded-2xl border border-canela/20 bg-cream p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
              {es ? "Hasta" : "Up to"}
            </span>
            <span className="font-display text-xl">${ceiling}</span>
          </div>
          <input
            type="range"
            min={bounds.min}
            max={bounds.max}
            step={1}
            value={ceiling}
            onChange={(e) => {
              const v = Number(e.target.value);
              // Back at the top is not a filter — drop it entirely so the
              // "clear" button and the chip disappear with it.
              set({ maxPrice: v >= bounds.max ? null : v });
            }}
            className="mt-3 w-full accent-canela-dark"
            aria-label={es ? "Precio máximo" : "Maximum price"}
          />
          <div className="mt-1 flex justify-between text-xs text-ink-soft">
            <span>${bounds.min}</span>
            <span>${bounds.max}</span>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => set({ category: null })}
          className={cn(
            "rounded-full border px-4 py-2 text-xs font-medium transition-all",
            !filters.category
              ? "border-canela bg-canela text-ink"
              : "border-canela/30 bg-cream hover:bg-canela-light"
          )}
        >
          {es ? "Todo" : "All"}
        </button>
        {categories.map((c) => (
          <button
            key={c._id}
            onClick={() => set({ category: c.slug })}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-medium transition-all",
              filters.category === c.slug
                ? "border-canela bg-canela text-ink"
                : "border-canela/30 bg-cream hover:bg-canela-light"
            )}
          >
            {pickI18n(c, "name", locale)}
          </button>
        ))}
      </div>

      <div className="mb-6 flex items-center justify-between gap-3 text-sm text-ink-soft">
        <span>
          {shown.length}{" "}
          {es
            ? shown.length === 1
              ? "producto"
              : "productos"
            : shown.length === 1
            ? "product"
            : "products"}
        </span>
        {filtering && (
          <button
            type="button"
            onClick={() => setFilters(defaultFilters)}
            className="inline-flex items-center gap-1 rounded-full border border-canela/30 px-3 py-1.5 text-xs hover:bg-canela-light"
          >
            <X className="h-3 w-3" />
            {es ? "Limpiar filtros" : "Clear filters"}
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-ink-soft">
            {filters.search.trim()
              ? es
                ? `No encontramos nada para "${filters.search.trim()}".`
                : `Nothing matches "${filters.search.trim()}".`
              : es
              ? "No hay productos con estos filtros."
              : "No products match these filters."}
          </p>
          {filtering && (
            <button
              type="button"
              onClick={() => setFilters(defaultFilters)}
              className="mt-4 rounded-full border border-canela/30 px-5 py-2.5 text-sm hover:bg-canela-light"
            >
              {es ? "Ver todo" : "See everything"}
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
