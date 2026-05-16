"use client";

import { useMemo } from "react";
import { Calendar, Clock, Check } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

type PickupDay = {
  date: string;
  dayLabel: string;
  windowLabel: string;
};

function generatePickupDays(minLeadHours: number): PickupDay[] {
  const now = new Date();
  const earliest = new Date(now.getTime() + minLeadHours * 60 * 60 * 1000);
  const days: PickupDay[] = [];

  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const dow = d.getDay();

    let startH: number, endH: number;
    if (dow === 0) {
      startH = 13;
      endH = 15;
    } else if (dow >= 1 && dow <= 6) {
      startH = 16;
      endH = 18;
    } else {
      continue;
    }

    const windowEnd = new Date(d);
    windowEnd.setHours(endH, 0, 0, 0);
    if (windowEnd <= earliest) continue;

    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString("en-CA", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    const fmt = (h: number) => {
      const p = h >= 12 ? "PM" : "AM";
      const h12 = h > 12 ? h - 12 : h;
      return `${h12}:00 ${p}`;
    };

    days.push({
      date: dateStr,
      dayLabel,
      windowLabel: `${fmt(startH)} – ${fmt(endH)}`,
    });
  }

  return days;
}

export function PickupSlotPicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  minLeadHours = 0,
}: {
  date: string;
  time: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  minLeadHours?: number;
}) {
  const { locale } = useLocale();
  const pickupDays = useMemo(() => generatePickupDays(minLeadHours), [minLeadHours]);

  function handleSelect(day: PickupDay) {
    onDateChange(day.date);
    onTimeChange(day.windowLabel);
  }

  if (pickupDays.length === 0) {
    return (
      <div className="rounded-2xl border border-canela/15 bg-cream p-4 text-sm text-ink-soft">
        {locale === "es"
          ? "No hay horarios de recolección disponibles ahora."
          : "No pickup times available right now."}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {minLeadHours > 0 && (
        <p className="mb-3 text-xs text-ink-soft">
          ⏱{" "}
          {locale === "es"
            ? `Algunos productos requieren ${minLeadHours}h de anticipación.`
            : `Some items need ${minLeadHours}h advance notice.`}
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {pickupDays.map((day) => {
          const isSelected = date === day.date;
          return (
            <button
              type="button"
              key={day.date}
              onClick={() => handleSelect(day)}
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
                {isSelected ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Calendar className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{day.dayLabel}</p>
                <p className="flex items-center gap-1 text-xs text-ink-soft">
                  <Clock className="h-3 w-3" />
                  {day.windowLabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
