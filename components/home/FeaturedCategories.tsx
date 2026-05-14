"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useLocale, pickI18n } from "@/lib/i18n/locale-provider";
import { urlFor } from "@/sanity/lib/image";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

export function FeaturedCategories({ categories }: { categories: Category[] }) {
  const { t, locale } = useLocale();
  if (!categories?.length) return null;

  return (
    <section className="container-bakery py-24">
      <div className="mb-12 flex flex-col items-end justify-between gap-6 md:flex-row">
        <div className="max-w-2xl">
          <span className="eyebrow">{t("home.exploreEyebrow")}</span>
          <h2 className="section-title mt-2">
            {t("home.exploreTitle")}{" "}
            <span className="font-script text-canela-dark">
              {t("home.exploreTitleAccent")}
            </span>
          </h2>
        </div>
        <Link
          href="/shop"
          className="link-underline text-sm font-medium text-ink"
        >
          {t("home.seeFullMenu")} →
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => {
          const name = pickI18n(c, "name", locale);
          const tagline = pickI18n(c, "tagline", locale);
          return (
            <Link
              key={c._id}
              href={`/category/${c.slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-3xl"
            >
              {c.image ? (
                <Image
                  src={urlFor(c.image).width(700).height(900).url()}
                  alt={name || ""}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div
                  className={cn(
                    "absolute inset-0",
                    c.accentColor || "bg-canela"
                  )}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-cream">
                {tagline && (
                  <p className="font-script text-xl text-canela">
                    {tagline}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-2xl">{name}</h3>
                  <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
