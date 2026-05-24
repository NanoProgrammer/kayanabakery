import { ProductCard } from "@/components/product/ProductCard";
import { sanityFetch } from "@/sanity/lib/fetch";
import { categoryBySlugQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { Category, Product } from "@/types";

export const revalidate = 60;

type CategoryWithProducts = Category & { products: Product[] };

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await sanityFetch<CategoryWithProducts | null>({
    query: categoryBySlugQuery,
    params: { slug },
    tags: ["category", "product"],
  });

  if (!category) notFound();

  const heroImage = category.image
    ? urlFor(category.image).width(1600).height(600).url()
    : null;

  const isCakes = slug === "cakes";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-masa/60 py-20 md:py-28">
        {heroImage && (
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt={category.name}
              fill
              priority
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-cream/40 via-cream/30 to-cream" />
          </div>
        )}
        <div className="container-bakery relative text-center">
          {category.tagline && (
            <span className="eyebrow mb-3">{category.tagline}</span>
          )}
          <h1 className="font-display text-[length:var(--text-display-lg)] leading-[var(--text-display-lg--line-height)] tracking-[var(--text-display-lg--letter-spacing)] text-ink">
            {category.name}
          </h1>
          {category.description && (
            <p className="mx-auto mt-5 max-w-xl text-ink/70">
              {category.description}
            </p>
          )}
        </div>
      </section>

      {/* Custom Cake CTA — solo en /category/cakes */}
      {isCakes && (
        <section className="container-bakery py-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-canela-dark to-canela p-8 md:p-12">
            <div className="relative z-10 max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cream">
                <Sparkles className="h-3 w-3" />
                Custom orders
              </div>
              <h2 className="font-display text-3xl text-cream md:text-4xl">
                Dream it. We'll bake it.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-cream/80">
                Birthdays, quinceañeras, baby showers, or just because — tell us
                your theme, flavors, and date and we'll create something
                unforgettable. Custom cakes start at $85 and need 72h advance
                notice.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/product/custom-celebration-cake"
                  className="inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-medium text-canela-dark transition-colors hover:bg-white"
                >
                  Order a custom cake →
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-full border border-cream/40 px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-white/10"
                >
                  Have questions? Contact us
                </Link>
              </div>
            </div>
            {/* Decorative circle */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/5" />
          </div>
        </section>
      )}

      {/* Products grid */}
      <section className="container-bakery py-16 md:py-20">
        {!category.products?.length ? (
          <div className="py-12 text-center">
            <p className="text-ink/60">
              No products in this category yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {category.products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}