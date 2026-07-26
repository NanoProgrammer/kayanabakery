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
        ? "Cada semana repetimos automáticamente tu último pedido completado."
        : "We automatically repeat your last completed order every week.",
    },
    {
      value: "CURATED",
      icon: Sparkles,
      title: es ? "Caja sorpresa Karyana" : "Karyana Curated Surprise Box",
      desc: es
        ? "Una selección curada por Karyana cada semana. +$5/semana."
        : "A Karyana-curated assortment every week. +$5/week.",
    },
    {
      value: "MANUAL",
      icon: MessageSquare,
      title: es ? "Decidir cada semana" : "Manual Weekly Decision",
      desc: es
        ? "Te avisamos los jueves. Si no respondes, no se crea el pedido."
        : "We'll notify you every Thursday. If you don't respond, no order is created.",
    },
  ];

  return (
    <div className="mt-8 rounded-3xl border border-canela/15 bg-cream p-6">
      <h3 className="font-display text-xl">
        {es ? "Entrega semanal de pan" : "Weekly Bread Delivery"}
      </h3>
      <p className="mt-1 text-sm text-ink-soft">
        {es
          ? "Elige cómo quieres recibir tu pan cada semana."
          : "Choose how you'd like to receive bread every week."}
      </p>

      {/* Auto delivery toggle */}
      <div className="mt-5 flex items-center justify-between rounded-2xl border border-canela/20 bg-canela-light/30 p-4">
        <div>
          <p className="text-sm font-medium">
            {es ? "Entrega automática semanal" : "Auto Weekly Bread Delivery"}
          </p>
          <p className="text-xs text-ink-soft">
            {autoDelivery
              ? es
                ? "Activada — seguirá el modo elegido abajo si no respondes."
                : "ON — follows the mode below if you don't respond."
              : es
              ? "Desactivada — te enviaremos un recordatorio, pero si no respondes se omite esa semana."
              : "OFF — we'll send a reminder, but if you don't respond that week is skipped."}
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            const next = !autoDelivery;
            setAutoDelivery(next);
            save({ autoDeliveryEnabled: next });
          }}
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full transition-colors",
            autoDelivery ? "bg-canela-dark" : "bg-canela/30"
          )}
        >
          <span
            className={cn(
              "absolute top-1 h-5 w-5 rounded-full bg-cream transition-transform",
              autoDelivery ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      {/* Mode selector */}
      <div className="mt-4 grid gap-3">
        {modes.map((m) => {
          const isSelected = mode === m.value;
          const Icon = m.icon;
          return (
            <button
              key={m.value}
              type="button"
              disabled={saving}
              onClick={() => {
                setMode(m.value);
                save({ weeklyMode: m.value });
              }}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                isSelected
                  ? "border-canela-dark bg-canela-light"
                  : "border-canela/30 bg-cream hover:border-canela"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  isSelected ? "bg-canela-dark text-cream" : "bg-canela-light"
                )}
              >
                {isSelected ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-medium">{m.title}</p>
                <p className="text-xs text-ink-soft">{m.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {mode === "MANUAL" && (
        <p className="mt-4 rounded-xl bg-canela-light/50 p-3 text-xs text-ink-soft">
          {es
            ? "El pan NO se entregará a menos que confirmes cada semana antes del jueves 11:59 PM."
            : "Bread will NOT be delivered unless you confirm each week before Thursday 11:59 PM."}
        </p>
      )}
    </div>
  );
}
