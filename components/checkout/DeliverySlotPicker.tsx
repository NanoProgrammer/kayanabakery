"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, Crown } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

type Slot = {
  id: string;
  startTime: string;
  endTime: string;
  label?: string;
  capacity: number;
  reserved: number;
  remaining: number;
  membersOnly: boolean;
};

export function DeliverySlotPicker({
  selectedId,
  onChange,
}: {
  selectedId: string | null;
  onChange: (id: string) => void;
}) {
  const { locale } = useLocale();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/delivery-slots")
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-canela/15 bg-cream p-4 text-sm text-ink-soft">
        {locale === "es" ? "Cargando horarios…" : "Loading slots…"}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-canela/15 bg-cream p-4 text-sm text-ink-soft">
        {locale === "es"
          ? "No hay horarios disponibles. Intenta con recolección o regresa después."
          : "No delivery slots available. Try pickup or check back later."}
      </div>
    );
  }

  // Group by date
  const groups: Record<string, Slot[]> = {};
  slots.forEach((s) => {
    const d = new Date(s.startTime);
    const key = d.toLocaleDateString(locale === "es" ? "es-MX" : "en-CA", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });

  return (
    <div className="space-y-5">
      {Object.entries(groups).map(([day, daySlots]) => (
        <div key={day}>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
            <Calendar className="h-3 w-3" />
            {day}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {daySlots.map((s) => {
              const start = new Date(s.startTime);
              const end = new Date(s.endTime);
              const time = `${start.toLocaleTimeString(
                locale === "es" ? "es-MX" : "en-CA",
                {
                  hour: "numeric",
                  minute: "2-digit",
                }
              )} – ${end.toLocaleTimeString(
                locale === "es" ? "es-MX" : "en-CA",
                {
                  hour: "numeric",
                  minute: "2-digit",
                }
              )}`;
              const isSelected = selectedId === s.id;
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => onChange(s.id)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-all",
                    isSelected
                      ? "border-canela-dark bg-canela-light"
                      : "border-canela/30 bg-cream hover:border-canela"
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      {time}
                    </span>
                    {s.membersOnly && (
                      <Crown className="h-3 w-3 text-gold" />
                    )}
                  </div>
                  {s.label && (
                    <span className="text-[10px] uppercase tracking-widest text-ink-soft">
                      {s.label}
                    </span>
                  )}
                  <span className="text-[10px] text-ink-soft">
                    {s.remaining}{" "}
                    {locale === "es" ? "disponibles" : "spots left"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
