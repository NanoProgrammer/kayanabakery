"use client";

import Link from "next/link";
import { Check, X, Lock } from "lucide-react";
import { TIERS, type MembershipTier } from "@/lib/membership/tiers";
import { TIER_THRESHOLDS, LEGENDARIO_MIN_PERSONAL_PURCHASES } from "@/lib/loyalty/klc";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

/**
 * The five levels, as levels — not as plans for sale.
 *
 * This replaced a pricing table with "$30/month" and a Subscribe button on
 * every column. That table said the opposite of what the Club now is: a
 * tier is EARNED by buying, not bought by subscribing, and a page that
 * asks for a card contradicts the whole idea before the customer has
 * read a word of it.
 *
 * So: no prices, no cadence, no card, no Subscribe. Each column says how
 * that level is reached and what it gives. The benefit rows are the same
 * ones as before, because what the levels DO has not changed — only how
 * you get them.
 */
const TIER_ORDER: MembershipTier[] = ["BASICO", "ARTESANO", "SELECTO", "LEGENDARIO", "EMBAJADOR"];

export function ClubTiers({ currentTier }: { currentTier: MembershipTier }) {
  const { locale } = useLocale();
  const es = locale === "es";

  /** How this level is reached. Never a price. */
  function howToReach(tier: MembershipTier): { headline: string; note: string | null } {
    switch (tier) {
      case "BASICO":
        return {
          headline: es ? "Al registrarte" : "When you join",
          note: es ? "Gratis, siempre" : "Free, always",
        };
      case "ARTESANO":
        return { headline: `${TIER_THRESHOLDS.ARTESANO} KLC`, note: null };
      case "SELECTO":
        return { headline: `${TIER_THRESHOLDS.SELECTO} KLC`, note: null };
      case "LEGENDARIO":
        return {
          headline: `${TIER_THRESHOLDS.LEGENDARIO} KLC`,
          note: es
            ? `y ${LEGENDARIO_MIN_PERSONAL_PURCHASES} compras tuyas en días distintos`
            : `plus ${LEGENDARIO_MIN_PERSONAL_PURCHASES} purchases of your own, on different days`,
        };
      case "EMBAJADOR":
        return {
          headline: es ? "Por invitación" : "By invitation",
          note: es ? "No se gana con KLC" : "Not earned with KLC",
        };
    }
  }

  return (
    <section className="container-bakery py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="section-title">
          {es ? "Los cinco " : "The five "}
          <span className="font-script text-canela-dark">{es ? "niveles" : "levels"}</span>
        </h2>
        <p className="mt-4 text-ink-soft">
          {es
            ? "Ninguno se compra. Cada uno se gana comprando, y se conserva comprando."
            : "None of them is for sale. Each one is earned by buying, and kept by buying."}
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3 lg:grid-cols-5">
        {TIER_ORDER.map((tier) => {
          const data = TIERS[tier];
          const reach = howToReach(tier);
          const isCurrent = currentTier === tier;

          const benefits: { ok: boolean; label: string }[] = [
            {
              ok: data.includedBreadWithPayment,
              label: es ? "Orden automática de pan" : "Bread Auto Reorder",
            },
            {
              ok: data.freeAdvanceSamples,
              label: es ? "Muestras gratis anticipadas" : "Free advance samples",
            },
            {
              ok: data.outOfStockAccess,
              label: es ? "Acceso a productos agotados" : "Access to out-of-stock items",
            },
            {
              ok: data.offSeasonAccess,
              label: es ? "Acceso fuera de temporada" : "Off-season access",
            },
            {
              ok: data.freeDelivery,
              label: data.freeDeliveryMinOrderCents
                ? es
                  ? `Envío gratis (min $${data.freeDeliveryMinOrderCents / 100})`
                  : `Free delivery (min $${data.freeDeliveryMinOrderCents / 100})`
                : data.pickupOnly
                  ? es
                    ? "Solo recolección"
                    : "Pickup only"
                  : es
                    ? "Envío gratis"
                    : "Free delivery",
            },
            {
              ok: tier === "SELECTO" || tier === "LEGENDARIO",
              label: es
                ? "Entrega prioritaria antes de las 6 PM"
                : "Priority delivery before 6 PM",
            },
            {
              ok: data.birthdayPoints > 0,
              label: es
                ? `${data.birthdayPoints || 500} pts de cumpleaños`
                : `${data.birthdayPoints || 500} birthday pts`,
            },
            {
              ok: data.karyanaMakesYourCake,
              label: es
                ? "Karyana hace tu pastel de cumpleaños"
                : "Karyana makes your birthday cake",
            },
            {
              ok: data.autoMonthlyPromos,
              label: es ? "Promos mensuales automáticas" : "Auto monthly promos",
            },
            {
              ok: data.partnerDiscounts,
              label: es ? "Descuentos en partners" : "Partner discounts",
            },
            {
              ok: true,
              label: es ? `${data.pointsMultiplier}x puntos` : `${data.pointsMultiplier}x points`,
            },
          ];

          if (data.paidForDelivery) {
            benefits.push({
              ok: true,
              label: es ? "Pago por hacer entregas" : "Paid for deliveries",
            });
          }

          return (
            <div
              key={tier}
              className={cn(
                "relative flex flex-col rounded-3xl border p-6 transition-shadow",
                isCurrent
                  ? "border-gold bg-gradient-to-b from-cream to-canela-light shadow-xl md:scale-[1.03]"
                  : "border-canela/20 bg-cream hover:shadow-lg",
                tier === "EMBAJADOR" && !isCurrent && "border-canela-dark/40"
              )}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cream shadow">
                  {es ? "Tu nivel" : "Your level"}
                </span>
              )}
              {tier === "EMBAJADOR" && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-canela-dark px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cream shadow">
                  {es ? "Por invitación" : "By invitation"}
                </span>
              )}

              <div className="text-center">
                <p className="font-display text-2xl">{data.name}</p>
                {/* Where a price used to be. */}
                <p className="mt-4 font-display text-3xl text-canela-dark">{reach.headline}</p>
                {reach.note && <p className="mt-1 text-[11px] text-ink-soft">{reach.note}</p>}
              </div>

              <ul className="mt-6 flex-1 space-y-2 text-xs">
                {benefits.map((b, i) => (
                  <li key={i} className={cn("flex items-start gap-2", !b.ok && "text-ink-soft/60")}>
                    {b.ok ? (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-canela-dark" />
                    ) : (
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft/40" />
                    )}
                    <span>{b.label}</span>
                  </li>
                ))}
              </ul>

              {/* One way in, and it is a purchase — not a checkout for a
                  plan. Embajador is the exception: it is applied for. */}
              {tier === "EMBAJADOR" ? (
                <Link
                  href="/ambassador"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-canela px-5 py-3 text-sm font-medium text-ink transition-all hover:bg-canela-dark"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {es ? "Postularme" : "Apply"}
                </Link>
              ) : isCurrent ? (
                <span className="mt-6 inline-flex items-center justify-center rounded-full bg-ink/10 px-5 py-3 text-sm text-ink-soft">
                  {es ? "Estás aquí" : "You are here"}
                </span>
              ) : (
                <Link
                  href="/shop"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-canela-dark px-5 py-3 text-sm font-medium text-cream transition-all hover:bg-ink"
                >
                  {es ? "Sumar KLC" : "Earn KLC"}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <p className="mx-auto mt-10 max-w-3xl text-center text-xs text-ink-soft">
        {es
          ? "Los KLC son créditos para subir de nivel — no son dinero ni se canjean por productos. Los puntos de Karyana son otra cosa y siguen funcionando igual: 100 pts = $1."
          : "KLC are credits for moving up a level — they are not money and cannot be exchanged for products. Karyana points are a separate thing and work exactly as before: 100 pts = $1."}
      </p>
    </section>
  );
}
