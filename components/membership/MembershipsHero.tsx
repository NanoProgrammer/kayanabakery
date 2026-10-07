"use client";

import { Crown, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

export function MembershipsHero() {
  const { locale } = useLocale();

  const copy =
    locale === "es"
      ? {
          club: "Karyana 1% Club",
          title: "Nuestra meta no es venderle a todo el mundo.",
          accent: "Es ganarnos la lealtad del 1%.",
          promise: "No queremos ser la panadería de todos. Queremos ser tu panadería.",
          description:
            "Únete a una comunidad construida alrededor del pan, nuestras tradiciones y esos pequeños recuerdos que nos hacen sentir en casa.",
          journey: "Una ciudad a la vez. Una comunidad a la vez. Un recuerdo a la vez.",
          offer:
            "Artesano: primer año completamente gratis — solo necesitas tarjeta en file",
        }
      : {
          club: "Karyana 1% Club",
          title: "Our goal isn't to sell to everyone.",
          accent: "It's to earn the loyalty of 1%.",
          promise: "We don't want to be everyone's bakery. We want to be your bakery.",
          description:
            "Join a community built around bread, our traditions, and the little memories that make a place feel like home.",
          journey: "One city at a time. One community at a time. One memory at a time.",
          offer: "Artesano: first year completely free — just add a card on file",
        };

  return (
    <section className="relative overflow-hidden bg-cream py-20 md:py-28">
      <div className="grain absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-canela-light blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-12 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />

      <div className="container-bakery relative text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold/30 bg-cream px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-gold">
          <Crown className="h-3 w-3" />
          {copy.club}
          <Sparkles className="h-3 w-3" />
        </div>

        <h1 className="mx-auto mt-6 max-w-4xl font-display text-[length:var(--text-display-lg)] leading-[var(--text-display-lg--line-height)] tracking-[var(--text-display-lg--letter-spacing)]">
          {copy.title}{" "}
          <span className="block font-script gold-text">
            {copy.accent}
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg font-semibold text-ink">
          {copy.promise}
        </p>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-soft md:text-lg">
          {copy.description}
        </p>

        <p className="mx-auto mt-5 max-w-2xl font-script text-2xl text-gold md:text-3xl">
          {copy.journey}
        </p>

        {/* First year free callout */}
        <div className="mx-auto mt-8 inline-flex items-center gap-3 rounded-full border border-gold/40 bg-gold/10 px-6 py-3">
          <Sparkles className="h-4 w-4 shrink-0 text-gold" />
          <span className="text-sm font-medium text-ink">
            {copy.offer}
          </span>
        </div>
      </div>
    </section>
  );
}
