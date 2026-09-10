import { sanityFetch } from "@/sanity/lib/fetch";
import { allCategoriesQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import type { Category } from "@/types";

const FALLBACK_IMAGE = "/og-default.jpg";

/** Maps category slug -> real product photo URL, pulled from the existing Sanity categories. */
export async function getBlogCategoryImages(): Promise<Record<string, string>> {
  const categories = await sanityFetch<Category[]>({
    query: allCategoriesQuery,
    tags: ["category"],
  }).catch(() => [] as Category[]);

  const map: Record<string, string> = {};
  for (const c of categories ?? []) {
    if (c.image) map[c.slug] = urlFor(c.image).width(900).height(675).url();
  }
  return map;
}

export function resolveBlogImage(
  categorySlug: string | null,
  imagesBySlug: Record<string, string>
): string {
  if (categorySlug && imagesBySlug[categorySlug]) {
    return imagesBySlug[categorySlug];
  }
  return FALLBACK_IMAGE;
}
