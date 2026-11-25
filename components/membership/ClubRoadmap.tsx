"use client";

import { Crown, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { roadmap, PILLARS } from "@/lib/loyalty/roadmap";
import type { EarnedTier } from "@/lib/loyalty/klc";

/**
 * The climb, shown to the customer. Situación 8.
 *
 * Four stops, in order, each saying what it takes and what it gives. The
 * point of putting it on the public page is that someone standing at
 * Artesano can see what Selecto would do for them — which is the only
 * reason a ladder makes anybody climb.
 *
 * `currentTier` highlights where the reader stands, when we know.
 */
export function ClubRoadmap({ currentTier }: { currentTier?: EarnedTier | null }) {
  const { locale } = useLocale();
  const es = locale === "es";
  const stops = roadmap();
  const here = currentTier ? stops.findIndex((s) => s.tier === currentTier) : -1;

  return (
    <section className="section-padding bg-cream">
      <div className="container-bakery">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-gold">
            <Crown className="h-4 w-4" />
            {es ? "El camino" : "The climb"}
          </span>
          <h2 className="mt-3 font-display text-3xl md:text-4xl">
            {es ? "De Básico a Legendario" : "From Básico to Legendario"}
          </h2>
          <p className="mt-4 text-ink-soft">
            {es
              ? "No se compra: se gana. Cada nivel se desbloquea comprando, y se conserva comprando — si dejas de venir, vuelves a bajar poco a poco."
              : "You don't buy a tier, you earn it. Each one unlocks by buying and is kept by buying — stop coming and you slide back down, a step at a time."}
          </p>
        </div>

        {/* The stops. A row on desktop, a column on a phone, with the line
            running through them so it reads as one path. */}
        <ol className="relative mt-14 grid gap-6 md:grid-cols-4 md:gap-4">
          <div
            aria-hidden
            className="absolute left-5 top-0 h-full w-px bg-canela/25 md:left-0 md:top-5 md:h-px md:w-full"
          />

          {stops.map((stop, i) => {
            const reached = here >= 0 && i <= here;
            const isHere = i === here;
            return (
              <li key={stop.tier} className="relative">
                <div className="flex items-center gap-3 md:block">
                  <span
                    className={cn(
                      "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-display text-sm",
                      isHere
                        ? "border-gold bg-gold text-white"
                        : reached
                          ? "border-gold bg-cream text-gold"
                          : "border-canela/30 bg-cream text-ink-soft"
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="md:mt-4">
                    <h3 className="font-display text-xl">{stop.name}</h3>
                    <p className="text-xs uppercase tracking-widest text-ink-soft">
                      {stop.credits === 0
                        ? es
                          ? "Al registrarte"
                          : "When you sign up"
                        : es
                          ? `${stop.credits} KLC`
                          : `${stop.credits} KLC`}
                    </p>
                  </div>
                </div>

                {stop.requirement && (
                  <p className="mt-2 pl-[52px] text-xs text-ink-soft md:pl-0">
                    {es ? stop.requirement.es : stop.requirement.en}
                  </p>
                )}

                <ul className="mt-4 space-y-2 pl-[52px] text-sm text-ink md:pl-0">
                  {stop.unlocks.map((u) => (
                    <li key={u.en} className="flex gap-2">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                      <span>{es ? u.es : u.en}</span>
                    </li>
                  ))}
                </ul>

                {isHere && (
                  <p className="mt-4 ml-[52px] inline-block rounded-full bg-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-gold md:ml-0">
                    {es ? "Estás aquí" : "You are here"}
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        {/* How the KLC is earned. Five ways, so nobody thinks the only
            road up is spending more in one go. */}
        <div className="mt-16 rounded-3xl border border-gold/25 bg-white/60 p-6 md:p-10">
          <h3 className="font-display text-2xl">
            {es ? "Cinco formas de subir" : "Five ways to climb"}
          </h3>
          <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p.en}>
                <dt className="text-sm font-bold uppercase tracking-widest text-canela-dark">
                  {es ? p.es : p.en}
                </dt>
                <dd className="mt-1 text-sm text-ink-soft">
                  {es ? p.detail.es : p.detail.en}
                </dd>
              </div>
            ))}
          </dl>
          {/* Said here rather than discovered later. */}
          <p className="mt-8 border-t border-canela/20 pt-6 text-sm text-ink-soft">
            {es
              ? "Tu nivel se conserva mientras sigas comprando. Si pasas mucho tiempo sin venir te avisamos antes, nunca después, y nunca bajas más de un nivel a la vez."
              : "Your tier holds as long as you keep buying. If it's been a while we tell you before it changes, never after, and you never drop more than one step at a time."}
          </p>
        </div>
      </div>
    </section>
  );
}
