"use client";

import { CreditCard, PaymentForm } from "react-square-web-payments-sdk";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Crown, Check, Shield } from "lucide-react";
import { TIERS } from "@/lib/membership/tiers";
import type { Locale } from "@/lib/i18n/locale-provider";

type Props = {
  tier: "ARTESANO" | "SELECTO" | "LEGENDARIO";
  locale?: Locale;
};

export function SquareSubscriptionCheckout({ tier, locale = "en" }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account/membership";

  const tierData = TIERS[tier];
  const isArtesano = tier === "ARTESANO";

  const es = locale === "es";
  const priceLabel = isArtesano
    ? es ? "$0 hoy" : "$0 today"
    : `$${(tierData.priceCents / 100).toFixed(0)}/${tierData.cadence === "MONTHLY" ? (es ? "mes" : "mo") : (es ? "año" : "yr")}`;

  return (
    <div className="mt-6 space-y-6">
      {/* Plan summary */}
      <div className="rounded-3xl border border-canela/15 bg-canela-light/30 p-6">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-canela-dark" />
          <div>
            <p className="font-display text-2xl">{tierData.name}</p>
            <p className="text-sm text-ink-soft">
              {isArtesano
                ? es
                  ? "Primer año GRATIS · Luego $39/año · Tarjeta requerida"
                  : "First year FREE · Then $39/year · Card on file required"
                : `${priceLabel} · ${es ? "Facturado" : "Billed"} ${tierData.cadence === "MONTHLY" ? (es ? "mensualmente" : "monthly") : (es ? "anualmente" : "yearly")}`}
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
          {isArtesano && (
            <li className="flex items-center gap-2 font-medium text-canela-dark">
              <Check className="h-3.5 w-3.5" />
              {es ? "Sin cobro hoy — primer año completamente gratis" : "No charge today — first year completely free"}
            </li>
          )}
          {(tier === "SELECTO" || tier === "LEGENDARIO") && (
            <>
              <li className="flex items-center gap-2 font-medium text-canela-dark">
                <Check className="h-3.5 w-3.5 text-canela-dark" />
                {es ? "Caja de bienvenida GRATIS con 12 panes artesanales (valor $35)" : "FREE Welcome Box with 12 artisan breads ($35 value)"}
              </li>
              <li className="flex items-center gap-2 font-medium text-canela-dark">
                <Check className="h-3.5 w-3.5 text-canela-dark" />
                {es ? "Entrega prioritaria GRATIS antes de las 6 PM" : "FREE Priority Delivery before 6 PM"}
              </li>
            </>
          )}
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-canela-dark" />
            {es ? "Acceso a productos exclusivos y solo para miembros" : "Access to exclusive & members-only products"}
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-canela-dark" />
            {tierData.pointsMultiplier}× {es ? "puntos en cada orden" : "points on every order"}
          </li>
          {tierData.freeDelivery && (
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-canela-dark" />
              {es
                ? `Envío gratis en órdenes de $${(tierData.freeDeliveryMinOrderCents ?? 0) / 100}+`
                : `Free delivery on orders $${(tierData.freeDeliveryMinOrderCents ?? 0) / 100}+`}
            </li>
          )}
          {tierData.birthdayPoints > 0 && (
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-canela-dark" />
              {tierData.birthdayPoints} {es ? "puntos de cumpleaños" : "birthday points"}
            </li>
          )}
        </ul>
      </div>

      {/* Card form */}
      <div className="rounded-3xl border border-canela/15 bg-cream p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-canela-dark" />
          <h3 className="font-display text-xl">
            {isArtesano ? (es ? "Tarjeta en archivo" : "Card on file") : (es ? "Pago" : "Payment")}
          </h3>
        </div>

        {isArtesano && (
          <p className="mb-4 rounded-2xl bg-canela-light/50 p-3 text-xs text-ink-soft">
            {es
              ? "Tu tarjeta NO será cobrada hoy. Se guarda de forma segura para cuando termine tu año gratis. Puedes cancelar en cualquier momento antes de la renovación."
              : "Your card will NOT be charged today. It's saved securely for when your free year ends. You can cancel anytime before renewal."}
          </p>
        )}

        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <PaymentForm
          applicationId={process.env.NEXT_PUBLIC_SQUARE_APP_ID!}
          locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!}
          cardTokenizeResponseReceived={async (tokenResult) => {
            try {
              setError(null);

              if (tokenResult.status !== "OK") {
                setError(
                  (tokenResult as any).errors?.[0]?.message || "Card tokenization failed"
                );
                return;
              }

              const sourceId = tokenResult.token;
              if (!sourceId) {
                setError("No card token returned");
                return;
              }

              setLoading(true);

              const res = await fetch("/api/membership/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sourceId, tier }),
              });

              const data = await res.json();

              if (!res.ok) {
                throw new Error(data.error || "Subscription failed");
              }

              window.location.href = callbackUrl;
            } catch (err: any) {
              console.error(err);
              setError(err.message || "Something went wrong");
            } finally {
              setLoading(false);
            }
          }}
        >
          {/* Square CreditCard renders its own card input fields + Pay button */}
          {/* Do NOT add custom fontFamily styles — Square SDK rejects them */}
          <CreditCard
            buttonProps={{
              css: {
                backgroundColor: "#4A2E17",
                fontSize: "14px",
                color: "#FBF6EE",
                padding: "14px",
                borderRadius: "9999px",
                "&:hover": {
                  backgroundColor: "#2B1810",
                },
              },
              children: loading
                ? (es ? "Procesando..." : "Processing...")
                : isArtesano
                ? (es ? "Guardar tarjeta e iniciar año gratis" : "Save card & start free year")
                : (es ? `Suscribirme — ${priceLabel}` : `Subscribe — ${priceLabel}`),
            }}
          />
        </PaymentForm>

        <p className="mt-4 text-center text-[10px] text-ink-soft">
          {isArtesano
            ? es
              ? "Seguro con Square. $0 hoy. Se renueva a $39/año después de 12 meses. Cancela cuando quieras."
              : "Secure via Square. $0 today. Auto-renews at $39/year after 12 months. Cancel anytime."
            : es
            ? "Seguro con Square. Cancela cuando quieras desde tu cuenta."
            : "Secure via Square. Cancel anytime from your account."}
        </p>
      </div>
    </div>
  );
}
