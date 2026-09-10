import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { BLOG_POSTS, BLOG_KIND_LABEL } from "@/lib/blog/posts";
import { getBlogCategoryImages, resolveBlogImage } from "@/lib/blog/images";

export const metadata = {
  title: "Blog",
  description:
    "Mexican bakery guides for Calgary — conchas, custom cakes, churros, pan dulce, and seasonal treats from Karyana Bakery.",
};

export default async function BlogPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("karyana-lang")?.value === "es" ? "es" : "en";
  const categoryImages = await getBlogCategoryImages();

  return (
    <>
      <header className="container-bakery py-16 md:py-20">
        <span className="eyebrow">Blog</span>
        <h1 className="section-title mt-2">
          {locale === "es"
            ? "Panadería mexicana en Calgary, contada bien."
            : "Mexican bakery in Calgary, told right."}
        </h1>
        <p className="mt-4 max-w-2xl text-ink-soft md:text-lg">
          {locale === "es"
            ? "Guías sobre nuestros productos, la membresía, y las fechas que le importan a la comunidad mexicana en Calgary."
            : "Guides on our products, membership, and the dates that matter to Calgary's Mexican community."}
        </p>
      </header>

      <section className="container-bakery pb-20 md:pb-28">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-canela/15 bg-cream transition-all hover:border-canela/40 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-canela-light">
                <Image
                  src={resolveBlogImage(post.categorySlug, categoryImages)}
                  alt={post.title[locale]}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
              <span className="inline-flex w-fit items-center rounded-full bg-canela-light px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-canela-dark">
                {BLOG_KIND_LABEL[post.kind][locale]}
              </span>
              <h2 className="mt-4 font-display text-xl leading-snug text-ink group-hover:text-canela-dark">
                {post.title[locale]}
              </h2>
              <p className="mt-2 font-script text-lg text-canela-dark">
                {post.scriptTag[locale]}
              </p>
              <p className="mt-3 line-clamp-3 text-sm text-ink-soft">
                {post.metaDescription[locale]}
              </p>
              <span className="mt-4 text-sm font-medium text-canela-dark">
                {locale === "es" ? "Leer artículo →" : "Read article →"}
              </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
