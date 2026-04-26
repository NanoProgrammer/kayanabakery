import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/lib/image";
import { formatPrice } from "@/lib/utils";
import { QuantityAddToCart } from "./QuantityAddToCart";
import type { Product } from "@/types";

const tagStyles: Record<string, string> = {
  bestseller: "bg-otomi-red text-cream",
  new: "bg-otomi-teal text-cream",
  seasonal: "bg-otomi-orange text-cream",
  limited: "bg-otomi-purple text-cream",
};

const tagLabels: Record<string, string> = {
  bestseller: "Bestseller",
  new: "New",
  seasonal: "Seasonal",
  limited: "Limited",
};

type Props = {
  product: Product;
  priority?: boolean;
};

export function ProductCard({ product, priority }: Props) {
  const imageUrl = product.image
    ? urlFor(product.image).width(600).height(600).url()
    : "/placeholder.png";

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-cream transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-canela/10">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-masa"
      >
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={`object-cover transition-transform duration-700 group-hover:scale-110 ${
            !product.inStock ? "grayscale" : ""
          }`}
        />
        {product.tag && (
          <span
            className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
              tagStyles[product.tag] || "bg-canela text-cream"
            }`}
          >
            {tagLabels[product.tag] || product.tag}
          </span>
        )}
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <span className="absolute right-4 top-4 rounded-full bg-otomi-red px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cream">
            Sale
          </span>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/30">
            <span className="rounded-full bg-cream px-5 py-2 text-xs font-bold uppercase tracking-widest text-canela">
              Out of stock
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/product/${product.slug}`}>
            <h3 className="font-display text-xl text-ink transition-colors hover:text-otomi-red">
              {product.name}
            </h3>
          </Link>
          <div className="shrink-0 text-right">
            {product.compareAtPrice &&
              product.compareAtPrice > product.price && (
                <span className="block text-sm text-ink/40 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            <span className="font-display text-xl text-canela">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
        {product.description && (
          <p className="mt-2 line-clamp-2 text-sm text-ink/60">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-5">
          <QuantityAddToCart product={product} />
          {product.leadTime && product.leadTime > 0 ? (
            <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-ink/50">
              {product.leadTime}h prep time
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
