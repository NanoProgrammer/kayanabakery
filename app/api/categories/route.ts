import { NextResponse } from "next/server";
import { client } from "@/lib/sanity/lib/client";

/**
 * GET /api/categories
 *
 * Returns ALL product categories from Sanity CMS.
 * Used by the CategoryDropdown in the header.
 * Cached for 5 minutes.
 */

const QUERY = `*[_type == "category"] | order(displayOrder asc, name asc) {
  _id,
  "slug": slug.current,
  "title": name,
  "titleEs": nameEs,
  "image": image.asset->url
}`;

export async function GET() {
  try {
    const categories = await client.fetch(
      QUERY,
      {},
      { next: { revalidate: 300 } }
    );

    return NextResponse.json({ categories });
  } catch (err: any) {
    console.error("[api/categories]", err.message);
    return NextResponse.json(
      { categories: [], error: err.message },
      { status: 500 }
    );
  }
}
