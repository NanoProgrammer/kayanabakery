"use client";

import { useEffect, useRef, useState } from "react";
import { Crown, Sparkles, Lock, Check } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { roadmap, PILLARS } from "@/lib/loyalty/roadmap";
import type { EarnedTier } from "@/lib/loyalty/klc";

/**
 * The climb, as a game board. Situación 8.
 *
 * The first version of this was a flat table and read like one. A ladder
 * drawn as a specification does not make anybody want to climb it, so the
 * path now draws itself: the line fills in as you scroll to it, the stops
 * light up one after another, and the level you have reached keeps a slow
 * pulse so your own place on the board is the thing your eye lands on.
 *
 * All of it is CSS transitions driven by one IntersectionObserver — no
 * animation library, nothing that costs the page a download. And all of it
 * is skipped for anyone who has asked their device for less motion: the
 * board simply arrives already drawn.
 */
export function ClubRoadmap({ currentTier }: { currentTier?: EarnedTier | null }) {
  const { locale } = useLocale();
  const es = locale === "es";
  const stops = roadmap();
  const here = currentTier ? stops.findIndex((s) => s.tier === currentTier) : -1;

  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Reduced motion, or a browser without the observer: show it all at
    // once rather than leave the page half-drawn.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="section-padding overflow-hidden bg-cream">
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
              ? "No se compra: se gana. Cada nivel se desbloquea comprando, y se conserva comprando — si dejas de venir, bajas poco a poco."
              : "You don't buy a tier, you earn it. Each one unlocks by buying and is kept by buying — stop coming and you slide back down, a step at a time."}
          </p>
        </div>

        <div ref={ref} className="relative mt-14">
          {/* The track, and the part of it already walked. The fill is what
              makes this a board rather than a table. */}
          <div
            aria-hidden
            className="absolute left-5 top-0 h-full w-0.5 rounded-full bg-canela/20 md:left-0 md:top-5 md:h-0.5 md:w-full"
          />
          <div
            aria-hidden
            className={cn(
              "absolute left-5 top-0 w-0.5 rounded-full bg-gradient-to-b from-gold to-canela-dark transition-all duration-[1600ms] ease-out md:left-0 md:top-5 md:h-0.5 md:bg-gradient-to-r",
              "md:w-0"
            )}
            style={
              shown
                ? {
                    // Up to the stop reached, or the whole path when we
                    // don't know where the reader stands.
                    ["--walked" as string]: `${here >= 0 ? (here / (stops.length - 1)) * 100 : 100}%`,
                    height: "var(--walked)",
                    width: "var(--walked)",
                  }
                : { height: "0%", width: "0%" }
            }
          />

          <ol className="relative grid gap-8 md:grid-cols-4 md:gap-4">
            {stops.map((stop, i) => {
              const reached = here >= 0 && i <= here;
              const isHere = i === here;
              const locked = here >= 0 && i > here;
              return (
                <li
                  key={stop.tier}
                  className={cn(
                    "relative transition-all duration-700 ease-out",
                    shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                  )}
                  // Each stop arrives after the one before it, so the eye
                  // travels the path in order instead of taking it in at once.
                  style={{ transitionDelay: shown ? `${250 + i * 220}ms` : "0ms" }}
                >
                  <div className="flex items-center gap-3 md:block">
                    <span
                      className={cn(
                        "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-display text-sm transition-all duration-500",
                        isHere
                          ? "scale-110 border-gold bg-gold text-white shadow-[0_0_0_6px_rgba(212,175,110,0.22)]"
                          : reached
                            ? "border-gold bg-cream text-gold"
                            : "border-canela/30 bg-cream text-ink-soft",
                        // A slow heartbeat on the level you hold.
                        isHere && "motion-safe:animate-pulse"
                      )}
                    >
                      {reached && !isHere ? (
                        <Check className="h-4 w-4" />
                      ) : locked ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <div className="md:mt-4">
                      <h3
                        className={cn(
                          "font-display text-xl transition-colors",
                          locked && "text-ink-soft"
                        )}
                      >
                        {stop.name}
                      </h3>
                      <p className="text-xs uppercase tracking-widest text-ink-soft">
                        {stop.credits === 0
                          ? es
                            ? "Al registrarte"
                            : "When you sign up"
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
                    {stop.unlocks.map((u, j) => (
                      <li
                        key={u.en}
                        className={cn(
                          "flex gap-2 transition-all duration-500 ease-out",
                          shown ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                        )}
                        style={{
                          transitionDelay: shown ? `${450 + i * 220 + j * 70}ms` : "0ms",
                        }}
                      >
                        <Sparkles
                          className={cn(
                            "mt-0.5 h-3.5 w-3.5 shrink-0",
                            locked ? "text-canela/50" : "text-gold"
                          )}
                        />
                        <span className={cn(locked && "text-ink-soft")}>
                          {es ? u.es : u.en}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {isHere && (
                    <p className="ml-[52px] mt-4 inline-block rounded-full bg-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-gold md:ml-0">
                      {es ? "Estás aquí" : "You are here"}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* How the KLC is earned. Five ways, so nobody thinks the only road
            up is spending more in one go. */}
        <div
          className={cn(
            "mt-16 rounded-3xl border border-gold/25 bg-white/60 p-6 transition-all duration-700 ease-out md:p-10",
            shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          )}
          style={{ transitionDelay: shown ? "1200ms" : "0ms" }}
        >
          <h3 className="font-display text-2xl">
            {es ? "Cinco formas de subir" : "Five ways to climb"}
          </h3>
          <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p, i) => (
              <div
                key={p.en}
                className={cn(
                  "rounded-2xl p-4 transition-all duration-500 ease-out hover:bg-cream",
                  shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                )}
                style={{ transitionDelay: shown ? `${1300 + i * 90}ms` : "0ms" }}
              >
                <dt className="text-sm font-bold uppercase tracking-widest text-canela-dark">
                  {es ? p.es : p.en}
                </dt>
                <dd className="mt-1 text-sm text-ink-soft">{es ? p.detail.es : p.detail.en}</dd>
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
