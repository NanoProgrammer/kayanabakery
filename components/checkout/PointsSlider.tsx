"use client";

import { Coins } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { pointsToCents } from "@/lib/membership/tiers";
import { formatCents } from "@/lib/checkout/pricing";

export function PointsSlider({
  available,
  current,
  maxRedeemable,
  onChange,
}: {
  /** Total points balance */
  available: number;
  /** Currently selected points to redeem */
  current: number;
  /** Maximum redeemable given the order (caps at subtotal) */
  maxRedeemable: number;
  onChange: (n: number) => void;
}) {
  const { locale } = useLocale();

  const max = Math.min(available, maxRedeemable);
  // Round to nearest 100 (since 100 pts = $1 — cleaner UI)
  const step = 100;
  const flooredMax = Math.floor(max / step) * step;

  if (available <= 0) {
    return (
      <div className="rounded-2xl border border-canela/15 bg-cream p-4 text-sm text-ink-soft">
        <p className="font-medium">
          {locale === "es" ? "0 puntos disponibles" : "0 points available"}
        </p>
        <p className="mt-1 text-xs">
          {locale === "es"
            ? "Gana puntos en cada orden y canjéalos en futuras compras."
            : "Earn points on every order to redeem on future purchases."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-canela/15 bg-cream p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-gold" />
          <span className="font-medium">
            {available.toLocaleString()}{" "}
            {locale === "es" ? "puntos disponibles" : "points available"}
          </span>
        </div>
        <span className="text-xs uppercase tracking-widest text-ink-soft">
          100 pts = $1
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={flooredMax}
        step={step}
        value={Math.min(current, flooredMax)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-4 w-full accent-canela-dark"
      />

      <div className="mt-2 flex items-center justify-between text-sm">
        <span>
          {current.toLocaleString()}{" "}
          {locale === "es" ? "pts" : "pts"}
        </span>
        <span className="font-bold text-canela-dark">
          −{formatCents(pointsToCents(current), locale)}
        </span>
      </div>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => onChange(0)}
          className="text-xs text-ink-soft underline hover:text-ink"
        >
          {locale === "es" ? "Sin puntos" : "Use 0"}
        </button>
        <button
          type="button"
          onClick={() => onChange(flooredMax)}
          className="text-xs text-ink-soft underline hover:text-ink"
        >
          {locale === "es" ? "Usar máximo" : "Use max"}
        </button>
      </div>
    </div>
  );
}
