"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { useLocale, pickI18n } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@/types";

export function ShopGrid({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const { t, locale } = useLocale();
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const filtered = activeCat
    ? products.filter((p) =>
        p.categories?.some((c) => c.slug === activeCat)
      )
    : products;

  return (
    <div className="container-bakery py-16">
      <header className="mb-10">
        <span className="eyebrow">
          {locale === "es" ? "Menú completo" : "Full menu"}
        </span>
        <h1 className="section-title mt-2">
          {locale === "es" ? "Todo lo que" : "Everything we"}{" "}
          <span className="font-script text-canela-dark">
            {locale === "es" ? "horneamos." : "bake."}
          </span>
        </h1>
      </header>

      {/* Category filters */}
      <div className="mb-10 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCat(null)}
          className={cn(
            "rounded-full border px-4 py-2 text-xs font-medium transition-all",
            !activeCat
              ? "border-canela bg-canela text-ink"
              : "border-canela/30 bg-cream hover:bg-canela-light"
          )}
        >
          {locale === "es" ? "Todo" : "All"}
        </button>
        {categories.map((c) => {
          const name = pickI18n(c, "name", locale);
          return (
            <button
              key={c._id}
              onClick={() => setActiveCat(c.slug)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-medium transition-all",
                activeCat === c.slug
                  ? "border-canela bg-canela text-ink"
                  : "border-canela/30 bg-cream hover:bg-canela-light"
              )}
            >
              {name}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-20 text-center text-ink-soft">
          {locale === "es"
            ? "No hay productos en esta categoría todavía."
            : "No products in this category yet."}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
