"use client";

import { Calendar, Clock } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

const PICKUP_TIMES = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
];

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
  const today = new Date();
  today.setHours(today.getHours() + minLeadHours);
  const minDate = today.toISOString().slice(0, 10);

  const maxDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
          <Calendar className="h-3 w-3" />
          {locale === "es" ? "Fecha" : "Date"}
        </label>
        <input
          type="date"
          required
          min={minDate}
          max={maxDate}
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="mt-2 w-full rounded-full border border-canela/30 bg-cream px-5 py-3 text-sm focus:border-canela-dark focus:outline-none"
        />
      </div>
      <div>
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
          <Clock className="h-3 w-3" />
          {locale === "es" ? "Hora" : "Time"}
        </label>
        <select
          required
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="mt-2 w-full rounded-full border border-canela/30 bg-cream px-5 py-3 text-sm focus:border-canela-dark focus:outline-none"
        >
          <option value="">
            {locale === "es" ? "Selecciona…" : "Select…"}
          </option>
          {PICKUP_TIMES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      {minLeadHours > 0 && (
        <p className="sm:col-span-2 text-xs text-ink-soft">
          ⏱{" "}
          {locale === "es"
            ? `Algunos productos requieren ${minLeadHours}h de anticipación.`
            : `Some items need ${minLeadHours}h advance notice.`}
        </p>
      )}
    </div>
  );
}
