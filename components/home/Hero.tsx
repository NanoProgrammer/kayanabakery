"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { urlFor } from "@/sanity/lib/image";
import { cn } from "@/lib/utils";
import type { SiteSettings, Category } from "@/types";

type Slide =
  | { type: "video"; src: string }
  | { type: "info" }
  | { type: "category"; category: Category };

export function Hero({
  settings,
  categories,
}: {
  settings?: SiteSettings;
  categories?: Category[];
}) {
  const { t, locale } = useLocale();

  const slides: Slide[] = [
    { type: "video", src: "https://karyanabakery.ca/wp-content/uploads/2025/07/Free-delivery-3.mp4" },
    { type: "info" },
    ...(categories ?? [])
      .filter((c) => c.image)
      .slice(0, 5)
      .map((c) => ({ type: "category" as const, category: c })),
  ];

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % slides.length),
    [slides.length]
  );
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + slides.length) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    if (paused) return;
    const delay = slides[current].type === "video" ? 2500 : 1500;
    const timer = setTimeout(next, delay);
    return () => clearTimeout(timer);
  }, [current, paused, next, slides]);

  const title =
    locale === "es" && settings?.heroTitleEs
      ? settings.heroTitleEs
      : settings?.heroTitle ??
        (locale === "es"
          ? "Pan dulce mexicano,\nhecho con amor en Calgary."
          : "Mexican pan dulce,\nbaked with love in Calgary.");

  const subtitle =
    locale === "es" && settings?.heroSubtitleEs
      ? settings.heroSubtitleEs
      : settings?.heroSubtitle ??
        (locale === "es"
          ? "Conchas, pasteles personalizados y la auténtica panadería que recuerdas de casa."
          : "Conchas, custom cakes, and the authentic bakery you remember from home.");

  const heroBg = settings?.heroImage
    ? urlFor(settings.heroImage).width(1920).height(1080).url()
    : null;

  return (
    <section
      className="relative isolate overflow-hidden bg-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[88vh] min-h-[600px] w-full md:h-[92vh]">

        {slides.map((slide, i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000",
              i === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            )}
          >
            {/* ── Background ── */}
            {slide.type === "video" && (
              <video
                src={slide.src}
                autoPlay muted loop playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            {slide.type === "info" && (
              <>
                {heroBg ? (
                  <Image src={heroBg} alt="Karyana" fill priority className="object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-canela-dark via-canela to-ink" />
                )}
              </>
            )}
            {slide.type === "category" && (
              <Image
                src={urlFor(slide.category.image!).width(1920).height(1080).url()}
                alt={slide.category.name}
                fill
                priority={i <= 2}
                sizes="100vw"
                className="object-cover"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/5" />

            {/* ── Content ── */}

            {/* VIDEO SLIDE: just a centered Order Now button */}
            {slide.type === "video" && (
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-28 md:justify-center md:pb-0">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-cream/15 px-4 py-1.5 text-xs uppercase tracking-[0.25em] backdrop-blur-sm border border-cream/20 text-cream">
                  <Sparkles className="h-3 w-3 text-gold" />
                  {t("home.heroEyebrow")}
                </div>
                <Link
                  href="/shop"
                  className="btn-primary group text-lg px-10 py-4"
                >
                  {t("home.heroCta")}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            )}

            {/* INFO SLIDE: title + subtitle + stats + buttons */}
            {slide.type === "info" && (
              <div className="absolute inset-0 flex items-end pb-20 md:items-center md:pb-0">
                <div className="container-bakery text-cream">
                  <h1 className="max-w-3xl font-display text-5xl leading-[1.05] md:text-6xl lg:text-7xl">
                    {title.split("\n").map((line, li, arr) => (
                      <span key={li} className="block">
                        {li === arr.length - 1 ? (
                          <span className="font-script text-cream">{line}</span>
                        ) : (
                          line
                        )}
                      </span>
                    ))}
                  </h1>

                  <p className="mt-5 max-w-lg text-base leading-relaxed text-cream/75 md:text-lg">
                    {subtitle}
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="/shop" className="btn-primary group text-base px-7 py-3.5">
                      {t("home.heroCta")}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                      href="/how-to-order"
                      className="inline-flex items-center rounded-full border border-cream/30 px-7 py-3.5 text-sm font-medium text-cream backdrop-blur-sm hover:bg-cream/10"
                    >
                      {t("home.heroSecondaryCta")}
                    </Link>
                  </div>

                  <div className="mt-10 flex items-center gap-8 text-xs uppercase tracking-[0.2em] text-cream/50">
                    <div>
                      <p className="font-display text-3xl text-cream/90">2018</p>
                      <p>{t("home.bakingSince")}</p>
                    </div>
                    <div className="h-10 w-px bg-cream/20" />
                    <div>
                      <p className="font-display text-3xl text-cream/90">100%</p>
                      <p>{t("home.handmade")}</p>
                    </div>
                    <div className="hidden h-10 w-px bg-cream/20 sm:block" />
                    <div className="hidden sm:block">
                      <p className="font-display text-3xl text-cream/90">25+</p>
                      <p>{t("home.specialties")}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY SLIDES */}
            {slide.type === "category" && (
              <div className="absolute inset-0 flex items-end pb-20 md:pb-28">
                <div className="container-bakery text-cream">
                  {slide.category.tagline && (
                    <p className="mb-3 font-script text-2xl text-canela md:text-3xl">
                      {slide.category.tagline}
                    </p>
                  )}
                  <h2 className="font-display text-6xl leading-none md:text-8xl lg:text-9xl">
                    {slide.category.name}
                  </h2>
                  {slide.category.description && (
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/70 md:text-base">
                      {slide.category.description}
                    </p>
                  )}
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      href={`/category/${slide.category.slug}`}
                      className="btn-primary group"
                    >
                      {locale === "es" ? "Ver" : "Shop"} {slide.category.name}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                      href="/shop"
                      className="inline-flex items-center rounded-full border border-cream/30 px-6 py-3 text-sm font-medium text-cream backdrop-blur-sm hover:bg-cream/10"
                    >
                      {locale === "es" ? "Ver todo" : "View all"}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Arrows */}
        <button onClick={prev} className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-cream/15 p-2.5 text-cream backdrop-blur-sm hover:bg-cream/30 md:left-8 md:p-3" aria-label="Previous">
          <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
        </button>
        <button onClick={next} className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-cream/15 p-2.5 text-cream backdrop-blur-sm hover:bg-cream/30 md:right-8 md:p-3" aria-label="Next">
          <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === current ? "h-2 w-8 bg-cream" : "h-2 w-2 bg-cream/40 hover:bg-cream/70"
              )}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Counter */}
        <div className="absolute bottom-7 right-6 z-20 font-mono text-xs text-cream/40 md:right-10">
          {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </div>
      </div>
    </section>
  );
}
