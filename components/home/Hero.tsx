import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";
import type { SiteSettings } from "@/types";

type Props = { settings?: SiteSettings | null };

export function Hero({ settings }: Props) {
  const title = settings?.heroTitle || "More than bread, a home memory.";
  const subtitle =
    settings?.heroSubtitle ||
    "Handcrafted Mexican pan dulce, conchas, and next-level cakes — baked fresh in Calgary with the warmth of abuelita's kitchen.";

  const heroImage = settings?.heroImage
    ? urlFor(settings.heroImage).width(900).height(1100).url()
    : "https://karyanabakery.ca/wp-content/uploads/2025/06/20241221_143840-Edited.png";

  return (
    <section className="relative overflow-hidden bg-cream pb-16 pt-12 md:pb-24 md:pt-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-concha-rosa/30 blur-3xl" />
        <div className="absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-otomi-yellow/20 blur-3xl" />
      </div>

      <div className="container-bakery relative">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px w-12 bg-otomi-red" />
              <span className="eyebrow">fresh from the oven</span>
            </div>

            <h1 className="font-display text-[length:var(--text-display-xl)] leading-[var(--text-display-xl--line-height)] tracking-[var(--text-display-xl--letter-spacing)] font-normal text-ink">
              {title.includes("bread") ? (
                <>
                  {title.split("bread")[0]}
                  <span className="relative inline-block">
                    <span className="relative z-10 italic">bread</span>
                    <svg
                      className="absolute -bottom-2 left-0 z-0 w-full"
                      viewBox="0 0 200 12"
                      preserveAspectRatio="none"
                      fill="none"
                    >
                      <path
                        d="M2 8c40-6 80-6 120 0s70 2 76-2"
                        stroke="#D64545"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span className="text-canela">
                    {title.split("bread")[1]}
                  </span>
                </>
              ) : (
                title
              )}
            </h1>

            <p className="mt-7 max-w-lg text-base leading-relaxed text-ink/70 md:text-lg">
              {subtitle}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/shop" className="btn-primary group">
                Order now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/how-to-order" className="btn-ghost">
                How it works
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-6 border-t border-canela/15 pt-8">
              <div>
                <div className="font-display text-3xl text-canela">2018</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-ink/50">
                  Baking since
                </div>
              </div>
              <div>
                <div className="font-display text-3xl text-canela">100%</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-ink/50">
                  Handmade
                </div>
              </div>
              <div>
                <div className="font-display text-3xl text-canela">15+</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-ink/50">
                  Specialties
                </div>
              </div>
            </div>
          </div>

          <div className="relative lg:col-span-6">
            <div className="relative aspect-[4/5] w-full">
              <div className="relative h-full w-full overflow-hidden rounded-[40px] bg-masa shadow-2xl shadow-canela/10">
                <Image
                  src={heroImage}
                  alt="Signature Karyana cake"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              <div className="absolute -left-4 top-8 flex h-28 w-28 animate-[float_6s_ease-in-out_infinite] items-center justify-center rounded-full bg-cream shadow-xl md:-left-8 md:h-32 md:w-32">
                <div className="text-center">
                  <div className="font-script text-xl text-otomi-red">est.</div>
                  <div className="font-display text-2xl text-canela">2018</div>
                  <div className="mt-0.5 text-[8px] uppercase tracking-[0.2em] text-ink/60">
                    Calgary · AB
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-2 max-w-[240px] rounded-2xl bg-cream p-5 shadow-2xl md:-right-8">
                <div className="mb-2 flex gap-0.5 text-otomi-orange">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className="h-4 w-4 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 1l2.5 6.5L19 8l-5 4.5L15.5 19 10 15.5 4.5 19 6 12.5 1 8l6.5-.5z" />
                    </svg>
                  ))}
                </div>
                <p className="font-display text-sm italic leading-snug text-ink">
                  &ldquo;Best conchas I&apos;ve had outside of Mexico.&rdquo;
                </p>
                <p className="mt-2 text-xs text-ink/60">— Maria G., Calgary</p>
              </div>

              <svg
                className="absolute -top-6 right-10 h-16 w-16 rotate-12 text-otomi-teal md:h-20 md:w-20"
                viewBox="0 0 100 100"
                fill="currentColor"
              >
                <path d="M50 10 L55 40 L85 35 L60 55 L80 85 L50 65 L20 85 L40 55 L15 35 L45 40 Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
