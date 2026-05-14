"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Check, Clock, X, Loader2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { formatPrice, cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = [
  {
    key: "IN_PROGRESS",
    emoji: "👩‍🍳",
    labelEn: "In preparation",
    labelEs: "En preparación",
    descEn: "Your order is being baked with love.",
    descEs: "Tu orden está siendo horneada con amor.",
  },
  {
    key: "READY",
    emoji: "✅",
    labelEn: "Ready!",
    labelEs: "¡Lista!",
    descEn: "Your order is ready for pickup or delivery.",
    descEs: "Tu orden está lista para recoger o enviar.",
  },
  {
    key: "OUT_FOR_DELIVERY",
    emoji: "🚚",
    labelEn: "On its way",
    labelEs: "En camino",
    descEn: "Your order is heading to you.",
    descEs: "Tu orden va en camino.",
  },
  {
    key: "COMPLETED",
    emoji: "🎉",
    labelEn: "Delivered",
    labelEs: "Entregada",
    descEn: "Enjoy your bread. ¡Buen provecho!",
    descEs: "Disfruta tu pan. ¡Buen provecho!",
  },
];

export default function TrackOrderPage() {
  const { locale } = useLocale();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pollear cada 30s mientras haya una orden visible
  useEffect(() => {
    if (!order) return;

    intervalRef.current = setInterval(() => {
      silentRefresh();
    }, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [order?.orderNumber, email]);

  async function fetchOrder(silent = false) {
    if (!orderNumber || !email) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(
        `/api/track?orderNumber=${encodeURIComponent(
          orderNumber
        )}&email=${encodeURIComponent(email)}`
      );

      if (!res.ok) {
        if (!silent) {
          toast.error(
            locale === "es" ? "Orden no encontrada" : "Order not found"
          );
          setOrder(null);
        }
        return;
      }

      const data = await res.json();

      // Notify if status changed
      if (order && data.order.status !== order.status) {
        toast.success(
          locale === "es"
            ? `Estado actualizado: ${getStep(data.order.status)?.labelEs}`
            : `Status updated: ${getStep(data.order.status)?.labelEn}`
        );
      }

      setOrder(data.order);
      setLastChecked(new Date());
    } catch {
      if (!silent) toast.error("Error");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function silentRefresh() {
    await fetchOrder(true);
  }

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    await fetchOrder(false);
  }

  function getStep(key: string) {
    return STEPS.find((s) => s.key === key);
  }

  const currentStepIdx = order
    ? STEPS.findIndex((s) => s.key === order.status)
    : -1;

  const cancelled = order?.status === "CANCELLED";
  const isPending =
    order?.status === "PENDING" || order?.status === "CONFIRMED";

  return (
    <div className="container-bakery py-16 md:py-20">
      <header className="mb-8 max-w-2xl">
        <span className="eyebrow">
          {locale === "es" ? "Rastrear orden" : "Track order"}
        </span>
        <h1 className="section-title mt-2">
          {locale === "es" ? "¿Dónde está " : "Where's my "}
          <span className="font-script text-canela-dark">
            {locale === "es" ? "mi pan?" : "bread?"}
          </span>
        </h1>
      </header>

      {/* Search form */}
      <form
        onSubmit={handleTrack}
        className="flex max-w-2xl flex-col gap-3 rounded-3xl border border-canela/15 bg-cream p-6 sm:flex-row"
      >
        <input
          required
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder={
            locale === "es"
              ? "Número de orden (KAR-...)"
              : "Order number (KAR-...)"
          }
          className="flex-1 rounded-full border border-canela/30 bg-white px-5 py-3 text-sm focus:border-canela-dark focus:outline-none"
        />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="flex-1 rounded-full border border-canela/30 bg-white px-5 py-3 text-sm focus:border-canela-dark focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary inline-flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {loading
            ? locale === "es"
              ? "Buscando…"
              : "Searching…"
            : locale === "es"
            ? "Buscar"
            : "Track"}
        </button>
      </form>

      {/* Order card */}
      {order && (
        <div className="mt-10 max-w-2xl space-y-6">
          {/* Summary */}
          <div className="rounded-3xl border border-canela/15 bg-cream p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">
                  {order.orderNumber}
                </p>
                <p className="mt-1 font-display text-2xl">
                  {formatPrice(order.total / 100, locale)}
                </p>
                <p className="text-xs text-ink-soft">
                  {new Date(order.createdAt).toLocaleString(
                    locale === "es" ? "es-MX" : "en-CA"
                  )}
                </p>
              </div>

              {cancelled ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-700">
                  <X className="h-3 w-3" />
                  {locale === "es" ? "Cancelada" : "Cancelled"}
                </span>
              ) : isPending ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-canela-light px-3 py-1 text-xs font-bold uppercase tracking-widest text-canela-dark">
                  <Clock className="h-3 w-3" />
                  {locale === "es" ? "Confirmando…" : "Confirming…"}
                </span>
              ) : null}
            </div>

            {/* Items */}
            {Array.isArray(order.items) && order.items.length > 0 && (
              <ul className="mt-5 space-y-1.5 border-t border-canela/15 pt-5 text-sm">
                {order.items.map((it: any, i: number) => (
                  <li key={i} className="flex justify-between">
                    <span className="text-ink">
                      {it.quantity}× {it.name}
                    </span>
                    <span className="font-medium">
                      {formatPrice((it.price * it.quantity) / 100, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Status tracker */}
          {!cancelled && !isPending && (
            <div className="rounded-3xl border border-canela/15 bg-cream p-6 md:p-8">
              <p className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
                {locale === "es" ? "Estado del pedido" : "Order status"}
              </p>

              <div className="space-y-3">
                {STEPS.map((step, i) => {
                  const done = i < currentStepIdx;
                  const current = i === currentStepIdx;
                  const future = i > currentStepIdx;

                  return (
                    <div
                      key={step.key}
                      className={cn(
                        "flex items-start gap-4 rounded-2xl border p-4 transition-all",
                        current
                          ? "border-canela bg-canela-light"
                          : done
                          ? "border-canela/20 bg-cream/60"
                          : "border-canela/10 opacity-40"
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg",
                          current
                            ? "bg-canela-dark text-cream"
                            : done
                            ? "bg-canela/30"
                            : "bg-canela/10"
                        )}
                      >
                        {done ? (
                          <Check className="h-4 w-4 text-canela-dark" />
                        ) : (
                          <span>{step.emoji}</span>
                        )}
                      </div>

                      {/* Text */}
                      <div>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            current && "font-bold text-canela-dark",
                            future && "text-ink-soft"
                          )}
                        >
                          {locale === "es" ? step.labelEs : step.labelEn}
                        </p>
                        {current && (
                          <p className="mt-0.5 text-xs text-ink-soft">
                            {locale === "es" ? step.descEs : step.descEn}
                          </p>
                        )}
                      </div>

                      {/* Pulse dot for current step */}
                      {current && (
                        <div className="ml-auto mt-1 flex shrink-0 items-center gap-1.5">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-canela opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-canela-dark" />
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending state */}
          {isPending && (
            <div className="rounded-3xl border border-canela/15 bg-cream p-6 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-canela" />
              <p className="mt-3 text-sm text-ink-soft">
                {locale === "es"
                  ? "Estamos confirmando tu orden. Refresca en un momento."
                  : "We're confirming your order. Check back in a moment."}
              </p>
            </div>
          )}

          {/* Auto-refresh note */}
          <p className="text-center text-[11px] uppercase tracking-widest text-ink-soft">
            {locale === "es"
              ? "Se actualiza automáticamente cada 30 segundos"
              : "Auto-refreshes every 30 seconds"}
            {lastChecked && (
              <span className="block mt-0.5 normal-case tracking-normal">
                {locale === "es" ? "Última verificación: " : "Last checked: "}
                {lastChecked.toLocaleTimeString(
                  locale === "es" ? "es-MX" : "en-CA",
                  { hour: "2-digit", minute: "2-digit", second: "2-digit" }
                )}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}