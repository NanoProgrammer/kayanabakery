import { sanityFetch } from "@/sanity/lib/fetch";
import { allProductsQuery } from "@/sanity/lib/queries";
import { ogImageUrlFor } from "@/sanity/lib/image";
import type { Product } from "@/types";

const FALLBACK_IMAGE = "/og-default.jpg";

export type BlogImagePools = {
  /** category slug -> a real product photo from that category */
  byCategory: Record<string, string>;
  /** every product photo, in display order, for posts with no matching category */
  fallbackPool: string[];
};

/**
 * Real product photos to use as blog headers — pulled straight from the
 * product catalog (every product has a required image) rather than a
 * category cover photo, since several categories don't have one set.
 */
export async function getBlogImagePools(): Promise<BlogImagePools> {
  const products = await sanityFetch<Product[]>({
    query: allProductsQuery,
    tags: ["product"],
  }).catch(() => [] as Product[]);

  const byCategory: Record<string, string> = {};
  const fallbackPool: string[] = [];

  for (const p of products ?? []) {
    if (!p.image) continue;
    const url = ogImageUrlFor(p.image).width(900).height(675).url();
    fallbackPool.push(url);
    for (const cat of p.categories ?? []) {
      if (cat?.slug && !byCategory[cat.slug]) {
        byCategory[cat.slug] = url;
      }
    }
  }

  return { byCategory, fallbackPool };
}

/**
 * Resolves the header photo for a post. Posts with no matching category
 * (or a category with no products yet) rotate through the general product
 * pool by index, so they don't all repeat the same fallback image.
 */
export function resolveBlogImage(
  categorySlug: string | null,
  pools: BlogImagePools,
  fallbackIndex = 0
): string {
  if (categorySlug && pools.byCategory[categorySlug]) {
    return pools.byCategory[categorySlug];
  }
  if (pools.fallbackPool.length > 0) {
    return pools.fallbackPool[fallbackIndex % pools.fallbackPool.length];
  }
  return FALLBACK_IMAGE;
}
