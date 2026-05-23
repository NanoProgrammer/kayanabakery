"use client";

import { useMemo } from "react";
import { Cake, Users } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Portions data from the Karyana guide.
 * Cut style: 3 slices (event cut) is the default.
 * Tiers: 2, 3, or 4.
 */
type CakeOption = {
  tiers: number;
  sizes: string;
  min3: number;
  max3: number;
};

const CAKE_OPTIONS: CakeOption[] = [
  // 2-tier
  { tiers: 2, sizes: '4" + 6"', min3: 20, max3: 28 },
  { tiers: 2, sizes: '5" + 7"', min3: 28, max3: 38 },
  { tiers: 2, sizes: '6" + 8"', min3: 28, max3: 56 },
  { tiers: 2, sizes: '6" + 10"', min3: 50, max3: 70 },
  { tiers: 2, sizes: '8" + 10"', min3: 60, max3: 84 },
  // 3-tier
  { tiers: 3, sizes: '4" + 6" + 8"', min3: 40, max3: 60 },
  { tiers: 3, sizes: '5" + 7" + 9"', min3: 50, max3: 70 },
  { tiers: 3, sizes: '6" + 8" + 10"', min3: 70, max3: 95 },
  { tiers: 3, sizes: '6" + 9" + 12"', min3: 85, max3: 120 },
  { tiers: 3, sizes: '8" + 10" + 12"', min3: 100, max3: 140 },
  // 4-tier
  { tiers: 4, sizes: '4" + 6" + 8" + 10"', min3: 70, max3: 100 },
  { tiers: 4, sizes: '5" + 7" + 9" + 11"', min3: 90, max3: 130 },
  { tiers: 4, sizes: '6" + 8" + 10" + 12"', min3: 110, max3: 160 },
  { tiers: 4, sizes: '6" + 9" + 11" + 13"', min3: 130, max3: 180 },
  { tiers: 4, sizes: '8" + 10" + 12" + 14"', min3: 150, max3: 210 },
];

export function CakeSizeCalculator({ guests }: { guests: number }) {
  const { locale } = useLocale();

  const recommendations = useMemo(() => {
    if (!guests || guests < 1) return [];
    return CAKE_OPTIONS.filter(
      (opt) => guests >= opt.min3 && guests <= opt.max3
    );
  }, [guests]);

  // Best match: smallest cake that fits
  const bestMatch = useMemo(() => {
    if (!guests || guests < 1) return null;
    const fitting = CAKE_OPTIONS.filter((opt) => opt.max3 >= guests)
      .sort((a, b) => a.min3 - b.min3);
    return fitting[0] ?? null;
  }, [guests]);

  const activeTiers = bestMatch?.tiers ?? 0;

  return (
    <div className="rounded-3xl border border-canela/15 bg-cream p-6">
      <div className="flex items-center gap-2 mb-4">
        <Cake className="h-5 w-5 text-canela-dark" />
        <h3 className="font-display text-lg">
          {locale === "es" ? "Calculadora de tamaño" : "Size calculator"}
        </h3>
      </div>

      {/* Animated cake visualization */}
      <div className="relative flex items-end justify-center h-48 mb-4">
        <div className="flex flex-col items-center justify-end gap-1">
          {/* Tier 4 (top) */}
          <div
            className={cn(
              "rounded-lg bg-gradient-to-b from-canela-light to-canela transition-all duration-700 ease-out",
              activeTiers >= 4
                ? "h-7 w-10 opacity-100 translate-y-0"
                : "h-0 w-10 opacity-0 translate-y-4"
            )}
          />
          {/* Tier 3 */}
          <div
            className={cn(
              "rounded-lg bg-gradient-to-b from-canela to-canela-dark transition-all duration-700 ease-out delay-100",
              activeTiers >= 3
                ? "h-9 w-16 opacity-100 translate-y-0"
                : "h-0 w-16 opacity-0 translate-y-4"
            )}
          />
          {/* Tier 2 */}
          <div
            className={cn(
              "rounded-lg bg-gradient-to-b from-canela-dark to-[#3a1e0d] transition-all duration-700 ease-out delay-200",
              activeTiers >= 2
                ? "h-10 w-24 opacity-100 translate-y-0"
                : "h-0 w-24 opacity-0 translate-y-4"
            )}
          />
          {/* Tier 1 (base) — always visible when there's a match */}
          <div
            className={cn(
              "rounded-lg bg-gradient-to-b from-[#3a1e0d] to-ink transition-all duration-700 ease-out delay-300",
              activeTiers >= 1
                ? "h-12 w-32 opacity-100 translate-y-0"
                : activeTiers === 0 && guests > 0
                  ? "h-12 w-32 opacity-30 translate-y-0"
                  : "h-12 w-32 opacity-10 translate-y-0"
            )}
          />
          {/* Base/board */}
          <div className="h-1.5 w-36 rounded-full bg-canela/40 mt-0.5" />
        </div>

        {/* Decorative elements */}
        {activeTiers >= 2 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-concha-rosa animate-float"
                style={{ animationDelay: `${i * 0.5}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Guest count indicator */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-canela-light px-4 py-2">
          <Users className="h-4 w-4 text-canela-dark" />
          <span className="text-sm font-medium">
            {guests > 0
              ? `${guests} ${locale === "es" ? "personas" : "guests"}`
              : locale === "es"
                ? "Ingresa el número de personas"
                : "Enter number of guests"}
          </span>
        </div>
      </div>

      {/* Recommendation */}
      {bestMatch && guests > 0 && (
        <div className="rounded-2xl bg-canela-light/50 p-4 mb-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-canela-dark mb-1">
            {locale === "es" ? "Recomendación" : "Recommendation"}
          </p>
          <p className="font-display text-lg">
            {bestMatch.tiers} {locale === "es" ? "pisos" : "tiers"} · {bestMatch.sizes}
          </p>
          <p className="text-xs text-ink-soft mt-1">
            {locale === "es"
              ? `${bestMatch.min3}–${bestMatch.max3} porciones (corte de evento, 3 slices)`
              : `${bestMatch.min3}–${bestMatch.max3} servings (event cut, 3 slices)`}
          </p>
        </div>
      )}

      {/* Other options */}
      {recommendations.length > 1 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft mb-2">
            {locale === "es" ? "Otras opciones" : "Other options"}
          </p>
          <ul className="space-y-1.5">
            {recommendations
              .filter((r) => r !== bestMatch)
              .slice(0, 3)
              .map((r, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-canela/15 p-2.5 text-xs"
                >
                  <span className="font-medium">
                    {r.tiers}T · {r.sizes}
                  </span>
                  <span className="text-ink-soft">
                    {r.min3}–{r.max3} {locale === "es" ? "porc." : "serv."}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {guests > 0 && !bestMatch && (
        <p className="text-center text-sm text-ink-soft">
          {guests > 280
            ? locale === "es"
              ? "Para más de 280 personas, contáctanos directamente."
              : "For 280+ guests, contact us directly."
            : locale === "es"
              ? "Ingresa un número mayor para ver opciones."
              : "Enter a higher number to see options."}
        </p>
      )}

      {/* Cut guide */}
      <div className="mt-4 border-t border-canela/15 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-soft mb-2">
          {locale === "es" ? "Guía de cortes" : "Cut guide"}
        </p>
        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="rounded-lg bg-canela-light/40 p-2">
            <p className="font-bold">2 slices</p>
            <p className="text-ink-soft">{locale === "es" ? "Normal" : "Normal"}</p>
          </div>
          <div className="rounded-lg bg-canela-light p-2 ring-1 ring-canela-dark/30">
            <p className="font-bold">3 slices</p>
            <p className="text-ink-soft">{locale === "es" ? "Evento ✓" : "Event ✓"}</p>
          </div>
          <div className="rounded-lg bg-canela-light/40 p-2">
            <p className="font-bold">4 slices</p>
            <p className="text-ink-soft">{locale === "es" ? "Boda" : "Wedding"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
