"use client";

import { Crown, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

export function MembershipsHero() {
  const { t } = useLocale();
  return (
    <section className="relative overflow-hidden bg-cream py-20 md:py-28">
      <div className="grain absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-canela-light blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-12 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />

      <div className="container-bakery relative text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold/30 bg-cream px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-gold">
          <Crown className="h-3 w-3" />
          {t("membership.pageTitle")}
          <Sparkles className="h-3 w-3" />
        </div>
        <h1 className="mt-6 font-display text-[length:var(--text-display-lg)] leading-[var(--text-display-lg--line-height)] tracking-[var(--text-display-lg--letter-spacing)]">
          {t("membership.heroTitle")}{" "}
          <span className="font-script gold-text">
            {t("membership.heroTitleAccent")}
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-soft">
          {t("membership.heroSubtitle")}
        </p>
      </div>
    </section>
  );
}
