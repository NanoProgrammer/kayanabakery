"use client";

import { Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

export function AmbassadorHero() {
  const { t } = useLocale();
  return (
    <section className="relative overflow-hidden bg-cream py-20 md:py-28">
      <div className="grain absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-canela-light blur-3xl" />
      <div className="container-bakery relative max-w-3xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-canela-dark/30 bg-cream px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-canela-dark">
          <Sparkles className="h-3 w-3" />
          {t("ambassador.pageTitle")}
        </div>
        <h1 className="mt-6 font-display text-[length:var(--text-display-lg)] leading-tight tracking-tight">
          {t("ambassador.pageTitle")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-soft">
          {t("ambassador.subtitle")}
        </p>
      </div>
    </section>
  );
}
