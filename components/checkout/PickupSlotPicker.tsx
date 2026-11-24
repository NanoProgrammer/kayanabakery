"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Check, Clock } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import {
  offeredPickupWindows,
  effectivePickupLeadHours,
  PICKUP_MIN_LEAD_HOURS,
  type OfferedWindow,
} from "@/lib/checkout/pickup-windows";

/**
 * Choosing when to collect an order.
 *
 * Monday to Saturday now has three windows, not one, so the day is no
 * longer the whole choice — a day is picked, then a time within it.
 *
 * The windows come from lib/checkout/pickup-windows.ts, which is also what
 * the server checks against. This component used to carry its own copy of
 * the opening hours, and it had drifted: it offered a 4-6 PM slot to someone
 * whose order could not be ready until 5, because it compared the lead time
 * against when the window CLOSED.
 */
export function PickupSlotPicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  minLeadHours = 0,
  hasCake = false,
  readyNow = false,
}: {
  date: string;
  time: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  minLeadHours?: number;
  /** A cake in the basket moves the whole pickup onto the cake windows. */
  hasCake?: boolean;
  /** Everything is already baked, so the eight-hour floor does not apply. */
  readyNow?: boolean;
}) {
  const { locale } = useLocale();
  const es = locale === "es";

  // Recomputed on the client only: the server and the browser can sit in
  // different hours, and a window rendered on the server would be stale by
  // the time anyone looked at it.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const windows = useMemo(
    () =>
      now
        ? offeredPickupWindows({
            now,
            itemLeadHours: minLeadHours,
            hasCake,
            readyNow,
            days: 14,
          })
        : [],
    [now, minLeadHours, hasCake, readyNow]
  );

  const days = useMemo(() => {
    const byDate = new Map<string, OfferedWindow[]>();
    for (const w of windows) {
      if (!byDate.has(w.date)) byDate.set(w.date, []);
      byDate.get(w.date)!.push(w);
    }
    return [...byDate.entries()].map(([d, list]) => ({ date: d, windows: list }));
  }, [windows]);

  // Clear a choice that is no longer on offer — an hour spent on the page
  // can take the selected window past its lead time, and leaving it selected
  // would send the server something it is about to refuse.
  useEffect(() => {
    if (!now || !date) return;
    const stillThere = windows.some((w) => w.date === date && (!time || w.label === time));
    if (!stillThere) {
      onDateChange("");
      onTimeChange("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windows, now]);

  const required = effectivePickupLeadHours(minLeadHours, hasCake, readyNow);
  const selectedDay = days.find((d) => d.date === date);

  function dayLabel(d: string) {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, day, 12)).toLocaleDateString(
      es ? "es-MX" : "en-CA",
      { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" }
    );
  }

  if (!now) {
    return (
      <div className="rounded-2xl border border-canela/15 bg-cream p-4 text-sm text-ink-soft">
        {es ? "Cargando horarios…" : "Loading times…"}
      </div>
    );
  }

  if (!days.length) {
    return (
      <div className="rounded-2xl border border-canela/15 bg-cream p-4 text-sm text-ink-soft">
        {es
          ? "No hay horarios de recolección disponibles para este pedido."
          : "There are no pickup times available for this order."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="rounded-2xl border border-canela/20 bg-canela-light px-4 py-3 text-xs text-ink">
        {readyNow
          ? es
            ? "Listo ahora — elige cuándo pasar por él."
            : "Ready now — choose when to collect."
          : hasCake
          ? required > 0
            ? es
              ? `Tu pastel necesita ${required}h de preparación.`
              : `Your cake needs ${required}h to prepare.`
            : es
            ? "Elige cuándo recoger tu pastel."
            : "Choose when to collect your cake."
          : required > PICKUP_MIN_LEAD_HOURS
          ? es
            ? `Tu pedido necesita ${required}h de preparación.`
            : `Your order needs ${required}h to prepare.`
          : es
          ? `Las recolecciones se piden con ${PICKUP_MIN_LEAD_HOURS}h de anticipación.`
          : `Pickups need ${PICKUP_MIN_LEAD_HOURS}h advance notice.`}
      </p>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
          {es ? "Día" : "Day"}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {days.map((d) => {
            const isSelected = date === d.date;
            return (
              <button
                type="button"
                key={d.date}
                onClick={() => {
                  onDateChange(d.date);
                  // One window that day is not a choice; take it.
                  onTimeChange(d.windows.length === 1 ? d.windows[0].label : "");
                }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all",
                  isSelected
                    ? "border-canela-dark bg-canela-light"
                    : "border-canela/30 bg-cream hover:border-canela"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    isSelected ? "bg-canela-dark text-cream" : "bg-canela-light"
                  )}
                >
                  {isSelected ? <Check className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{dayLabel(d.date)}</p>
                  <p className="text-xs text-ink-soft">
                    {d.windows.length}{" "}
                    {es
                      ? d.windows.length === 1
                        ? "horario"
                        : "horarios"
                      : d.windows.length === 1
                      ? "time"
                      : "times"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
            {es ? "Horario" : "Time"}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedDay.windows.map((w) => {
              const isSelected = time === w.label;
              return (
                <button
                  type="button"
                  key={w.label}
                  onClick={() => onTimeChange(w.label)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                    isSelected
                      ? "border-canela-dark bg-canela-light font-medium"
                      : "border-canela/30 bg-cream hover:border-canela"
                  )}
                >
                  <Clock className="h-3.5 w-3.5 text-canela-dark" />
                  {w.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
