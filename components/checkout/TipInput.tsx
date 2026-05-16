"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

type TipMode = "percent" | "dollar";

const PERCENT_OPTIONS = [10, 15, 20];
const DOLLAR_OPTIONS = [2, 5, 10];

export function TipInput({
  subtotalCents,
  tipCents,
  onChange,
}: {
  subtotalCents: number;
  tipCents: number;
  onChange: (cents: number) => void;
}) {
  const { locale } = useLocale();
  const [mode, setMode] = useState<TipMode>("percent");
  const [customValue, setCustomValue] = useState("");
  const [activePreset, setActivePreset] = useState<number | null>(null);

  function selectPreset(value: number) {
    setActivePreset(value);
    setCustomValue("");
    if (mode === "percent") {
      onChange(Math.round((subtotalCents * value) / 100));
    } else {
      onChange(value * 100);
    }
  }

  function handleCustom(raw: string) {
    setCustomValue(raw);
    setActivePreset(null);
    const num = parseFloat(raw);
    if (isNaN(num) || num < 0) {
      onChange(0);
      return;
    }
    if (mode === "percent") {
      onChange(Math.round((subtotalCents * Math.min(num, 100)) / 100));
    } else {
      onChange(Math.round(num * 100));
    }
  }

  function switchMode(newMode: TipMode) {
    setMode(newMode);
    setActivePreset(null);
    setCustomValue("");
    onChange(0);
  }

  const displayTip = tipCents > 0 ? `$${(tipCents / 100).toFixed(2)}` : "";

  return (
    <div className="rounded-2xl border border-canela/15 bg-cream p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-concha-rosa-dark" />
          <span className="text-sm font-medium">
            {locale === "es" ? "Propina" : "Tip"}
          </span>
        </div>
        {/* Mode toggle */}
        <div className="inline-flex rounded-full border border-canela/30 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => switchMode("percent")}
            className={cn(
              "rounded-full px-3 py-1 font-medium transition-colors",
              mode === "percent"
                ? "bg-canela text-ink"
                : "text-ink-soft hover:text-ink"
            )}
          >
            %
          </button>
          <button
            type="button"
            onClick={() => switchMode("dollar")}
            className={cn(
              "rounded-full px-3 py-1 font-medium transition-colors",
              mode === "dollar"
                ? "bg-canela text-ink"
                : "text-ink-soft hover:text-ink"
            )}
          >
            $
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="mt-3 flex gap-2">
        {(mode === "percent" ? PERCENT_OPTIONS : DOLLAR_OPTIONS).map((opt) => {
          const isActive = activePreset === opt && !customValue;
          return (
            <button
              type="button"
              key={opt}
              onClick={() => selectPreset(opt)}
              className={cn(
                "flex-1 rounded-full border py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "border-canela-dark bg-canela-light text-canela-dark"
                  : "border-canela/30 bg-cream hover:border-canela"
              )}
            >
              {mode === "percent" ? `${opt}%` : `$${opt}`}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setActivePreset(null);
            setCustomValue("");
            onChange(0);
          }}
          className={cn(
            "rounded-full border px-3 py-2.5 text-sm font-medium transition-all",
            tipCents === 0 && !customValue
              ? "border-canela-dark bg-canela-light text-canela-dark"
              : "border-canela/30 bg-cream hover:border-canela"
          )}
        >
          {locale === "es" ? "Sin" : "None"}
        </button>
      </div>

      {/* Custom */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-ink-soft">
          {locale === "es" ? "Personalizado:" : "Custom:"}
        </span>
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-soft">
            {mode === "percent" ? "%" : "$"}
          </span>
          <input
            type="number"
            min="0"
            step={mode === "percent" ? "1" : "0.50"}
            value={customValue}
            onChange={(e) => handleCustom(e.target.value)}
            placeholder={mode === "percent" ? "25" : "7.50"}
            className="w-full rounded-full border border-canela/30 bg-cream py-2 pl-8 pr-4 text-sm focus:border-canela-dark focus:outline-none"
          />
        </div>
      </div>

      {tipCents > 0 && (
        <p className="mt-2 text-right text-xs font-medium text-canela-dark">
          {locale === "es" ? "Propina:" : "Tip:"} {displayTip}
        </p>
      )}
    </div>
  );
}
