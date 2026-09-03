import { notFound } from "next/navigation";
import { sanityFetch } from "@/sanity/lib/fetch";
import { productBySlugQuery } from "@/sanity/lib/queries";
import { ProductDetail } from "@/components/product/ProductDetail";
import { urlFor } from "@/sanity/lib/image";
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

  const imageUrl = p.image
    ? urlFor(p.image).width(1200).height(1200).url()
    : undefined;

  return {
    title: p.name,
    description: p.description,
    openGraph: imageUrl
      ? {
          title: p.name,
          description: p.description,
          images: [{ url: imageUrl, width: 1200, height: 1200 }],
        }
      : undefined,
    twitter: imageUrl
      ? {
          card: "summary_large_image",
          title: p.name,
          description: p.description,
          images: [imageUrl],
        }
      : undefined,
  };
}
