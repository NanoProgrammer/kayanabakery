"use client";

import Link from "next/link";
import { Check, X, Crown, Star, Sparkles } from "lucide-react";
import { TIERS, type MembershipTier } from "@/lib/membership/tiers";
import { useLocale, pickI18n } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import type { MembershipPlanCMS } from "@/types";

const TIER_ORDER: MembershipTier[] = [
  "BASICO",
  "ARTESANO",
  "SELECTO",
  "LEGENDARIO",
  "EMBAJADOR",
];

export function MembershipPricingTable({
  cmsPlans,
  currentTier,
  loggedIn,
  membership,
}: {
  cmsPlans: MembershipPlanCMS[];
  currentTier: MembershipTier;
  loggedIn: boolean;
  membership?: any;
}) {
  const { t, locale } = useLocale();
  const cmsByTier = Object.fromEntries(cmsPlans.map((p) => [p.tier, p]));

  return (
    <section className="container-bakery py-20">
      <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-5">
        {TIER_ORDER.map((tier) => {
          const data = TIERS[tier];
          const cms = cmsByTier[tier];
          const tag = pickI18n(cms, "tagEn", locale);
          const description = pickI18n(cms, "descriptionEn", locale);
          const highlight = pickI18n(cms, "highlightEn", locale);
          const isFeatured = cms?.isFeatured || tier === "SELECTO";
          const isCurrent = currentTier === tier;

          // Price display — Artesano shows "FREE" with "$39/yr after"
          let priceStr: string;
          let cadenceStr: string;
          let promoNote: string | null = null;

          if (tier === "ARTESANO") {
            priceStr = locale === "es" ? "GRATIS" : "FREE";
            cadenceStr = locale === "es" ? "primer año" : "first year";
            promoNote = locale === "es"
              ? "Luego $39/año · Tarjeta requerida"
              : "Then $39/year · Card required";
          } else if (data.cadence === "FREE") {
            priceStr = data.needsApproval
              ? t("membership.needsApproval")
              : t("membership.free");
            cadenceStr = "";
          } else {
            priceStr = `$${(data.priceCents / 100).toFixed(0)}`;
            cadenceStr =
              data.cadence === "MONTHLY"
                ? t("membership.perMonth")
                : t("membership.perYear");
          }

          const benefits: { ok: boolean; label: string }[] = [
            {
              ok: data.includedBreadWithPayment,
              label:
                locale === "es"
                  ? "Pan gratis con pago mensual"
                  : "Free bread with payment",
            },
            {
              ok: data.firstBoxWith6FreePieces,
              label:
                locale === "es"
                  ? "1ra caja con 6 panes gratis"
                  : "First box: 6 pieces free",
            },
            {
              ok: data.weeklyOrderSkip,
              label:
                locale === "es"
                  ? "Saltar orden semanal"
                  : "Weekly order skip",
            },
            {
              ok: data.freeAdvanceSamples,
              label:
                locale === "es"
                  ? "Muestras gratis anticipadas"
                  : "Free advance samples",
            },
            {
              ok: data.outOfStockAccess,
              label:
                locale === "es"
                  ? "Acceso a productos agotados"
                  : "Access to out-of-stock items",
            },
            {
              ok: data.offSeasonAccess,
              label:
                locale === "es"
                  ? "Acceso fuera de temporada"
                  : "Off-season access",
            },
            {
              ok: data.freeDelivery,
              label: data.freeDeliveryMinOrderCents
                ? locale === "es"
                  ? `Envío gratis (min $${data.freeDeliveryMinOrderCents / 100})`
                  : `Free delivery (min $${data.freeDeliveryMinOrderCents / 100})`
                : data.pickupOnly
                ? locale === "es"
                  ? "Solo recolección"
                  : "Pickup only"
                : locale === "es"
                ? "Envío gratis"
                : "Free delivery",
            },
            {
  ok: tier === "SELECTO" || tier === "LEGENDARIO",
  label:
    locale === "es"
      ? "Entrega gratuita antes de las 6 PM"
      : "FREE priority delivery before 6 PM",
},
            {
              ok: data.birthdayPoints > 0,
              label:
                data.birthdayPoints > 0
                  ? locale === "es"
                    ? `${data.birthdayPoints} pts de cumpleaños`
                    : `${data.birthdayPoints} birthday pts`
                  : locale === "es"
                  ? "500 Pts de cumpleaños"
                  : "500 Birthday points",
            },
            {
              ok: data.freeNewBreadPerMonth > 0,
              label:
                data.freeNewBreadPerMonth > 0
                  ? data.freeNewBreadOnlyFirstOrder
                    ? locale === "es"
                      ? "1 pan nuevo en 1ra orden"
                      : "1 new bread on first order"
                    : locale === "es"
                    ? `${data.freeNewBreadPerMonth} pan nuevo/mes`
                    : `${data.freeNewBreadPerMonth} new bread/mo`
                  : locale === "es"
                  ? "Pan nuevo gratis"
                  : "Free new bread",
            },
            {
              ok: data.autoMonthlyPromos,
              label:
                locale === "es"
                  ? "Promos mensuales automáticas"
                  : "Auto monthly promos",
            },
            {
              ok: data.partnerDiscounts,
              label:
                locale === "es"
                  ? "Descuentos en partners"
                  : "Partner discounts",
            },
            {
              ok: true,
              label:
                locale === "es"
                  ? `${data.pointsMultiplier}x puntos`
                  : `${data.pointsMultiplier}x points`,
            },
          ];

          if (data.paidForDelivery) {
            benefits.push({
              ok: true,
              label:
                locale === "es"
                  ? "Pago por hacer entregas"
                  : "Paid for deliveries",
            });
          }

          // CTA
          let ctaLabel = t("membership.subscribe");
          let ctaHref = loggedIn
            ? `/membership/checkout?tier=${tier}`
            : `/login?callbackUrl=/memberships`;

          if (tier === "BASICO") {
            ctaLabel = isCurrent
              ? t("membership.currentPlan")
              : locale === "es"
              ? "Ya incluido"
              : "Already included";
            ctaHref = "/shop";
          } else if (tier === "EMBAJADOR") {
            ctaLabel = t("membership.applyEmbajador");
            ctaHref = "/ambassador";
          } else if (isCurrent) {
            ctaLabel = t("membership.currentPlan");
            ctaHref = "/account/membership";
          } else if (tier === "ARTESANO") {
            ctaLabel = locale === "es"
              ? "Empezar gratis"
              : "Start free";
          }

          return (
            <div
              key={tier}
              className={cn(
                "relative flex flex-col rounded-3xl border p-6",
                isFeatured
                  ? "border-gold bg-gradient-to-b from-cream to-canela-light shadow-xl md:scale-[1.03]"
                  : "border-canela/20 bg-cream",
                tier === "ARTESANO" && !isFeatured && "border-canela",
                tier === "EMBAJADOR" && "border-canela-dark/40"
              )}
            >
              {/* Artesano promo badge */}
              {tier === "ARTESANO" && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-canela-dark px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cream shadow">
                  <Sparkles className="mr-1 inline h-3 w-3" />
                  {locale === "es" ? "1er año gratis" : "1st year free"}
                </span>
              )}

              {(highlight || isFeatured) && tier !== "ARTESANO" && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cream shadow">
                  <Sparkles className="mr-1 inline h-3 w-3" />
                  {highlight || (locale === "es" ? "Más popular" : "Most loved")}
                </span>
              )}

              {tier === "EMBAJADOR" && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-canela-dark px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cream shadow">
                  {locale === "es" ? "Por aplicación" : "By application"}
                </span>
              )}

              {isCurrent && (
                <span className="absolute -top-3 right-4 rounded-full bg-ink px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cream shadow">
                  {t("membership.currentPlan")}
                </span>
              )}

              <div className="text-center">
                <p className="font-display text-2xl">{data.name}</p>
                {tag && (
                  <p className="mt-1 font-script text-lg text-canela-dark">
                    {tag}
                  </p>
                )}
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="font-display text-4xl">{priceStr}</span>
                  {cadenceStr && (
                    <span className="text-sm text-ink-soft">{cadenceStr}</span>
                  )}
                </div>
                {promoNote && (
                  <p className="mt-1 text-[11px] text-ink-soft">{promoNote}</p>
                )}
                {description && (
                  <p className="mt-3 text-xs text-ink-soft">{description}</p>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-2 text-xs">
                {benefits.map((b, i) => (
                  <li
                    key={i}
                    className={cn(
                      "flex items-start gap-2",
                      !b.ok && "text-ink-soft/60"
                    )}
                  >
                    {b.ok ? (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-canela-dark" />
                    ) : (
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft/40" />
                    )}
                    <span>{b.label}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={ctaHref}
                className={cn(
                  "mt-6 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition-all",
                  isCurrent
                    ? "bg-ink/10 text-ink-soft"
                    : tier === "ARTESANO" && !isCurrent
                    ? "bg-canela-dark text-cream hover:bg-ink"
                    : isFeatured
                    ? "bg-canela-dark text-cream hover:bg-ink shadow-md"
                    : "bg-canela text-ink hover:bg-canela-dark"
                )}
              >
                {ctaLabel}
              </Link>
            </div>
          );
        })}
      </div>

      <p className="mt-10 text-center text-xs text-ink-soft">
  {locale === "es"
    ? "100 pts = $1. Cancela cuando quieras. Artesano: primer año gratis. ¿Necesitas tu pedido antes de las 6 PM? Básico $8.99 • Artesano $4.99 • GRATIS con Selecto y Legendario."
    : "100 pts = $1. Cancel anytime. Artesano: first year free. Need your order before 6 PM? Basic $8.99 • Artesano $4.99 • FREE with Selecto & Legendario."}
    </p>
    </section>
  );
}
