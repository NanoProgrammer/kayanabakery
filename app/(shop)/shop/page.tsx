import { sanityFetch } from "@/sanity/lib/fetch";
import {
  allProductsQuery,
  allCategoriesQuery,
} from "@/sanity/lib/queries";
import { ShopGrid } from "@/components/product/ShopGrid";
import { prisma } from "@/lib/prisma";
import {
  tallySales,
  SALES_WINDOW_DAYS,
  COUNTED_STATUSES,
  type SalesBySlug,
} from "@/lib/products/bestsellers";
import type { Product, Category } from "@/types";

/**
 * What actually sold, for the "Más vendidos" default (Situación 12).
 *
 * Fails soft on purpose. If the database cannot be reached — at build
 * time, or during an outage — the shop still renders and sorts by the
 * Studio's tag, exactly as it did before. A sort order is not worth a
 * broken page.
 */
async function readSales(): Promise<SalesBySlug | null> {
  try {
    const since = new Date(Date.now() - SALES_WINDOW_DAYS * 86_400_000);
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { in: [...COUNTED_STATUSES] } },
      select: { createdAt: true, items: true },
    });
    return tallySales(orders, new Date());
  } catch (err) {
    console.error("[shop] could not read sales; falling back to the tag:", err);
    return null;
  }
}

export const revalidate = 60;

export const metadata = {
  title: "Shop",
  description: "Browse our full menu of fresh Mexican breads and pastries.",
};

export default async function ShopPage() {
  const [products, categories, sales] = await Promise.all([
    sanityFetch<Product[]>({
      query: allProductsQuery,
      tags: ["product"],
    }),
    sanityFetch<Category[]>({
      query: allCategoriesQuery,
      tags: ["category"],
    }),
    readSales(),
  ]);

  return <ShopGrid products={products} categories={categories} sales={sales} />;
}
