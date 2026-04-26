import { ProductCard } from "@/components/product/ProductCard";
import { sanityFetch } from "@/sanity/lib/fetch";
import { categoryBySlugQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import { notFound } from "next/navigation";
import Image from "next/image";
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

  return (
    <>
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
