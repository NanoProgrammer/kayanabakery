"use client";

import { useLocale } from "@/lib/i18n/locale-provider";
import { optionKey, type ProductOption } from "@/lib/products/options";

/**
 * Picking a size or a flavour.
 *
 * Each choice says what it does to the price rather than showing a price of
 * its own, because the product keeps one price and the choice adds to it —
 * two numbers for the same cake is how the shelf and the checkout disagree.
 *
 * A choice with its own photo swaps the picture when selected, which is the
 * whole point for a strawberry cake.
 */
export function ProductOptions({
  options,
  selection,
  onChange,
}: {
  options: ProductOption[];
  selection: Record<string, string>;
  onChange: (key: string, label: string) => void;
}) {
  const { locale } = useLocale();
  const es = locale === "es";

  if (!options.length) return null;

  return (
    <div className="mt-6 space-y-5">
      {options.map((option) => {
        const key = optionKey(option);
        const label = (es && option.nameEs) || option.name;
        const chosen = selection[key];

        return (
          <div key={key}>
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
                {label}
              </p>
              {option.required === false && (
                <span className="text-xs text-ink-soft">
                  {es ? "opcional" : "optional"}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {(option.choices ?? []).map((choice) => {
                const selected = chosen === choice.label;
                const text = (es && choice.labelEs) || choice.label;
                const delta = choice.priceDelta ?? 0;

                return (
                  <button
                    key={choice.label}
                    type="button"
                    disabled={Boolean(choice.soldOut)}
                    aria-pressed={selected}
                    onClick={() => onChange(key, selected && option.required === false ? "" : choice.label)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      selected
                        ? "border-canela-dark bg-canela-dark text-white"
                        : "border-canela/30 hover:border-canela-dark"
                    } ${choice.soldOut ? "cursor-not-allowed opacity-40 line-through" : ""}`}
                  >
                    {text}
                    {delta !== 0 && (
                      <span className={selected ? "ml-1 opacity-80" : "ml-1 text-ink-soft"}>
                        {delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
