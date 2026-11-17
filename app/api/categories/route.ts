import { NextResponse } from "next/server";
import { client } from "@/lib/sanity/lib/client";
import { CAKE_FAMILIES } from "@/lib/products/cake-families";

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
    const categories = await client.fetch<any[]>(
      QUERY,
      {},
      { next: { revalidate: 300 } }
    );

    // The four cake subcategories are meant to be categories in Sanity,
    // created by a setup script that has never been run — so the header
    // submenu had nothing to show under Cakes. They are built into the code
    // and filled in here only when Sanity has none; a real subcategory takes
    // precedence. See lib/products/cake-families.ts.
    const withCakeFamilies = (categories ?? []).map((cat: any) => {
      if (cat?.slug !== "cakes" || cat?.children?.length) return cat;
      return {
        ...cat,
        children: CAKE_FAMILIES.map((f) => ({
          _id: `builtin-${f.slug}`,
          slug: f.slug,
          title: f.name,
          titleEs: f.nameEs,
        })),
      };
    });

    return NextResponse.json({ categories: withCakeFamilies });
  } catch (err: any) {
    console.error("[api/categories]", err.message);
    return NextResponse.json(
      { categories: [], error: err.message },
      { status: 500 }
    );
  }
}
