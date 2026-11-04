import { NextResponse } from "next/server";
import { client } from "@/lib/sanity/lib/client";
import {
  shouldSuggestToppers,
  suggestionsToShow,
  TOPPER_CATEGORY_SLUG,
  type SuggestableProduct,
} from "@/lib/products/addons";

/**
 * GET /api/addons/toppers?productId=…&inCart=id,id
 *
 * Whether the cake just added to the cart should be offered a topper, and
 * which toppers to offer. The browser does not hold the catalog, so it cannot
 * tell a tres leches from a concha — it asks, and draws whatever comes back.
 *
 * An empty list is the normal answer for most products. The dialog opens only
 * when there is something in it.
 */
export const revalidate = 300;

const PRODUCT_CATEGORIES = `*[_type == "product" && _id == $productId][0]{
  "categorySlugs": categories[]->slug.current
}`;

const TOPPERS = `*[_type == "product" && $slug in categories[]->slug.current && !(_id in path("drafts.**"))]
  | order(displayOrder asc, name asc) {
    _id,
    name,
    nameEs,
    "slug": slug.current,
    price,
    "image": image.asset->url,
    soldOut
  }`;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ suggest: false, toppers: [] });
  }

  const inCart = (url.searchParams.get("inCart") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const product = await client.fetch<{ categorySlugs?: string[] } | null>(
      PRODUCT_CATEGORIES,
      { productId },
      { next: { revalidate: 300 } }
    );

    if (!shouldSuggestToppers(product?.categorySlugs)) {
      return NextResponse.json({ suggest: false, toppers: [] });
    }

    const toppers = await client.fetch<SuggestableProduct[]>(
      TOPPERS,
      { slug: TOPPER_CATEGORY_SLUG },
      { next: { revalidate: 300 } }
    );

    const show = suggestionsToShow({
      toppers: toppers ?? [],
      productIdsInCart: inCart,
    });

    return NextResponse.json({ suggest: show.length > 0, toppers: show });
  } catch (err: any) {
    // A suggestion is a nicety. If Sanity is unreachable the customer should
    // carry on to the checkout, not meet an error over a decoration.
    console.error("[api/addons/toppers]", err?.message ?? err);
    return NextResponse.json({ suggest: false, toppers: [] });
  }
}
