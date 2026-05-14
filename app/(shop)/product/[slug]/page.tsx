import { notFound } from "next/navigation";
import { sanityFetch } from "@/sanity/lib/fetch";
import { productBySlugQuery } from "@/sanity/lib/queries";
import { ProductDetail } from "@/components/product/ProductDetail";
import type { Product } from "@/types";

export const revalidate = 60;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await sanityFetch<Product | null>({
    query: productBySlugQuery,
    params: { slug },
    tags: ["product"],
  });
  if (!product) notFound();
  return <ProductDetail product={product} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await sanityFetch<Product | null>({
    query: productBySlugQuery,
    params: { slug },
  });
  if (!p) return { title: "Product not found" };
  return {
    title: p.name,
    description: p.description,
  };
}
