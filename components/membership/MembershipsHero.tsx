"use client";

import { Crown, Sparkles, Coins, Zap } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { clubCopy } from "@/lib/membership/club-copy";

/**
 * The top of the Karyana Club page.
 *
 * It used to lead with "our goal isn't to sell to everyone — it's to earn the
 * loyalty of 1%", which Karyana asked to drop, and said nothing about what
 * the money actually does. The club is a prepayment: what you pay comes back
 * as points. That is the first thing the page should say, so nobody reaches
 * the price without knowing they are buying bread in advance rather than
 * renting a perk. The wording lives in lib/membership/club-copy.ts, with the
 * conversion it describes.
 */
export function MembershipsHero() {
  const { locale } = useLocale();
  const copy = clubCopy(locale);
  const es = locale === "es";

  return (
    <section className="relative overflow-hidden bg-cream py-16 md:py-28">
      <div className="grain absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-canela-light blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-12 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
      <div className="container-bakery relative text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold/30 bg-cream px-5 py-2.5 text-base font-bold uppercase tracking-[0.18em] text-gold sm:px-6 sm:py-3 sm:text-lg md:px-8 md:py-3.5 md:text-2xl">
          <Crown className="h-5 w-5 shrink-0 md:h-6 md:w-6" />
          {copy.name}
          <Sparkles className="h-5 w-5 shrink-0 md:h-6 md:w-6" />
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-canela-dark">
          {copy.eyebrow}
        </p>

        <h1 className="mx-auto mt-3 max-w-4xl font-display text-[length:var(--text-display-lg)] leading-[var(--text-display-lg--line-height)] tracking-[var(--text-display-lg--letter-spacing)]">
          {copy.headline}
          <span className="mt-3 block font-script gold-text">{copy.accent}</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg font-semibold text-ink">
          {copy.whatItIs}
        </p>

        <div className="mx-auto mt-8 grid max-w-3xl gap-4 text-left sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-5">
            <Coins className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <p className="text-sm leading-relaxed text-ink">{copy.money}</p>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-canela/25 bg-canela-light/40 p-5">
            <Zap className="mt-0.5 h-5 w-5 shrink-0 text-canela-dark" />
            <p className="text-sm leading-relaxed text-ink">{copy.extras}</p>
          </div>
        </div>

        <p className="mx-auto mt-7 max-w-2xl font-script text-2xl text-gold md:text-3xl">
          {copy.reassurance}
        </p>

        <div className="mx-auto mt-8 inline-flex items-center gap-3 rounded-full border border-gold/40 bg-gold/10 px-6 py-3">
          <Sparkles className="h-4 w-4 shrink-0 text-gold" />
          <span className="text-sm font-medium text-ink">
            {es
              ? "Artesano: primer año completamente gratis — solo necesitas tarjeta en file"
              : "Artesano: first year completely free — just add a card on file"}
          </span>
        </div>
      </div>
    </section>
  );
}
