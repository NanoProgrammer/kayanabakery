"use client";

import { Heart, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

/**
 * Karyana 1% Club vision statement. Intentionally separate from plan pricing:
 * the club is a loyalty philosophy, not a new paid membership tier.
 */
export function OnePercentClub() {
  const { locale } = useLocale();
  const es = locale === "es";

  return (
    <section aria-labelledby="one-percent-club-title" className="bg-cream py-14 md:py-20">
      <div className="container-bakery">
        <div className="mx-auto max-w-3xl rounded-3xl border border-gold/30 bg-masa px-6 py-10 text-center shadow-sm sm:px-12 md:py-14">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-cream px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-canela-dark">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Karyana 1% Club
            <Heart aria-hidden="true" className="h-4 w-4" />
          </div>
          <h2 id="one-percent-club-title" className="font-display text-3xl leading-tight text-ink sm:text-4xl">
            {es ? "No queremos venderle a todo el mundo." : "We don't want to sell to everyone."}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl font-display text-xl leading-relaxed text-canela-dark sm:text-2xl">
            {es
              ? "Queremos ganarnos la lealtad del 1% de cada ciudad de Norteamérica donde esté Karyana."
              : "Our goal isn't to sell to everyone. It's to earn the loyalty of 1% in every North American city where Karyana operates."}
          </p>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
            {es
              ? "Más que pan, un recuerdo de tu hogar. Queremos construir una comunidad que elige regresar por el cariño, la calidad y los recuerdos que compartimos."
              : "More than bread, a home memory. We want to build a community that comes back for the care, quality, and memories we share."}
          </p>
        </div>
      </div>
    </section>
  );
}
