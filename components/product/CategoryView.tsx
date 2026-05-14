"use client";

import Image from "next/image";
import { ProductCard } from "@/components/product/ProductCard";
import { useLocale, pickI18n } from "@/lib/i18n/locale-provider";
import { urlFor } from "@/sanity/lib/image";
import type { Product, Category } from "@/types";

export function CategoryView({
  category,
}: {
  category: Category & { products: Product[] };
}) {
  const { locale } = useLocale();
  const name = pickI18n(category, "name", locale);
  const tagline = pickI18n(category, "tagline", locale);
  const description = pickI18n(category, "description", locale);

  return (
    <>
      <header className="relative overflow-hidden bg-canela-light py-20 md:py-28">
        <div className="grain absolute inset-0 opacity-50" />
        <div className="container-bakery relative grid items-center gap-10 md:grid-cols-2">
          <div>
            {tagline && (
              <span className="font-script text-2xl text-canela-dark">
                {tagline}
              </span>
            )}
            <h1 className="mt-2 font-display text-[length:var(--text-display-lg)] leading-tight">
              {name}
            </h1>
            {description && (
              <p className="mt-4 max-w-xl text-base text-ink-soft md:text-lg">
                {description}
              </p>
            )}
          </div>
          {category.image && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src={urlFor(category.image).width(900).height(700).url()}
                alt={name || ""}
                fill
                priority
                className="object-cover"
              />
            </div>
          )}
        </div>
      </header>

      <section className="container-bakery py-16">
        {category.products?.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {category.products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <p className="py-20 text-center text-ink-soft">
            {locale === "es"
              ? "Aún no hay productos en esta categoría."
              : "No products in this category yet."}
          </p>
        )}
      </section>
    </>
  );
}
