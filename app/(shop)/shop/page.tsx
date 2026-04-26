import { ProductCard } from "@/components/product/ProductCard";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  allProductsQuery,
  allCategoriesQuery,
} from "@/sanity/lib/queries";
import Link from "next/link";
import type { Product, Category } from "@/types";

export const revalidate = 60;
export const metadata = {
  title: "Shop · Karyana Bakery",
  description: "Browse our full menu of handcrafted Mexican pan dulce.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category;

  const [products, categories] = await Promise.all([
    sanityFetch<Product[]>({ query: allProductsQuery, tags: ["product"] }),
    sanityFetch<Category[]>({ query: allCategoriesQuery, tags: ["category"] }),
  ]);

  const filtered = activeCategory
    ? products.filter((p) =>
        p.categories?.some((c) => c.slug === activeCategory)
      )
    : products;

  return (
    <div className="container-bakery py-14 md:py-20">
      <header className="mb-12 text-center">
        <span className="eyebrow mb-3">Full menu</span>
        <h1 className="section-title mx-auto max-w-3xl">
          Every good thing we <span className="italic text-otomi-red">bake.</span>
        </h1>
      </header>

      {/* Category chips */}
      <div className="mb-12 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/shop"
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
            !activeCategory
              ? "bg-canela text-cream"
              : "border border-canela/20 text-canela hover:border-canela"
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat._id}
            href={`/shop?category=${cat.slug}`}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              activeCategory === cat.slug
                ? "bg-canela text-cream"
                : "border border-canela/20 text-canela hover:border-canela"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-ink/60">No products in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
