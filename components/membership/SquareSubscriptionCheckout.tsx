"use client";

import { CreditCard, PaymentForm } from "react-square-web-payments-sdk";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Crown, Check, Shield } from "lucide-react";
import { TIERS } from "@/lib/membership/tiers";
import { useLocale } from "@/lib/i18n/locale-provider";
import { trackEvent } from "@/lib/analytics/gtag";

type Props = {
  tier: "ARTESANO" | "SELECTO" | "LEGENDARIO";
};

export function SquareSubscriptionCheckout({ tier }: Props) {
  const { locale } = useLocale();
  const [loading, setLoading] = useState(false);
  // What the fee buys. Offered only where there is a weekly box to choose
  // between; Artesano has none, so there is nothing to ask.
  const [benefitMode, setBenefitMode] = useState<"WEEKLY_BOX" | "POINTS">("WEEKLY_BOX");
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
            {(tier === "SELECTO" || tier === "LEGENDARIO") && (
  <p className="mt-2 text-sm font-medium text-canela-dark">
    {es
      ? "✨ Tu pago mensual se convierte en puntos. Úsalos en el checkout para obtener productos sin pagar dinero adicional."
      : "✨ Your monthly payment is converted into points. Use them at checkout to get products without paying additional money."}
  </p>
)}
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

      {/* What the fee buys */}
      {(tier === "SELECTO" || tier === "LEGENDARIO") && (
        <div className="rounded-3xl border border-canela/15 bg-cream p-6">
          <h3 className="font-display text-xl">
            {es ? "¿Cómo quieres usar tu membresía?" : "How do you want to use your membership?"}
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            {es
              ? "Puedes cambiarlo cuando quieras desde tu cuenta."
              : "You can change this any time from your account."}
          </p>

          <div className="mt-4 space-y-3">
            {([
              {
                value: "WEEKLY_BOX" as const,
                title: es ? "Caja cada semana" : "A box every week",
                body: es
                  ? "Preparamos tu caja sin que hagas nada. Se paga con tus puntos, y solo cobramos a tu tarjeta lo que falte."
                  : "We make up your box without you doing anything. It's paid from your points, and your card only covers what they don't.",
              },
              {
                value: "POINTS" as const,
                title: es ? "Solo puntos" : "Points only",
                body: es
                  ? `Tu pago se vuelve $${(tierData.priceCents / 100).toFixed(0)} en puntos y pides cuando tú quieras. Sin orden automática.`
                  : `Your payment becomes $${(tierData.priceCents / 100).toFixed(0)} in points and you order whenever you like. No automatic order.`,
              },
            ]).map((option) => {
              const selected = benefitMode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBenefitMode(option.value)}
                  aria-pressed={selected}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-canela-dark bg-canela-light/50"
                      : "border-canela/25 hover:border-canela/50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        selected ? "border-canela-dark" : "border-canela/40"
                      }`}
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-canela-dark" />}
                    </span>
                    <span className="font-bold">{option.title}</span>
                  </span>
                  <span className="mt-1 block pl-6 text-sm text-ink-soft">{option.body}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
                body: JSON.stringify({ sourceId, tier, benefitMode }),
              });

              const data = await res.json();

              if (!res.ok) {
                throw new Error(data.error || "Subscription failed");
              }

              trackEvent("sign_up", {
                method: tier,
                currency: "CAD",
                value: isArtesano ? 0 : tierData.priceCents / 100,
              });

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
