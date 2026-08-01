"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Repeat, Sparkles, MessageSquare } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

type WeeklyMode = "REPEAT_LAST" | "CURATED" | "MANUAL";

export function WeeklyBoxPreferences({
  initialMode,
  initialAutoDelivery,
}: {
  initialMode: WeeklyMode | null;
  initialAutoDelivery: boolean;
}) {
  const { locale } = useLocale();
  const es = locale === "es";
  const [mode, setMode] = useState<WeeklyMode | null>(initialMode);
  const [autoDelivery, setAutoDelivery] = useState(initialAutoDelivery);
  const [saving, setSaving] = useState(false);

  async function save(next: { weeklyMode?: WeeklyMode; autoDeliveryEnabled?: boolean }) {
    setSaving(true);
    try {
      const res = await fetch("/api/membership/weekly-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(es ? "Preferencia guardada" : "Preference saved");
    } catch (e: any) {
      toast.error(e.message || (es ? "Error al guardar" : "Failed to save"));
    } finally {
      setSaving(false);
    }
  }

  const modes: { value: WeeklyMode; icon: any; title: string; desc: string }[] = [
    {
      value: "REPEAT_LAST",
      icon: Repeat,
      title: es ? "Repetir mi última orden" : "Repeat Last Order",
      desc: es
        ? "Repetimos tu último pedido cada semana."
        : "We repeat your last order every week.",
    },
    {
      value: "CURATED",
      icon: Sparkles,
      title: es ? "Caja sorpresa Karyana" : "Karyana Curated Box",
      desc: es ? "Selección de Karyana. +$5/semana." : "Karyana-picked assortment. +$5/week.",
    },
    {
      value: "MANUAL",
      icon: MessageSquare,
      title: es ? "Decidir cada semana" : "Manual Weekly Decision",
      desc: es
        ? "Te avisamos antes. Si no respondes, se omite."
        : "We'll notify you. If you don't respond, it's skipped.",
    },
  ];

  return (
    <div className="mt-8 rounded-3xl border border-canela/15 bg-cream p-4 sm:p-6">
      <h3 className="font-display text-lg sm:text-xl">
        {es ? "Entrega semanal de pan" : "Weekly Bread Delivery"}
      </h3>
      <p className="mt-1 text-xs text-ink-soft sm:text-sm">
        {es
          ? "Se entrega cada viernes. Elige cómo quieres recibir tu pan."
          : "Delivered every Friday. Choose how you'd like to receive your bread."}
      </p>

      {/* Auto delivery toggle — high-contrast track so ON/OFF is unmistakable */}
      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-canela/30 bg-white p-3 sm:p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {es ? "Entrega automática semanal" : "Auto Weekly Bread Delivery"}
          </p>
          <p className="text-[11px] leading-snug text-ink-soft sm:text-xs">
            {autoDelivery
              ? es
                ? "Activada — sigue el modo elegido abajo si no respondes."
                : "ON — follows the mode below if you don't respond."
              : es
              ? "Desactivada — si no respondes, esa semana se omite."
              : "OFF — if you don't respond, that week is skipped."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={autoDelivery}
          disabled={saving}
          onClick={() => {
            const next = !autoDelivery;
            setAutoDelivery(next);
            save({ autoDeliveryEnabled: next });
          }}
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full border-2 transition-colors",
            autoDelivery
              ? "border-canela-dark bg-canela-dark"
              : "border-ink-soft/40 bg-white"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full shadow-sm transition-transform",
              autoDelivery ? "translate-x-5 bg-cream" : "translate-x-0.5 bg-ink-soft/60"
            )}
          />
        </button>
      </div>

      {/* Mode selector */}
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">
        {es ? "Elige tu opción de entrega" : "Choose your delivery mode"}
      </p>
      <div className="mt-2 grid gap-2">
        {modes.map((m) => {
          const isSelected = mode === m.value;
          const Icon = m.icon;
          return (
            <button
              key={m.value}
              type="button"
              disabled={saving}
              aria-pressed={isSelected}
              onClick={() => {
                setMode(m.value);
                save({ weeklyMode: m.value });
              }}
              className={cn(
                "flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all sm:p-4",
                isSelected
                  ? "border-canela-dark bg-canela-dark text-cream shadow-md"
                  : "border-canela/25 bg-white text-ink hover:border-canela"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  isSelected ? "bg-cream text-canela-dark" : "bg-canela-light text-ink"
                )}
              >
                {isSelected ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">{m.title}</p>
                <p
                  className={cn(
                    "text-[11px] leading-snug sm:text-xs",
                    isSelected ? "text-cream/85" : "text-ink-soft"
                  )}
                >
                  {m.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {mode === "MANUAL" && (
        <p className="mt-4 rounded-xl bg-canela-light/60 p-3 text-xs text-ink">
          {es
            ? "El pan NO se entregará a menos que confirmes cada semana antes del miércoles 11:59 PM. La entrega es el viernes."
            : "Bread will NOT be delivered unless you confirm each week before Wednesday 11:59 PM. Delivery is on Fridays."}
        </p>
      )}
    </div>
  );
}
