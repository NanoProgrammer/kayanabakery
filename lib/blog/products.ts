import { sanityFetch } from "@/sanity/lib/fetch";
import {
  productsByCategorySlugQuery,
  featuredProductsQuery,
} from "@/sanity/lib/queries";
import type { Product } from "@/types";

/**
 * Real products to showcase at the end of a blog post — from the post's
 * matching category when it has one, otherwise the site's featured
 * products, so every post ends with actual product photos instead of
 * reusing the same category thumbnail.
 */
export async function getFeaturedProductsForPost(
  categorySlug: string | null
): Promise<Product[]> {
  if (categorySlug) {
    const products = await sanityFetch<Product[]>({
      query: productsByCategorySlugQuery,
      params: { slug: categorySlug },
      tags: ["product"],
    }).catch(() => [] as Product[]);
    if (products?.length) return products;
  }

  return sanityFetch<Product[]>({
    query: featuredProductsQuery,
    tags: ["product"],
  }).catch(() => [] as Product[]);
}
