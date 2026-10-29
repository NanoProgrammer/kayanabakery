"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n/locale-provider";

/**
 * Switching between the weekly box and points, after the fact.
 *
 * The choice is made when someone subscribes, but it is the kind of thing
 * people change their minds about — a box every week is a lot of bread — and
 * without this the only way out was to cancel the membership.
 */
export function BenefitMode({ current }: { current: "WEEKLY_BOX" | "POINTS" }) {
  const { locale } = useLocale();
  const es = locale === "es";
  const [mode, setMode] = useState(current);
  const [saving, setSaving] = useState(false);

  async function choose(next: "WEEKLY_BOX" | "POINTS") {
    if (next === mode || saving) return;
    const previous = mode;
    setMode(next);
    setSaving(true);

    try {
      const res = await fetch("/api/membership/benefit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ benefitMode: next }),
      });
      const body = await res.text();
      const data = body ? JSON.parse(body) : null;

      if (!res.ok || !data?.ok) {
        setMode(previous);
        toast.error(data?.error ?? (es ? "No se pudo guardar" : "Couldn't save that"));
        return;
      }

      toast.success(
        next === "WEEKLY_BOX"
          ? es
            ? "Tu caja vuelve a prepararse cada semana"
            : "Your box will be made each week again"
          : es
          ? "Sin caja automática — tu pago se queda en puntos"
          : "No automatic box — your payment stays as points"
      );
    } catch {
      setMode(previous);
      toast.error(es ? "No pudimos conectarnos" : "We couldn't connect");
    } finally {
      setSaving(false);
    }
  }

  const options = [
    {
      value: "WEEKLY_BOX" as const,
      title: es ? "Caja cada semana" : "A box every week",
      body: es
        ? "Se paga con tus puntos; tu tarjeta cubre solo lo que falte."
        : "Paid from your points; your card covers only what they don't.",
    },
    {
      value: "POINTS" as const,
      title: es ? "Solo puntos" : "Points only",
      body: es
        ? "Sin orden automática. Pides cuando quieras."
        : "No automatic order. Order whenever you like.",
    },
  ];

  return (
    <div className="mt-8 rounded-3xl border border-canela/15 bg-cream p-6">
      <h2 className="font-display text-xl">
        {es ? "Cómo usas tu membresía" : "How you use your membership"}
      </h2>

      <div className="mt-4 space-y-3">
        {options.map((option) => {
          const selected = mode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={saving}
              onClick={() => choose(option.value)}
              aria-pressed={selected}
              className={`w-full rounded-2xl border p-4 text-left transition disabled:opacity-60 ${
                selected ? "border-canela-dark bg-canela-light/50" : "border-canela/25"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    selected ? "border-canela-dark" : "border-canela/40"
                  }`}
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-canela-dark" />}
                </span>
                <span className="font-bold">{option.title}</span>
              </span>
              <span className="mt-1 block pl-6 text-sm text-ink-soft">{option.body}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-ink-soft">
        {es
          ? "El cambio aplica desde la próxima semana — una caja ya confirmada se entrega igual."
          : "The change applies from next week — a box already confirmed still gets made."}
      </p>
    </div>
  );
}
