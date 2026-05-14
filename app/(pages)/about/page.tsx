"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";

export default function AboutPage() {
  const { locale } = useLocale();

  return (
    <>
      <section className="relative overflow-hidden bg-cream py-20 md:py-28">
        <div className="grain absolute inset-0 opacity-40" />
        <div className="container-bakery relative grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="eyebrow">
              {locale === "es" ? "Nuestra historia" : "Our story"}
            </span>
            <h1 className="mt-2 font-display text-[length:var(--text-display-lg)] leading-tight">
              {locale === "es" ? (
                <>
                  Pan que sabe a{" "}
                  <span className="font-script text-canela-dark">casa.</span>
                </>
              ) : (
                <>
                  Bread that tastes like{" "}
                  <span className="font-script text-canela-dark">home.</span>
                </>
              )}
            </h1>
            <p className="mt-6 text-base leading-relaxed text-ink-soft md:text-lg">
              {locale === "es"
                ? "Karyana Ruiz Bakery nació en 2018 con una idea simple: traer a Calgary el sabor de la panadería mexicana auténtica, esa que despierta recuerdos de la cocina de la abuela."
                : "Karyana Ruiz Bakery was born in 2018 with a simple idea: bring authentic Mexican bakery to Calgary — the kind that wakes up memories of grandma's kitchen."}
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-soft md:text-lg">
              {locale === "es"
                ? "Cada concha, cada pastel, cada pieza la hacemos a mano con ingredientes seleccionados y mucho cariño. No usamos atajos. Solo la receta tradicional, paciencia, y horno caliente."
                : "Every concha, every cake, every piece is handmade with selected ingredients and lots of love. No shortcuts. Just traditional recipes, patience, and a hot oven."}
            </p>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-canela-light">
            <Image
              src="/logo.png"
              alt="Karyana"
              width={600}
              height={750}
              className="h-full w-full object-contain p-8"
            />
          </div>
        </div>
      </section>

      <section className="bg-masa py-20">
        <div className="container-bakery">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl md:text-4xl">
              {locale === "es"
                ? "Más que pan, un recuerdo de hogar."
                : "More than bread, a home memory."}
            </h2>
            <p className="mt-4 text-base text-ink-soft md:text-lg">
              {locale === "es"
                ? "Cada batch que sale del horno lleva la intención de hacerte sonreír y de conectarte con tus raíces. Porque al final, una pieza de pan dulce es también una abrazo."
                : "Every batch out of the oven carries the intention to make you smile and connect you to your roots. Because in the end, a piece of pan dulce is also a hug."}
            </p>
            <Link href="/shop" className="btn-primary mt-8 inline-flex">
              {locale === "es" ? "Ver el menú" : "See the menu"}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
