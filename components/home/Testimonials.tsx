"use client";

import { Quote } from "lucide-react";
import { useLocale, pickI18n } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/types";

export function Testimonials({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const { t, locale } = useLocale();
  if (!testimonials?.length) return null;

  return (
    <section className="bg-masa py-24">
      <div className="container-bakery">
        <div className="mb-12 max-w-2xl">
          <span className="eyebrow">{t("home.kindWords")}</span>
          <h2 className="section-title mt-2">
            {t("home.fromTheFamily")}{" "}
            <span className="font-script text-canela-dark">
              {t("home.fromTheFamilyAccent")}
            </span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.slice(0, 3).map((tt) => {
            const quote = pickI18n(tt, "quote", locale) || tt.quote;
            return (
              <figure
                key={tt._id}
                className="rounded-3xl border border-canela/15 bg-cream p-8"
              >
                <Quote
                  className={cn("h-8 w-8 mb-4", tt.accent || "text-canela")}
                />
                <blockquote className="text-base leading-relaxed text-ink">
                  {quote}
                </blockquote>
                <figcaption className="mt-6 border-t border-canela/15 pt-4">
                  <p className="font-display text-lg">{tt.author}</p>
                  {tt.role && (
                    <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">
                      {tt.role}
                    </p>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
