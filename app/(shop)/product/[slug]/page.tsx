import { notFound } from "next/navigation";
import { sanityFetch } from "@/sanity/lib/fetch";
import { productBySlugQuery } from "@/sanity/lib/queries";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ogImageProxyUrl } from "@/sanity/lib/image";
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

  // Fall back to the gallery, then the site's default share image, so a
  // product with a missing/broken main photo still gets a real og:image
  // instead of silently dropping the whole openGraph/twitter block.
  const rawImage = p.image ?? p.gallery?.[0];
  const imageUrl = rawImage
    ? ogImageProxyUrl(rawImage, { width: 1200, height: 1200 })
    : "/og-default.jpg";

  return {
    title: p.name,
    description: p.description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      title: p.name,
      description: p.description,
      url: `/product/${slug}`,
      type: "website",
      images: [{ url: imageUrl, width: 1200, height: 1200 }],
    },
    twitter: {
      card: "summary_large_image",
      title: p.name,
      description: p.description,
      images: [imageUrl],
    },
  };
}
