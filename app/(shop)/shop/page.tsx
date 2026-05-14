import { sanityFetch } from "@/sanity/lib/fetch";
import {
  allProductsQuery,
  allCategoriesQuery,
} from "@/sanity/lib/queries";
import { ShopGrid } from "@/components/product/ShopGrid";
import type { Product, Category } from "@/types";

export const revalidate = 60;

export const metadata = {
  title: "Shop",
  description: "Browse our full menu of fresh Mexican breads and pastries.",
};

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    sanityFetch<Product[]>({
      query: allProductsQuery,
      tags: ["product"],
    }),
    sanityFetch<Category[]>({
      query: allCategoriesQuery,
      tags: ["category"],
    }),
  ]);

  return <ShopGrid products={products} categories={categories} />;
}
