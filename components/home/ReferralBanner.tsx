"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

export function ReferralBanner() {
  const { locale } = useLocale();

  return (
    <section className="container-bakery py-12">
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-canela-light border-l-4 border-l-canela-dark/40 bg-white p-10 text-center shadow-[0_10px_35px_rgba(91,51,25,0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_45px_rgba(91,51,25,0.16)] md:flex-row md:p-14 md:text-left">
        
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cream">
          <Heart
            className="h-7 w-7 animate-[pulse_3s_ease-in-out_infinite] text-canela-dark"
            fill="currentColor"
          />
        </div>

        <div className="flex-1">
          <h3 className="font-display text-2xl font-semibold text-canela-dark md:text-3xl">
            {locale === "es"
              ? "Las penas con pan son menos"
              : "A little bread for heavy days"}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {locale === "es"
              ? "Nomina a alguien que esté pasando por un momento difícil. Karyana Bakery puede enviarle una caja de pan como un gesto de apoyo y cariño."
              : "Nominate someone going through a difficult time. Karyana Bakery may send them a box of bread as a gesture of support and kindness."}
          </p>
        </div>

        <Link
          href="/refer-a-friend"
          className="btn-primary shrink-0 transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          {locale === "es" ? "Nominar a alguien" : "Nominate someone"}
        </Link>
      </div>
    </section>
  );
}
