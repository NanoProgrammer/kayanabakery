"use client";

import Link from "next/link";
import { X, Crown, Check, CreditCard } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

/**
 * Modal shown when a non-member adds a members-only product to cart.
 * Product IS added to cart — this is an upsell nudge.
 * Checkout is gated by MembershipGate.
 *
 * All subscribe actions redirect to /membership/checkout?tier=ARTESANO
 * which requires card on file via Square. No free pass without card.
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

  const checkoutUrl = `/membership/checkout?tier=ARTESANO&callbackUrl=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.pathname : "/"
  )}`;

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
              ? "fue agregado a tu carrito. Para completar la compra necesitas membresía Artesano."
              : "was added to your cart. To complete purchase you need an Artesano membership."}
          </p>

          {/* Benefits */}
          <div className="mt-4 rounded-2xl border border-canela/20 bg-canela-light/30 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-canela-dark">
              Artesano —{" "}
              {locale === "es" ? "primer año gratis" : "first year free"}
            </p>
            <ul className="space-y-1.5 text-xs text-ink-soft">
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-canela-dark" />
                {locale === "es"
                  ? "$0 hoy · $39/año después del primer año"
                  : "$0 today · $39/year after first year"}
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-canela-dark" />
                {locale === "es"
                  ? "Productos exclusivos de miembros"
                  : "Exclusive member products"}
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-canela-dark" />
                {locale === "es" ? "2× puntos por compra" : "2× points per order"}
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-canela-dark" />
                {locale === "es"
                  ? "Envío gratis en pedidos +$32"
                  : "Free delivery on $32+ orders"}
              </li>
            </ul>
          </div>

          <div className="mt-5 space-y-3">
            {!isLoggedIn ? (
              <>
                <Link
                  href={`/register?callbackUrl=${encodeURIComponent(checkoutUrl)}`}
                  className="btn-primary flex w-full items-center justify-center gap-2"
                  onClick={onClose}
                >
                  <CreditCard className="h-4 w-4" />
                  {locale === "es" ? "Crear cuenta y suscribirme" : "Create account & subscribe"}
                </Link>
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(checkoutUrl)}`}
                  className="btn-ghost flex w-full items-center justify-center gap-2"
                  onClick={onClose}
                >
                  {locale === "es" ? "Ya tengo cuenta" : "I have an account"}
                </Link>
              </>
            ) : (
              <Link
                href={checkoutUrl}
                className="btn-primary flex w-full items-center justify-center gap-2"
                onClick={onClose}
              >
                <CreditCard className="h-4 w-4" />
                {locale === "es"
                  ? "Suscribirme — primer año gratis"
                  : "Subscribe — first year free"}
              </Link>
            )}

            <button
              onClick={onClose}
              className="w-full text-center text-xs text-ink-soft underline-offset-2 hover:underline"
            >
              {locale === "es"
                ? "Continuar sin membresía (se revisará al pagar)"
                : "Continue without membership (checked at checkout)"}
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
