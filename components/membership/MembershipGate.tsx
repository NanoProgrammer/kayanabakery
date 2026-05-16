"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Crown, CreditCard, Loader2, Check } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { toast } from "sonner";

/**
 * Blocks checkout when member-only items are in cart but user
 * is not at least ARTESANO tier.
 *
 * Flow:
 *   1. Not logged in → "Sign up / Sign in to continue"
 *   2. Logged in, no membership → "Subscribe to Artesano (free first year, card on file)"
 *      Calls POST /api/membership/subscribe which creates ARTESANO with Square card-on-file.
 *      On success, reloads page so the server re-fetches user.tier.
 */
export function MembershipGate({
  isLoggedIn,
  memberOnlyItems,
}: {
  isLoggedIn: boolean;
  memberOnlyItems: string[];
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
          ? "¡Bienvenido al plan Artesano!"
          : "Welcome to the Artesano plan!"
      );
      // Reload to re-fetch session + user tier
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      toast.error("Network error");
      setSubscribing(false);
    }
  }

  return (
    <div className="mb-8 rounded-3xl border-2 border-canela bg-canela-light/50 p-6 md:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-canela-dark text-cream">
          <Lock className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-xl">
            {locale === "es"
              ? "Productos exclusivos para miembros"
              : "Members-only items in your cart"}
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            {locale === "es"
              ? "Los siguientes productos requieren membresía Artesano o superior:"
              : "The following items require an Artesano membership or higher:"}
          </p>
          <ul className="mt-2 space-y-1">
            {memberOnlyItems.map((name) => (
              <li key={name} className="flex items-center gap-2 text-sm">
                <Crown className="h-3 w-3 text-canela-dark" />
                {name}
              </li>
            ))}
          </ul>

          {!isLoggedIn ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/register?callbackUrl=/checkout"
                className="btn-primary inline-flex items-center gap-2"
              >
                {locale === "es" ? "Crear cuenta" : "Create account"}
              </Link>
              <Link
                href="/login?callbackUrl=/checkout"
                className="btn-outline inline-flex items-center gap-2"
              >
                {locale === "es" ? "Iniciar sesión" : "Sign in"}
              </Link>
            </div>
          ) : (
            <div className="mt-5">
              <div className="mb-3 rounded-2xl border border-canela/30 bg-cream p-4">
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-canela-dark" />
                  <div>
                    <p className="font-display text-lg">Artesano</p>
                    <p className="text-xs text-ink-soft">
                      {locale === "es"
                        ? "Primer año GRATIS · Luego $39/año · Tarjeta en file"
                        : "First year FREE · Then $39/year · Card on file"}
                    </p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-ink-soft">
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-canela-dark" />
                    {locale === "es"
                      ? "Acceso a productos exclusivos"
                      : "Access to exclusive products"}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-canela-dark" />
                    {locale === "es" ? "1.5× puntos" : "1.5× points"}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-canela-dark" />
                    {locale === "es"
                      ? "Envío gratis en pedidos +$50"
                      : "Free delivery on orders $50+"}
                  </li>
                </ul>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={subscribing || done}
                className="btn-primary inline-flex w-full items-center justify-center gap-2"
              >
                {subscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : done ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {done
                  ? locale === "es"
                    ? "¡Suscrito!"
                    : "Subscribed!"
                  : locale === "es"
                  ? "Suscribirme gratis"
                  : "Subscribe free"}
              </button>

              <p className="mt-2 text-center text-[10px] text-ink-soft">
                {locale === "es"
                  ? "Se requiere tarjeta. No se cobra hoy. Se renueva a $39/año después del primer año."
                  : "Card required. No charge today. Renews at $39/year after first year."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
