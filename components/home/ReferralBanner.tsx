"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

export function ReferralBanner() {
  const { locale } = useLocale();

  return (
    <section className="container-bakery py-12">
      <div className="flex flex-col items-center gap-6 rounded-3xl bg-canela-light p-10 text-center md:flex-row md:p-14 md:text-left">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cream">
          <Heart className="h-7 w-7 text-canela-dark" fill="currentColor" />
        </div>

        <div className="flex-1">
          <h3 className="font-display text-2xl md:text-3xl">
            {locale === "es"
              ? "Las penas con pan son menos"
              : "A little bread for heavy days"}
          </h3>

          <p className="mt-1 text-sm text-ink-soft">
            {locale === "es"
              ? "Nomina a alguien que esté pasando por un momento difícil. Karyana Bakery puede enviarle una caja de pan como un gesto de apoyo y cariño."
              : "Nominate someone going through a difficult time. Karyana Bakery may send them a box of bread as a gesture of support and kindness."}
          </p>
        </div>

        <Link href="/refer-a-friend" className="btn-primary shrink-0">
          {locale === "es" ? "Nominar a alguien" : "Nominate someone"}
        </Link>
      </div>
    </section>
  );
}
