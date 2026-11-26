"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";
import { useLocale } from "@/lib/i18n/locale-provider";
import { CAKE_FAMILIES, familyForProduct } from "@/lib/products/cake-families";
import type { Product } from "@/types";

/**
 * The cakes, first thing on the home page. Situación 9.
 *
 * The ask was to put cakes at the top to sell more of them, with a link,
 * and to give the products worth pushing a bigger shape than the four-up
 * grid everything else lives in. So: one hero cake across the full width,
 * then the four families as large tiles.
 *
 * Families rather than individual cakes, because clicking "Tres Leches"
 * lands on eight flavours while clicking one flavour lands on one cake —
 * and the thing we want is the browse, not the bounce.
 *
 * Renders nothing when there are no cakes, rather than an empty band.
 */
export function CakesSpotlight({ cakes }: { cakes: Product[] }) {
  const { locale } = useLocale();
  const es = locale === "es";
  if (!cakes?.length) return null;

  // One cake per family, the first with a photo — a tile with no image is
  // worse than one family fewer.
  const tiles = CAKE_FAMILIES.map((family) => {
    const member = cakes.find((p) => familyForProduct(p)?.slug === family.slug && p.image);
    return member ? { family, member } : null;
  }).filter((t): t is NonNullable<typeof t> => t !== null);

  const hero = cakes.find((p) => p.image);
  if (!hero) return null;

  return (
    <section className="bg-cream py-20 md:py-24">
      <div className="container-bakery">
        <div className="max-w-3xl">
          <span className="eyebrow">{es ? "Pasteles" : "Cakes"}</span>
          <h2 className="section-title mt-2">
            {es ? "Para la ocasión que " : "For whatever you're "}
            <span className="font-script text-canela-dark">
              {es ? "estás celebrando" : "celebrating"}
            </span>
          </h2>
          <p className="mt-4 text-base text-ink-soft md:text-lg">
            {es
              ? "Tres leches, flanes, gelatinas y pasteles de temporada — hechos por encargo, con sabores y tamaños a elegir."
              : "Tres leches, flans, gelatinas and seasonal cakes — made to order, in the flavour and size you choose."}
          </p>
        </div>

        {/* The hero cake. Horizontal on a desktop, stacked on a phone: the
            bigger shape Karyana asked for, for the product worth pushing. */}
        <Link
          href={`/product/${hero.slug}`}
          className="group mt-10 block overflow-hidden rounded-3xl border border-gold/25 bg-white/70 transition-shadow hover:shadow-xl md:grid md:grid-cols-5"
        >
          <div className="relative aspect-[4/3] overflow-hidden md:col-span-3 md:aspect-auto md:min-h-[26rem]">
            <Image
              src={urlFor(hero.image).width(1200).height(900).url()}
              alt={es ? hero.nameEs || hero.name : hero.name}
              fill
              sizes="(min-width: 768px) 60vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              priority
            />
            {/* El velo de los costados.
                La foto llegaba a un borde recto justo donde empieza el
                texto, y se veía pegada en vez de ser parte de la
                tarjeta. Esto la funde con el fondo por los lados — y
                abajo en el teléfono, que es donde el texto queda
                debajo. Sin tocar el centro, que es el pastel. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-white/80"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white/30"
            />
          </div>
          <div className="flex flex-col justify-center p-8 md:col-span-2 md:p-10">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-gold">
              {es ? "El más pedido" : "Most ordered"}
            </span>
            <h3 className="mt-3 font-display text-3xl md:text-4xl">
              {es ? hero.nameEs || hero.name : hero.name}
            </h3>
            <p className="mt-3 line-clamp-3 text-sm text-ink-soft">
              {es ? hero.descriptionEs || hero.description : hero.description}
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-canela-dark">
              {es ? "Verlo" : "See it"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>

        {/* The families. Four doors rather than sixteen cakes. */}
        {tiles.length > 0 && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map(({ family, member }) => (
              <Link
                key={family.slug}
                href={`/category/${family.slug}`}
                className="group overflow-hidden rounded-3xl border border-gold/20 bg-white/70 transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={urlFor(member.image).width(600).height(600).url()}
                    alt={es ? family.nameEs : family.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* El mismo velo por los costados, para que las cuatro
                      se vean como una sola pieza y no como cuatro fotos
                      recortadas. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.35),transparent_22%,transparent_78%,rgba(255,255,255,0.35))]"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/55 to-transparent"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl">
                    {es ? family.nameEs : family.name}
                  </h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    {es ? family.taglineEs : family.tagline}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/category/cakes" className="btn-primary">
            {es ? "Ver todos los pasteles" : "See every cake"} →
          </Link>
        </div>
      </div>
    </section>
  );
}
