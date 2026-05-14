"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, pickI18n } from "@/lib/i18n/locale-provider";
import { urlFor } from "@/sanity/lib/image";
import type { HomePromo } from "@/types";

export function HolidayBanner({ promo }: { promo: HomePromo }) {
  const { locale } = useLocale();

  const eyebrow = pickI18n(promo, "eyebrow", locale);
  const title = pickI18n(promo, "title", locale) || promo.title;
  const description = pickI18n(promo, "description", locale);
  const ctaLabel =
    pickI18n(promo, "ctaLabel", locale) || promo.ctaLabel || "Shop now";

  return (
    <section className="container-bakery py-24">
      <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-canela-dark p-8 text-cream md:grid-cols-2 md:p-12">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image
            src={urlFor(promo.image).width(900).height(700).url()}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div>
          {eyebrow && (
            <span className="inline-block rounded-full bg-cream/20 px-3 py-1 text-xs uppercase tracking-[0.2em]">
              {eyebrow}
            </span>
          )}
          <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-base leading-relaxed text-cream/90">
              {description}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {promo.ctaHref && (
              <Link
                href={promo.ctaHref}
                className="inline-flex items-center justify-center rounded-full bg-cream px-7 py-3.5 text-sm font-medium text-ink transition-all hover:bg-canela-light"
              >
                {ctaLabel} →
              </Link>
            )}
            {promo.discount && (
              <span className="rounded-full border border-cream/30 px-4 py-2 text-xs font-bold tracking-widest">
                {promo.discount}
              </span>
            )}
          </div>
          {promo.validUntil && (
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-cream/70">
              {locale === "es" ? "Válido hasta" : "Valid until"} ·{" "}
              {promo.validUntil}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
