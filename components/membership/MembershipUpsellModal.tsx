"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Crown, Check, CreditCard, Loader2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { toast } from "sonner";

/**
 * Modal shown immediately when a non-member tries to add a members-only
 * product to cart. Two flows:
 *   - Not logged in: "Create account" → /register?callbackUrl=current page
 *   - Logged in, no membership: Subscribe to Artesano in-place (card on file, first year free)
 *
 * In both cases the product IS added to cart — checkout is gated by MembershipGate.
 * This modal is an upsell nudge, not a blocker.
 */
export function MembershipUpsellModal({
  productName,
  isLoggedIn,
  onClose,
}: {
  productName: string;
  isLoggedIn: boolean;
  onClose: () => void;
}) {
  const { locale } = useLocale();
  const [subscribing, setSubscribing] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const res = await fetch("/api/membership/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "ARTESANO" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not subscribe");
        setSubscribing(false);
        return;
      }
      setDone(true);
      toast.success(
        locale === "es"
          ? "¡Bienvenido al plan Artesano! Producto agregado."
          : "Welcome to Artesano! Product added."
      );
      setTimeout(() => onClose(), 1500);
    } catch {
      toast.error("Network error");
      setSubscribing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-cream shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 hover:bg-canela-light"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="h-2 bg-gradient-to-r from-canela via-canela-dark to-canela" />

        <div className="p-7">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-canela-light">
            <Crown className="h-7 w-7 text-canela-dark" />
          </div>

          <h3 className="text-center font-display text-xl">
            {locale === "es"
              ? "Producto exclusivo para miembros"
              : "Members-only product"}
          </h3>

          <p className="mt-2 text-center text-sm text-ink-soft">
            <strong>{productName}</strong>{" "}
            {locale === "es"
              ? "está disponible solo para miembros Artesano. ¡Únete gratis el primer año!"
              : "is available only for Artesano members. Join free for the first year!"}
          </p>

          {/* Benefits */}
          <div className="mt-4 rounded-2xl border border-canela/20 bg-canela-light/30 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-canela-dark">
              Artesano
            </p>
            <ul className="space-y-1.5 text-xs text-ink-soft">
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-canela-dark" />
                {locale === "es"
                  ? "Primer año completamente gratis"
                  : "First year completely free"}
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-canela-dark" />
                {locale === "es"
                  ? "Productos exclusivos de miembros"
                  : "Exclusive member products"}
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-canela-dark" />
                {locale === "es" ? "1.5× puntos por compra" : "1.5× points per order"}
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-canela-dark" />
                {locale === "es"
                  ? "Envío gratis en pedidos +$50"
                  : "Free delivery on $50+ orders"}
              </li>
            </ul>
          </div>

          <div className="mt-5 space-y-3">
            {!isLoggedIn ? (
              <>
                <Link
                  href={`/register?callbackUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`}
                  className="btn-primary flex w-full items-center justify-center gap-2"
                  onClick={onClose}
                >
                  <CreditCard className="h-4 w-4" />
                  {locale === "es" ? "Crear cuenta y suscribirme" : "Create account & subscribe"}
                </Link>
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`}
                  className="btn-outline flex w-full items-center justify-center gap-2"
                  onClick={onClose}
                >
                  {locale === "es" ? "Ya tengo cuenta" : "I have an account"}
                </Link>
              </>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={subscribing || done}
                className="btn-primary flex w-full items-center justify-center gap-2"
              >
                {subscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : done ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {done
                  ? locale === "es" ? "¡Suscrito!" : "Subscribed!"
                  : locale === "es" ? "Suscribirme gratis" : "Subscribe free"}
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full text-center text-xs text-ink-soft underline-offset-2 hover:underline"
            >
              {locale === "es"
                ? "Agregar de todos modos (se revisará al pagar)"
                : "Add anyway (checked at checkout)"}
            </button>
          </div>

          <p className="mt-3 text-center text-[10px] text-ink-soft">
            {locale === "es"
              ? "Tarjeta requerida. Sin cargo hoy. $39/año después del primer año."
              : "Card required. No charge today. $39/year after first year."}
          </p>
        </div>
      </div>
    </div>
  );
}
