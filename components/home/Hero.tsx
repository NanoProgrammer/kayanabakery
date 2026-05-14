"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { urlFor } from "@/sanity/lib/image";
import type { SiteSettings } from "@/types";

export function Hero({ settings }: { settings?: SiteSettings }) {
  const { t, locale } = useLocale();

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

  return (
    <section className="relative overflow-hidden bg-cream pt-12 pb-24 md:pt-20 md:pb-32">
      <div className="grain absolute inset-0 opacity-50" />

      {/* Soft floating decoration */}
      <div className="pointer-events-none absolute -left-20 top-32 h-72 w-72 rounded-full bg-canela-light blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-12 h-96 w-96 rounded-full bg-canela/30 blur-3xl" />

      <div className="container-bakery relative grid items-center gap-12 md:grid-cols-12">
        {/* Left: copy */}
        <div className="md:col-span-7">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-canela/30 bg-cream px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-ink-soft">
            <Sparkles className="h-3 w-3 text-gold" />
            {t("home.heroEyebrow")}
          </div>

          <h1 className="font-display text-[length:var(--text-display-xl)] leading-[var(--text-display-xl--line-height)] tracking-[var(--text-display-xl--letter-spacing)] text-ink">
            {title.split("\n").map((line, i, arr) => (
              <span key={i} className="block">
                {i === arr.length - 1 ? (
                  <span className="font-script text-canela-dark">{line}</span>
                ) : (
                  line
                )}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            {subtitle}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/shop" className="btn-primary group">
              {t("home.heroCta")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/how-to-order" className="btn-ghost">
              {t("home.heroSecondaryCta")}
            </Link>
          </div>

          <div className="mt-12 flex items-center gap-8 text-xs uppercase tracking-[0.2em] text-ink-soft">
            <div>
              <p className="font-display text-3xl text-ink">2018</p>
              <p>{t("home.bakingSince")}</p>
            </div>
            <div className="h-12 w-px bg-canela/30" />
            <div>
              <p className="font-display text-3xl text-ink">100%</p>
              <p>{t("home.handmade")}</p>
            </div>
            <div className="hidden h-12 w-px bg-canela/30 sm:block" />
            <div className="hidden sm:block">
              <p className="font-display text-3xl text-ink">25+</p>
              <p>{t("home.specialties")}</p>
            </div>
          </div>
        </div>

        {/* Right: image */}
        <div className="md:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-canela-light">
            {settings?.heroImage ? (
              <Image
                src={urlFor(settings.heroImage).width(900).height(1100).url()}
                alt="Karyana Bakery"
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Karyana"
                  width={400}
                  height={400}
                  priority
                  className="h-full w-full object-contain p-12"
                />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/60 to-transparent p-6">
              <p className="font-script text-3xl text-cream">
                {locale === "es" ? "Recién hecho" : "Fresh batch"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
