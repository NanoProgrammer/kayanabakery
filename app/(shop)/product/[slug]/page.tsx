import Image from "next/image";
import Link from "next/link";
import { sanityFetch } from "@/sanity/lib/fetch";
import { productBySlugQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import { formatPrice } from "@/lib/utils";
import { QuantityAddToCart } from "@/components/product/QuantityAddToCart";
import { notFound } from "next/navigation";
import { Clock, AlertCircle, ArrowLeft } from "lucide-react";
import type { Product } from "@/types";
import { PortableText } from "next-sanity";

export const revalidate = 60;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await sanityFetch<Product | null>({
    query: productBySlugQuery,
    params: { slug },
    tags: ["product"],
  });
  if (!product) notFound();

  const mainImage = product.image
    ? urlFor(product.image).width(1200).height(1200).url()
    : "";

  return (
    <div className="container-bakery py-8 md:py-14">
      <Link
        href="/shop"
        className="mb-8 inline-flex items-center gap-2 text-sm text-canela hover:text-canela-dark"
      >
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-masa">
          {mainImage && (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          )}
          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
              <span className="rounded-full bg-cream px-6 py-2 text-sm font-bold uppercase tracking-widest text-canela">
                Out of stock
              </span>
            </div>
          )}
        </div>

        <div>
          {product.categories?.[0] && (
            <Link
              href={`/category/${product.categories[0].slug}`}
              className="mb-3 inline-block font-script text-xl text-otomi-red"
            >
              {product.categories[0].name}
            </Link>
          )}

          <h1 className="font-display text-[length:var(--text-display-md)] leading-[var(--text-display-md--line-height)] tracking-[var(--text-display-md--letter-spacing)] text-ink">
            {product.name}
          </h1>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl text-canela">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice &&
              product.compareAtPrice > product.price && (
                <span className="text-lg text-ink/40 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            {product.unit && (
              <span className="text-sm text-ink/60">/ {product.unit}</span>
            )}
          </div>

          {product.description && (
            <p className="mt-5 text-base leading-relaxed text-ink/70">
              {product.description}
            </p>
          )}

          <div className="mt-8 max-w-sm">
            <QuantityAddToCart product={product} />
          </div>

          <div className="mt-8 space-y-3 rounded-2xl border border-canela/15 bg-masa/40 p-5 text-sm">
            {product.leadTime && product.leadTime > 0 ? (
              <div className="flex items-start gap-3 text-ink/70">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-canela" />
                <span>
                  Please order at least{" "}
                  <strong className="text-ink">
                    {product.leadTime} hours
                  </strong>{" "}
                  in advance.
                </span>
              </div>
            ) : null}
            {product.allergens && product.allergens.length > 0 && (
              <div className="flex items-start gap-3 text-ink/70">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-otomi-red" />
                <span>
                  Contains:{" "}
                  <strong className="text-ink">
                    {product.allergens.join(", ")}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {product.longDescription && (
            <div className="prose prose-sm mt-10 max-w-none text-ink/80">
              <PortableText value={product.longDescription} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
