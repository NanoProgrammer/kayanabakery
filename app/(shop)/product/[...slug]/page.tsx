import { notFound } from "next/navigation";
import { sanityFetch } from "@/sanity/lib/fetch";
import { productBySlugQuery } from "@/sanity/lib/queries";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ogImageUrl, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT } from "@/sanity/lib/image";
import { getRequestOrigin } from "@/lib/seo/origin";
import { cleanMetaText } from "@/lib/seo/meta";
import type { Product } from "@/types";

export const revalidate = 60;

function joinSlug(segments: string[]): string {
  return segments.map(decodeURIComponent).join("/").toLowerCase();
}

function isPanDeMuerto(slug: string): boolean {
  return slug === "pan-de-muerto" || slug.startsWith("pan-de-muerto/");
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const product = await sanityFetch<Product | null>({
    query: productBySlugQuery,
    params: { slug: joinSlug(slug) },
    tags: ["product"],
  });
  if (!product) notFound();

  const origin = await getRequestOrigin();
  const pageUrl = `${origin}/product/${slug.join("/")}`;
  const imageUrl =
    ogImageUrl(product.image) ??
    ogImageUrl(product.gallery?.[0]) ??
    `${origin}/og-default.jpg`;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: cleanMetaText(product.description),
    image: [imageUrl],
    url: pageUrl,
    offers: {
      "@type": "Offer",
      priceCurrency: "CAD",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: pageUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ProductDetail product={product} />
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const joinedSlug = joinSlug(slug);
  const p = await sanityFetch<Product | null>({
    query: productBySlugQuery,
    params: { slug: joinedSlug },
    tags: ["product"],
  }).catch(() => null);
  if (!p) return { title: "Product not found" };

  const origin = await getRequestOrigin();
  const pageUrl = `${origin}/product/${slug.join("/")}`;
  const imageUrl =
    ogImageUrl(p.image) ??
    ogImageUrl(p.gallery?.[0]) ??
    `${origin}/og-default.jpg`;

  const baseTitle = cleanMetaText(p.name, 100) ?? "Karyana Bakery";
  const title = isPanDeMuerto(joinedSlug)
    ? cleanMetaText(`${baseTitle} in Calgary | Karyana Bakery`, 100)
    : baseTitle;
  const description = isPanDeMuerto(joinedSlug)
    ? cleanMetaText(
        `${p.description ?? p.name} Order authentic Mexican Pan de Muerto from Karyana Bakery in Calgary, Alberta.`
      )
    : cleanMetaText(p.description);

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "website",
      images: [{ url: imageUrl, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
