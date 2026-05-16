"use client";

import Link from "next/link";
import { Crown, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

export function MembershipTeaser() {
  const { locale } = useLocale();

  const tiers = [
    {
      name: "Básico",
      price: locale === "es" ? "Gratis" : "Free",
      perks:
        locale === "es"
          ? "Pan fresco a precio regular"
          : "Fresh bread at regular price",
    },
    {
      name: "Artesano",
      price: locale === "es" ? "1er año gratis" : "1st year free",
      priceSub: locale === "es" ? "luego $39/año" : "then $39/yr",
      perks:
        locale === "es"
          ? "Envío gratis · 2x puntos · Exclusivos"
          : "Free delivery · 2x points · Exclusives",
      featured: false,
      highlight: true,
    },
    {
      name: "Selecto",
      price: "$30/mo",
      perks:
        locale === "es"
          ? "6 panes gratis · 4x puntos"
          : "6 free breads · 4x points",
      featured: true,
    },
    {
      name: "Legendario",
      price: "$50/mo",
      perks:
        locale === "es"
          ? "Acceso total · 5x puntos"
          : "Full access · 5x points",
    },
  ];

  return (
    <section className="container-bakery py-24">
      <div className="relative overflow-hidden rounded-3xl premium-card p-8 md:p-14">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <Crown className="h-3 w-3" />
              {locale === "es" ? "Membresías" : "Memberships"}
            </div>
            <h2 className="section-title">
              {locale === "es" ? (
                <>
                  Únete a la{" "}
                  <span className="font-script gold-text">
                    familia Karyana.
                  </span>
                </>
              ) : (
                <>
                  Join the{" "}
                  <span className="font-script gold-text">
                    Karyana family.
                  </span>
                </>
              )}
            </h2>
            <p className="mt-4 max-w-md text-base text-ink-soft md:text-lg">
              {locale === "es"
                ? "Ahorra en cada orden, gana puntos, y sé el primero en probar nuevos batches. Artesano es gratis el primer año."
                : "Save on every order, earn points, and get first pick on new batches. Artesano is free for the first year."}
            </p>
            <Link
              href="/memberships"
              className="btn-gold mt-8 inline-flex"
            >
              {locale === "es" ? "Ver planes" : "See plans"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`rounded-2xl border p-5 ${
                  t.featured
                    ? "border-gold bg-cream shadow-lg"
                    : t.highlight
                    ? "border-canela-dark bg-cream shadow-md"
                    : "border-canela/20 bg-cream/60"
                }`}
              >
                {t.featured && (
                  <span className="mb-2 inline-block rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold">
                    {locale === "es" ? "Popular" : "Most loved"}
                  </span>
                )}
                {t.highlight && (
                  <span className="mb-2 inline-block rounded-full bg-canela-dark/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-canela-dark">
                    {locale === "es" ? "1er año gratis" : "1st year free"}
                  </span>
                )}
                <p className="font-display text-xl">{t.name}</p>
                <p className="mt-1 text-sm font-bold text-canela-dark">
                  {t.price}
                </p>
                {t.priceSub && (
                  <p className="text-[10px] text-ink-soft">{t.priceSub}</p>
                )}
                <p className="mt-2 text-xs leading-snug text-ink-soft">
                  {t.perks}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
