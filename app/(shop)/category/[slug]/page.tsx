import { ProductCard } from "@/components/product/ProductCard";
import { sanityFetch } from "@/sanity/lib/fetch";
import { categoryBySlugQuery } from "@/sanity/lib/queries";
import {
  urlFor,
  ogImageUrl,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
} from "@/sanity/lib/image";
import { getRequestOrigin } from "@/lib/seo/origin";
import { cleanMetaText } from "@/lib/seo/meta";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cookies } from "next/headers";
import type { Category, Product } from "@/types";

export const revalidate = 60;

type SubCategory = {
  _id: string;
  name: string;
  nameEs?: string;
  slug: string;
  tagline?: string;
  taglineEs?: string;
  image?: any;
  productCount?: number;
};

type CategoryWithProducts = Category & {
  products: Product[];
  children?: SubCategory[];
  parent?: { name: string; nameEs?: string; slug: string } | null;
};

function pickI18n<T extends Record<string, any>>(
  doc: T,
  key: keyof T & string,
  locale: string
): string {
  if (locale === "es") {
    const esKey = `${key}Es` as keyof T;
    if (doc[esKey]) return doc[esKey] as string;
  }
  return doc[key] as string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const cookieStore = await cookies();
  const locale = cookieStore.get("karyana-lang")?.value === "es" ? "es" : "en";

  const category = await sanityFetch<CategoryWithProducts | null>({
    query: categoryBySlugQuery,
    params: { slug: slug.toLowerCase() },
    tags: ["category", "product"],
  }).catch(() => null);

  if (!category) return { title: "Category not found" };

  const name = cleanMetaText(pickI18n(category, "name", locale), 100) ?? "Karyana Bakery";
  const description = cleanMetaText(pickI18n(category, "description", locale));
  // Fall back to the first product's photo, then the site's default share
  // image, so a category with no cover photo set still gets a real
  // og:image instead of silently dropping the whole openGraph block.
  const origin = await getRequestOrigin();
  const pageUrl = `${origin}/category/${slug}`;
  const imageUrl =
    ogImageUrl(category.image) ??
    ogImageUrl(category.products?.[0]?.image) ??
    `${origin}/og-default.jpg`;

  return {
    title: name,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: name,
      description,
      url: pageUrl,
      type: "website",
      images: [{ url: imageUrl, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: [imageUrl],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const cookieStore = await cookies();
  const locale = cookieStore.get("karyana-lang")?.value === "es" ? "es" : "en";

  const category = await sanityFetch<CategoryWithProducts | null>({
    query: categoryBySlugQuery,
    params: { slug: slug.toLowerCase() },
    tags: ["category", "product"],
  });

  if (!category) notFound();

  const name        = pickI18n(category, "name", locale);
  const tagline     = pickI18n(category, "tagline", locale);
  const description = pickI18n(category, "description", locale);

  const heroImage = category.image
    ? urlFor(category.image).width(1600).height(600).url()
    : null;

  const isCakes = slug === "cakes";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-masa/60 py-20 md:py-28">
        {heroImage && (
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt={name}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-cream/40 via-cream/30 to-cream" />
          </div>
        )}
        <div className="container-bakery relative text-center">
          {tagline && (
            <span className="eyebrow mb-3">{tagline}</span>
          )}
          <h1 className="font-display text-[length:var(--text-display-lg)] leading-[var(--text-display-lg--line-height)] tracking-[var(--text-display-lg--letter-spacing)] text-ink">
            {name}
          </h1>
          {description && (
            <p className="mx-auto mt-5 max-w-xl text-ink/70">
              {description}
            </p>
          )}
        </div>
      </section>

      {/* Custom Cake CTA — solo en /category/cakes */}
      {isCakes && (
        <section className="container-bakery py-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-canela-dark to-canela p-8 md:p-12">
            <div className="relative z-10 max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cream">
                <Sparkles className="h-3 w-3" />
                {locale === "es" ? "Pedidos personalizados" : "Custom orders"}
              </div>
              <h2 className="font-display text-3xl text-cream md:text-4xl">
                {locale === "es"
                  ? "Imagínalo. Nosotros lo horneamos."
                  : "Dream it. We'll bake it."}
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-cream/80">
                {locale === "es"
                  ? "Cumpleaños, quinceañeras, baby showers o simplemente porque sí — cuéntanos tu tema, sabores y fecha y crearemos algo inolvidable. Pasteles personalizados desde $85, con 72h de anticipación."
                  : "Birthdays, quinceañeras, baby showers, or just because — tell us your theme, flavors, and date and we'll create something unforgettable. Custom cakes start at $85 and need 72h advance notice."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/custom-cake"
                  className="inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-medium text-canela-dark transition-colors hover:bg-white"
                >
                  {locale === "es" ? "Ordenar pastel →" : "Order a custom cake →"}
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-full border border-cream/40 px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-white/10"
                >
                  {locale === "es" ? "¿Tienes preguntas? Contáctanos" : "Have questions? Contact us"}
                </Link>
              </div>
            </div>
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/5" />
          </div>
        </section>
      )}

      {/* Products grid */}
      {/* Subcategories. A category that has them is a menu, not a shelf: Cakes
          leads to Tres Leches, Gourmet and Clásicos rather than listing every
          cake at once. Products filed directly here still show underneath. */}
      {!!category.children?.length && (
        <section className="container-bakery pt-16 md:pt-20">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {category.children.map((child) => {
              const childName = pickI18n(child as any, "name", locale);
              const childTagline = pickI18n(child as any, "tagline", locale);
              return (
                <Link
                  key={child._id}
                  href={`/category/${child.slug}`}
                  className="group overflow-hidden rounded-3xl border border-canela/15 bg-cream transition hover:border-canela-dark"
                >
                  <div className="relative aspect-[4/3] bg-canela-light">
                    {child.image && (
                      <Image
                        src={urlFor(child.image).width(600).height(450).url()}
                        alt={childName}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="font-display text-2xl">{childName}</h2>
                    {childTagline && (
                      <p className="mt-1 text-sm text-ink-soft">{childTagline}</p>
                    )}
                    {typeof child.productCount === "number" && (
                      <p className="mt-2 text-xs uppercase tracking-widest text-ink-soft">
                        {child.productCount}{" "}
                        {locale === "es"
                          ? child.productCount === 1
                            ? "producto"
                            : "productos"
                          : child.productCount === 1
                          ? "item"
                          : "items"}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="container-bakery py-16 md:py-20">
        {!category.products?.length ? (
          category.children?.length ? null : (
            <div className="py-12 text-center">
              <p className="text-ink/60">
                {locale === "es"
                  ? "Sin productos en esta categoría por ahora. ¡Vuelve pronto!"
                  : "No products in this category yet. Check back soon!"}
              </p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {category.products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}