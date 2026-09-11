import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { BLOG_POSTS, BLOG_KIND_LABEL, getBlogPost } from "@/lib/blog/posts";
import { getBlogImagePools, resolveBlogImage } from "@/lib/blog/images";
import { getFeaturedProductsForPost } from "@/lib/blog/products";
import { ProductCard } from "@/components/product/ProductCard";
import { OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT } from "@/sanity/lib/image";

export const revalidate = 3600;

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Post not found" };

  const cookieStore = await cookies();
  const locale = cookieStore.get("karyana-lang")?.value === "es" ? "es" : "en";
  const postIndex = BLOG_POSTS.findIndex((p) => p.slug === slug);
  const imagePools = await getBlogImagePools();
  const imageUrl = resolveBlogImage(post.categorySlug, imagePools, postIndex);

  return {
    title: post.title[locale],
    description: post.metaDescription[locale],
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title[locale],
      description: post.metaDescription[locale],
      url: `/blog/${slug}`,
      type: "article",
      images: [{ url: imageUrl, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title[locale],
      description: post.metaDescription[locale],
      images: [imageUrl],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const cookieStore = await cookies();
  const locale = cookieStore.get("karyana-lang")?.value === "es" ? "es" : "en";
  const [imagePools, featuredProducts] = await Promise.all([
    getBlogImagePools(),
    getFeaturedProductsForPost(post.categorySlug),
  ]);
  const postIndex = BLOG_POSTS.findIndex((p) => p.slug === post.slug);
  const heroImage = resolveBlogImage(post.categorySlug, imagePools, postIndex);

  return (
    <article className="container-bakery py-16 md:py-20">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/blog"
          className="text-sm font-medium text-canela-dark hover:underline"
        >
          {locale === "es" ? "← Volver al blog" : "← Back to blog"}
        </Link>

        <span className="mt-6 inline-flex w-fit items-center rounded-full bg-canela-light px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-canela-dark">
          {BLOG_KIND_LABEL[post.kind][locale]}
        </span>

        <h1 className="mt-3 font-display text-[length:var(--text-display-md)] leading-[var(--text-display-md--line-height)] tracking-[var(--text-display-md--letter-spacing)] text-ink">
          {post.title[locale]}
        </h1>
        <p className="mt-3 font-script text-2xl text-canela-dark">
          {post.scriptTag[locale]}
        </p>

        <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-3xl bg-canela-light">
          <Image
            src={heroImage}
            alt={post.title[locale]}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover"
          />
        </div>

        {post.categorySlug && (
          <Link
            href={`/category/${post.categorySlug}`}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-canela-dark hover:underline"
          >
            {locale === "es" ? "Ver estos productos →" : "Shop these products →"}
          </Link>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {post.keywords[locale].map((kw) => (
            <span
              key={kw}
              className="rounded-full bg-masa px-3 py-1 text-xs text-ink-soft"
            >
              {kw}
            </span>
          ))}
        </div>

        <div className="prose prose-sm mt-10 max-w-none text-ink-soft">
          {post.body.map((block, i) =>
            block.type === "h3" ? (
              <h3
                key={i}
                className="mt-8 font-display text-xl text-ink first:mt-0"
              >
                {block[locale]}
              </h3>
            ) : (
              <p key={i} className="mt-4 leading-relaxed">
                {block[locale]}
              </p>
            )
          )}
        </div>

        <div className="mt-10 border-t border-canela/15 pt-8">
          <Link href={post.ctaHref} className="btn-primary">
            {post.ctaLabel[locale]}
          </Link>
        </div>
      </div>

      {featuredProducts.length > 0 && (
        <div className="mx-auto mt-16 max-w-4xl border-t border-canela/15 pt-12">
          <h2 className="font-display text-2xl text-ink md:text-3xl">
            {locale === "es" ? "Productos destacados" : "Featured products"}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          <Link href="/shop" className="btn-ghost mt-8 inline-flex">
            {locale === "es" ? "Ver todo el menú →" : "See the full menu →"}
          </Link>
        </div>
      )}
    </article>
  );
}
