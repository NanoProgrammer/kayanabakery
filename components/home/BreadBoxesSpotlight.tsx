"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, Repeat } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { Product } from "@/types";

/**
 * The assorted bread boxes — the second door. Situación 9.
 *
 * The brief names two products as the main entrances to the Club: the tres
 * leches cakes, which have the spotlight above this, and these boxes. A
 * box is the easiest first purchase in the shop: one decision instead of
 * twelve, and the bakery picks.
 *
 * The badge is the part that drives the repurchase the brief asks for. A
 * box with stock on the shelf needs no lead time at all — that is what
 * Stock Quantity means since Situación 13 — so the ones ready today say
 * so, right here, before the customer has clicked anything. "Saturday
 * bread boxes, pay online and go" only works if you can see from the home
 * page that there is one waiting.
 */
export function BreadBoxesSpotlight({ boxes }: { boxes: Product[] }) {
  const { locale } = useLocale();
  const es = locale === "es";
  const shown = (boxes ?? []).filter((b) => b.image).slice(0, 4);
  if (!shown.length) return null;

  const anyReadyNow = shown.some((b) => (b.stockQuantity ?? 0) > 0);

  return (
    <section className="bg-masa py-20 md:py-24">
      <div className="container-bakery">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow">{es ? "Cajas de pan" : "Bread boxes"}</span>
            <h2 className="section-title mt-2">
              {es ? "Una caja, " : "One box, "}
              <span className="font-script text-canela-dark">
                {es ? "y ya está" : "and you're done"}
              </span>
            </h2>
            <p className="mt-4 text-base text-ink-soft md:text-lg">
              {es
                ? "Pan surtido escogido por nosotros. Una sola decisión en vez de doce — y es la forma más fácil de empezar a sumar en el Karyana Club."
                : "Assorted bread, picked by us. One decision instead of twelve — and the easiest way to start climbing in the Karyana Club."}
            </p>
          </div>

          {anyReadyNow && (
            <p className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-medium text-ink md:self-auto">
              <Zap className="h-4 w-4 shrink-0 text-gold" />
              {es ? "Hay cajas listas para hoy" : "Boxes ready today"}
            </p>
          )}
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((box) => {
            const readyNow = (box.stockQuantity ?? 0) > 0;
            return (
              <Link
                key={box._id}
                href={`/product/${box.slug}`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-canela/20 bg-cream transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={urlFor(box.image).width(800).height(600).url()}
                    alt={es ? box.nameEs || box.name : box.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* The whole point of Pay Online N' Go, said before the
                      click rather than at the checkout. */}
                  {readyNow && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow">
                      <Zap className="h-3 w-3" />
                      {es ? "Lista hoy" : "Ready today"}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg">
                    {es ? box.nameEs || box.name : box.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-ink-soft">
                    {es ? box.descriptionEs || box.description : box.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-canela-dark">
                    {es ? "Pedir" : "Order"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/category/boxes" className="btn-primary">
            {es ? "Ver todas las cajas" : "See every box"} →
          </Link>
          {/* Coming back is the behaviour the brief wants, so the way to
              do it without thinking is offered here and not only buried in
              the account. */}
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            <Repeat className="h-4 w-4" />
            {es ? "Pedir lo mismo de la última vez" : "Order the same as last time"}
          </Link>
        </div>
      </div>
    </section>
  );
}
