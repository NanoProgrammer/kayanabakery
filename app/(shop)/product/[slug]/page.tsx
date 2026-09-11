import { notFound } from "next/navigation";
import { sanityFetch } from "@/sanity/lib/fetch";
import { productBySlugQuery } from "@/sanity/lib/queries";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ogImageUrl, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT } from "@/sanity/lib/image";
import { getRequestOrigin } from "@/lib/seo/origin";
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
    params: { slug: slug.toLowerCase() },
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
    params: { slug: slug.toLowerCase() },
    tags: ["product"],
  }).catch(() => null);
  if (!p) return { title: "Product not found" };

  const origin = await getRequestOrigin();
  const pageUrl = `${origin}/product/${slug}`;

  // Fall back to the gallery, then the site's default share image, so a
  // product with a missing/broken main photo still gets a real og:image
  // instead of silently dropping the whole openGraph/twitter block.
  const imageUrl =
    ogImageUrl(p.image) ??
    ogImageUrl(p.gallery?.[0]) ??
    `${origin}/og-default.jpg`;

  return {
    title: p.name,
    description: p.description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: p.name,
      description: p.description,
      url: pageUrl,
      type: "website",
      images: [{ url: imageUrl, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }],
    },
    twitter: {
      card: "summary_large_image",
      title: p.name,
      description: p.description,
      images: [imageUrl],
    },
  };
}
