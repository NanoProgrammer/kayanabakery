import { NextResponse } from "next/server";
import { client } from "@/lib/sanity/lib/client";

/**
 * GET /api/categories
 *
 * Returns ALL product categories from Sanity CMS.
 * Used by the CategoryDropdown in the header.
 * Cached for 5 minutes.
 */

// Top level, each with whatever sits under it, so the header can show Cakes
// and its subcategories in one pass. Categories written before subcategories
// existed have no parent, so they all stay top level.
const QUERY = `*[_type == "category" && !defined(parent)] | order(displayOrder asc, name asc) {
  _id,
  "slug": slug.current,
  "title": name,
  "titleEs": nameEs,
  "image": image.asset->url,
  "children": *[_type == "category" && parent._ref == ^._id] | order(displayOrder asc, name asc) {
    _id,
    "slug": slug.current,
    "title": name,
    "titleEs": nameEs,
    "image": image.asset->url
  }
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
