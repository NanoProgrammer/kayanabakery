"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Repeat, Sparkles, MessageSquare, CalendarDays } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

type WeeklyMode = "REPEAT_LAST" | "CURATED" | "MANUAL";
type WeeklyFrequency = "WEEKLY" | "EVERY_4_WEEKS";

/**
 * Retypes the cadence whenever it changes — deletes the old word letter by
 * letter, then types the new one.
 *
 * The animation is the point: this toggle decides whether bread arrives one
 * week or four weeks from now, and a label that swaps instantly is the kind of
 * change people miss and then blame on the bakery. Reduced-motion users get the
 * word outright, and it always settles on the real value either way.
 */
function TypewriterWord({ word, className }: { word: string; className?: string }) {
  const [shown, setShown] = useState(word);
  const [blinking, setBlinking] = useState(false);
  const previous = useRef(word);

  useEffect(() => {
    if (previous.current === word) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      previous.current = word;
      setShown(word);
      return;
    }

    const from = previous.current;
    previous.current = word;
    setBlinking(true);

    let i = from.length;
    let timer: ReturnType<typeof setTimeout>;

    const erase = () => {
      i -= 1;
      setShown(from.slice(0, Math.max(i, 0)));
      timer = i > 0 ? setTimeout(erase, 28) : setTimeout(type, 90);
    };

    let j = 0;
    const type = () => {
      j += 1;
      setShown(word.slice(0, j));
      if (j < word.length) {
        timer = setTimeout(type, 45);
      } else {
        setBlinking(false);
      }
    };

    timer = setTimeout(erase, 40);

    return () => {
      clearTimeout(timer);
      // Unmounting mid-animation must not leave half a word on screen.
      setShown(word);
      setBlinking(false);
    };
  }, [word]);

  return (
    <span className={className} aria-label={word}>
      <span aria-hidden="true">{shown}</span>
      <span
        aria-hidden="true"
        className={cn(
          "ml-0.5 inline-block w-[2px] translate-y-[2px] self-stretch bg-current transition-opacity",
          blinking ? "animate-pulse opacity-70" : "opacity-0"
        )}
        style={{ height: "1em" }}
      />
    </span>
  );
}

export function WeeklyBoxPreferences({
  initialMode,
  initialAutoDelivery,
  initialFrequency = "WEEKLY",
}: {
  initialMode: WeeklyMode | null;
  initialAutoDelivery: boolean;
  initialFrequency?: WeeklyFrequency;
}) {
  const { locale } = useLocale();
  const es = locale === "es";
  const [mode, setMode] = useState<WeeklyMode | null>(initialMode);
  const [autoDelivery, setAutoDelivery] = useState(initialAutoDelivery);
  const [frequency, setFrequency] = useState<WeeklyFrequency>(initialFrequency);
  const [saving, setSaving] = useState(false);

  async function save(next: {
    weeklyMode?: WeeklyMode;
    autoDeliveryEnabled?: boolean;
    weeklyFrequency?: WeeklyFrequency;
  }) {
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
              // left-0.5 is load-bearing: without an explicit left the knob
              // falls at its static position, which a button centres, and the
              // translate then pushes it outside the track.
              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow-sm transition-transform",
              autoDelivery ? "translate-x-5 bg-cream" : "translate-x-0 bg-ink-soft/60"
            )}
          />
        </button>
      </div>

      {/* Frequency toggle — weekly by default, every 4 weeks when switched on.
          The cadence is spelled out as a word that retypes itself, because
          "4" and "1" a few pixels apart is not a difference people notice. */}
      <div className="mt-3 rounded-2xl border-2 border-canela/30 bg-white p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <CalendarDays className="h-4 w-4 shrink-0 text-canela-dark" />
              {es ? "Frecuencia de entrega" : "Delivery frequency"}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-ink-soft sm:text-xs">
              {es
                ? "Actívalo si una caja por semana es demasiado pan."
                : "Turn it on if a box every week is too much bread."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={frequency === "EVERY_4_WEEKS"}
            aria-label={es ? "Entregar cada 4 semanas" : "Deliver every 4 weeks"}
            disabled={saving}
            onClick={() => {
              const next: WeeklyFrequency =
                frequency === "EVERY_4_WEEKS" ? "WEEKLY" : "EVERY_4_WEEKS";
              setFrequency(next);
              save({ weeklyFrequency: next });
            }}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full border-2 transition-colors",
              frequency === "EVERY_4_WEEKS"
                ? "border-canela-dark bg-canela-dark"
                : "border-ink-soft/40 bg-white"
            )}
          >
            <span
              className={cn(
                "absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow-sm transition-transform",
                frequency === "EVERY_4_WEEKS"
                  ? "translate-x-5 bg-cream"
                  : "translate-x-0 bg-ink-soft/60"
              )}
            />
          </button>
        </div>

        {/* The live sentence. aria-live announces the new cadence once the
            word has settled, rather than one letter at a time. */}
        <div
          className={cn(
            "mt-3 rounded-xl px-3 py-2.5 transition-colors duration-500",
            frequency === "EVERY_4_WEEKS" ? "bg-canela-dark" : "bg-canela-light/70"
          )}
        >
          <p
            aria-live="polite"
            className={cn(
              "text-sm transition-colors duration-500",
              frequency === "EVERY_4_WEEKS" ? "text-cream" : "text-ink"
            )}
          >
            {es ? "Recibes tu pan " : "You get your bread "}
            <TypewriterWord
              word={
                frequency === "EVERY_4_WEEKS"
                  ? es
                    ? "cada 4 semanas"
                    : "every 4 weeks"
                  : es
                  ? "cada semana"
                  : "every week"
              }
              className="inline-flex items-baseline font-display text-base font-semibold sm:text-lg"
            />
          </p>
          <p
            className={cn(
              "mt-1 text-[11px] leading-snug transition-colors duration-500 sm:text-xs",
              frequency === "EVERY_4_WEEKS" ? "text-cream/80" : "text-ink-soft"
            )}
          >
            {frequency === "EVERY_4_WEEKS"
              ? es
                ? "Te escribimos solo en tu semana de entrega. Las otras tres no recibes nada nuestro."
                : "We only write to you on your delivery week. The other three you won't hear from us."
              : es
              ? "Te avisamos todos los martes para que decidas."
              : "We check in every Tuesday so you can decide."}
          </p>
        </div>
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
