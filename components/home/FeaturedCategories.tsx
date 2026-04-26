import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";
import type { Category } from "@/types";

const layouts = [
  "md:col-span-7 aspect-[4/3]",
  "md:col-span-5 aspect-[3/4]",
  "md:col-span-5 aspect-[4/3]",
  "md:col-span-7 aspect-[4/3]",
];

const fallbackImages = [
  "https://karyanabakery.ca/wp-content/uploads/2025/06/428691672_274905795636586_551486907034465799_n-1.jpg",
  "https://karyanabakery.ca/wp-content/uploads/elementor/thumbs/20240801_181722-scaled-rfxbr5zg25rab7ugvn6g760qegah5ff5gt5iawohb4.jpg",
  "https://karyanabakery.ca/wp-content/uploads/2025/07/assorted-mex-bread-1024x576.jpg",
  "https://karyanabakery.ca/wp-content/uploads/2025/06/Untitled-design-3-1-1024x899.png",
];

type Props = { categories: Category[] };

export function FeaturedCategories({ categories }: Props) {
  if (!categories?.length) return null;

  return (
    <section className="relative bg-cream py-20 md:py-28">
      <div className="container-bakery">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="eyebrow mb-3">Explore</span>
            <h2 className="section-title max-w-xl">
              Everything we bake,
              <br />
              <span className="italic text-canela">made with love.</span>
            </h2>
          </div>
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-canela"
          >
            <span className="link-underline">See full menu</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
          {categories.slice(0, 4).map((cat, i) => {
            const image = cat.image
              ? urlFor(cat.image).width(800).height(800).url()
              : fallbackImages[i];

            return (
              <Link
                key={cat._id}
                href={`/category/${cat.slug}`}
                className={`group relative overflow-hidden rounded-3xl bg-masa ${layouts[i]}`}
              >
                <Image
                  src={image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
                <div
                  className={`absolute left-5 top-5 h-2 w-2 rounded-full ${
                    cat.accentColor || "bg-otomi-red"
                  }`}
                />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      {cat.tagline && (
                        <p className="mb-1 font-script text-lg text-cream/90">
                          {cat.tagline}
                        </p>
                      )}
                      <h3 className="font-display text-3xl text-cream md:text-4xl">
                        {cat.name}
                      </h3>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream text-canela transition-all duration-300 group-hover:bg-canela group-hover:text-cream">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
