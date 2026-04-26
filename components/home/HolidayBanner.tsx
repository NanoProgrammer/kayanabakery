import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";
import type { HomePromo } from "@/types";

type Props = { promo: HomePromo | null };

export function HolidayBanner({ promo }: Props) {
  if (!promo) return null;

  const image = promo.image
    ? urlFor(promo.image).width(900).height(900).url()
    : "";

  return (
    <section className="relative bg-cream py-20 md:py-28">
      <div className="container-bakery">
        <div className="relative overflow-hidden rounded-[40px] bg-concha-rosa/40">
          <div className="pointer-events-none absolute inset-0">
            <svg
              className="absolute -right-20 -top-20 h-[400px] w-[400px] text-otomi-red/10"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              <circle cx="50" cy="50" r="48" />
            </svg>
            <svg
              className="absolute -left-10 -bottom-10 h-[300px] w-[300px] rotate-45 text-otomi-teal/10"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              <path d="M50 10 L55 40 L85 35 L60 55 L80 85 L50 65 L20 85 L40 55 L15 35 L45 40 Z" />
            </svg>
          </div>

          <div className="relative grid grid-cols-1 items-center gap-8 p-8 md:grid-cols-2 md:gap-12 md:p-14 lg:p-20">
            <div>
              {promo.eyebrow && (
                <div className="mb-5 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-otomi-red" />
                  <span className="text-xs font-bold uppercase tracking-widest text-otomi-red">
                    {promo.eyebrow}
                  </span>
                </div>
              )}

              <h2 className="font-display text-[length:var(--text-display-lg)] leading-[var(--text-display-lg--line-height)] tracking-[var(--text-display-lg--letter-spacing)] text-ink">
                {promo.title}
              </h2>

              {promo.description && (
                <p className="mt-6 max-w-lg text-base leading-relaxed text-ink/70 md:text-lg">
                  {promo.description}
                </p>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-6">
                <Link
                  href={promo.ctaHref || "/shop"}
                  className="btn-primary group"
                >
                  {promo.ctaLabel || "Shop now"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                {promo.validUntil && (
                  <div className="flex items-center gap-2 text-sm text-ink/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-otomi-red" />
                    Available through {promo.validUntil}
                  </div>
                )}
              </div>
            </div>

            <div className="relative aspect-square w-full">
              <div className="relative h-full w-full overflow-hidden rounded-[32px] bg-cream shadow-2xl shadow-canela/20">
                {image && (
                  <Image
                    src={image}
                    alt={promo.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                )}
              </div>

              {promo.discount && (
                <div className="absolute -right-4 top-10 flex h-28 w-28 rotate-12 animate-[float_6s_ease-in-out_infinite] items-center justify-center rounded-full bg-otomi-red text-cream shadow-xl md:-right-8 md:h-32 md:w-32">
                  <div className="text-center">
                    <div className="font-script text-sm leading-none">only</div>
                    <div className="font-display text-2xl leading-tight md:text-3xl">
                      {promo.discount}
                    </div>
                    <div className="text-[8px] uppercase tracking-[0.2em] opacity-80">
                      limited time
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
