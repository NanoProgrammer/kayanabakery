"use client";

import Link from "next/link";
import { Lock, Crown, CreditCard, Check } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

/**
 * Blocks checkout when member-only items are in cart but user
 * is not at least ARTESANO tier.
 *
 * Flow:
 *   1. Not logged in → "Sign up / Sign in to continue"
 *   2. Logged in, no membership → Redirect to /membership/checkout?tier=ARTESANO
 *      where they enter their card. No free pass without card on file.
 */
export function MembershipGate({
  isLoggedIn,
  memberOnlyItems,
}: {
  isLoggedIn: boolean;
  memberOnlyItems: string[];
}) {
  const { locale } = useLocale();

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
                className="btn-ghost inline-flex items-center gap-2"
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
                        ? "Primer año GRATIS · Luego $39/año · Tarjeta requerida"
                        : "First year FREE · Then $39/year · Card required"}
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
                    {locale === "es" ? "2× puntos" : "2× points"}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-canela-dark" />
                    {locale === "es"
                      ? "Envío gratis en pedidos +$32"
                      : "Free delivery on orders $32+"}
                  </li>
                </ul>
              </div>

              {/* Redirect to membership checkout — requires card on file */}
              <Link
                href="/membership/checkout?tier=ARTESANO&callbackUrl=/checkout"
                className="btn-primary inline-flex w-full items-center justify-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {locale === "es"
                  ? "Suscribirme — primer año gratis"
                  : "Subscribe — first year free"}
              </Link>

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
