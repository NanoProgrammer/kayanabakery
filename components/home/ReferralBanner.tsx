"use client";

import Link from "next/link";
import { Gift } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

export function ReferralBanner({ discount = 10 }: { discount?: number }) {
  const { locale } = useLocale();

  return (
    <section className="container-bakery py-12">
      <div className="flex flex-col items-center gap-6 rounded-3xl bg-canela-light p-10 text-center md:flex-row md:p-14 md:text-left">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cream">
          <Gift className="h-7 w-7 text-canela-dark" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-2xl md:text-3xl">
            {locale === "es"
              ? `Refiere un amigo, gana $${discount} de crédito`
              : `Refer a friend, get $${discount} credit`}
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            {locale === "es"
              ? "Tu amigo también ahorra. Comparte el sabor."
              : "They save too. Share the love."}
          </p>
        </div>
        <Link href="/refer-a-friend" className="btn-primary shrink-0">
          {locale === "es" ? "Compartir mi código" : "Share my code"}
        </Link>
      </div>
    </section>
  );
}
