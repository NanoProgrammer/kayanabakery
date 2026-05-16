import { NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity/client";

/**
 * GET /api/categories
 *
 * Returns all product categories from Sanity CMS.
 * Cached for 5 minutes (ISR-style via Next.js fetch caching).
 */

const QUERY = `*[_type == "category"] | order(orderRank asc, title asc) {
  _id,
  "slug": slug.current,
  title,
  titleEs,
  "image": image.asset->url
}`;

export async function GET() {
  try {
    const categories = await sanityClient.fetch(
      QUERY,
      {},
      { next: { revalidate: 300 } } // 5 min cache
    );

    return NextResponse.json({ categories });
  } catch (err: any) {
    console.error("[api/categories]", err.message);
    return NextResponse.json({ categories: [], error: err.message }, { status: 500 });
  }
}
