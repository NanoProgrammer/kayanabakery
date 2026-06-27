"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, ChevronLeft, ChevronRight, Check, Truck, Zap } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import type { MembershipTier } from "@/lib/membership/tiers";

type SlotFromAPI = {
  id: string;
  date: string;
  dayLabel: string;
  windowLabel: string;
  label: string;
  capacity: number;
  reserved: number;
  remaining: number;
  isPriority?: boolean;
  feeCentsBasico?: number;
  feeCentsArtesano?: number;
};

function getSlotFee(slot: SlotFromAPI, tier: MembershipTier): number {
  if (!slot.isPriority) return 0;
  if (tier === "SELECTO" || tier === "LEGENDARIO") return 0;
  if (tier === "ARTESANO") return slot.feeCentsArtesano ?? 0;
  return slot.feeCentsBasico ?? 0;
}

export function DeliverySlotPicker({
  selectedId,
  userTier = "BASICO",
  onChange,
}: {
  selectedId: string | null;
  userTier?: MembershipTier;
  onChange: (id: string, feeCents: number) => void;
}) {
  const { locale } = useLocale();
  const [slots, setSlots] = useState<SlotFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    fetch("/api/checkout/slots")
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const slotsByDate = useMemo(() => {
    const map: Record<string, SlotFromAPI[]> = {};
    for (const s of slots) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [slots]);

  const allDates = useMemo(() => Object.keys(slotsByDate).sort(), [slotsByDate]);

  const PAGE_SIZE = 7;
  const pagedDates = allDates.slice(
    weekOffset * PAGE_SIZE,
    (weekOffset + 1) * PAGE_SIZE
  );
  const canPrev = weekOffset > 0;
  const canNext = (weekOffset + 1) * PAGE_SIZE < allDates.length;

  if (loading) {
    return (
      <div className="rounded-2xl border border-canela/15 bg-cream p-6 text-center text-sm text-ink-soft">
        <Truck className="mx-auto mb-2 h-5 w-5 animate-pulse text-canela" />
        {locale === "es" ? "Cargando horarios…" : "Loading delivery slots…"}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-canela/15 bg-cream p-6 text-center text-sm text-ink-soft">
        {locale === "es"
          ? "No hay horarios de envío disponibles."
          : "No delivery slots available."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week nav */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => setWeekOffset((w) => w - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-canela/30 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
          {pagedDates.length > 0 && (
            <>
              {new Date(pagedDates[0] + "T12:00:00").toLocaleDateString(
                locale === "es" ? "es-MX" : "en-CA",
                { month: "short", day: "numeric" }
              )}
              {" — "}
              {new Date(pagedDates[pagedDates.length - 1] + "T12:00:00").toLocaleDateString(
                locale === "es" ? "es-MX" : "en-CA",
                { month: "short", day: "numeric" }
              )}
            </>
          )}
        </p>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => setWeekOffset((w) => w + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-canela/30 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid gap-3">
        {pagedDates.map((date) => {
          const daySlots = slotsByDate[date] || [];
          const dateObj = new Date(date + "T12:00:00");
          const dayName = dateObj.toLocaleDateString(
            locale === "es" ? "es-MX" : "en-CA",
            { weekday: "short" }
          );
          const dayNum = dateObj.getDate();

          return (
            <div key={date} className="rounded-2xl border border-canela/15 bg-cream p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-canela-light text-canela-dark">
                  <span className="text-[10px] font-bold uppercase leading-none">
                    {dayName}
                  </span>
                  <span className="text-lg font-bold leading-none">{dayNum}</span>
                </div>
                <p className="text-sm font-medium">
                  {dateObj.toLocaleDateString(
                    locale === "es" ? "es-MX" : "en-CA",
                    { weekday: "long", month: "long", day: "numeric" }
                  )}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {daySlots.map((slot) => {
                  const isSelected = selectedId === slot.id;
                  const isFull = slot.remaining <= 0;

                  return (
                    <button
                      type="button"
                      key={slot.id}
                      disabled={isFull}
                      onClick={() => onChange(slot.id, getSlotFee(slot, userTier))}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                        isFull
                          ? "cursor-not-allowed border-canela/10 bg-cream/50 opacity-50"
                          : isSelected
                          ? "border-canela-dark bg-canela-light"
                          : slot.isPriority
                          ? "border-gold/60 bg-cream hover:border-gold"
                          : "border-canela/30 bg-cream hover:border-canela"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full",
                          isSelected
                            ? "bg-canela-dark text-cream"
                            : slot.isPriority
                            ? "bg-gold/20 text-canela-dark"
                            : "bg-canela-light"
                        )}
                      >
                        {isSelected ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : slot.isPriority ? (
                          <Zap className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{slot.label}</p>
                        <p className="text-[10px] text-ink-soft">
                          {isFull
                            ? locale === "es" ? "Agotado" : "Full"
                            : `${slot.remaining} ${locale === "es" ? "disponibles" : "spots left"}`}
                        </p>
                      </div>
                      {slot.isPriority && (
                        <div className="text-right">
                          {getSlotFee(slot, userTier) === 0 ? (
                            <span className="rounded-full bg-canela-dark px-2 py-0.5 text-[10px] font-bold text-cream">
                              {locale === "es" ? "GRATIS" : "FREE"}
                            </span>
                          ) : (
                            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-canela-dark">
                              +${(getSlotFee(slot, userTier) / 100).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
