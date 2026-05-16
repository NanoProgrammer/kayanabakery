"use client";

import { Coins, Tag, Truck, Sparkles, Heart } from "lucide-react";
import Image from "next/image";
import { useLocale, pickI18n } from "@/lib/i18n/locale-provider";
import { type PricingBreakdown, formatCents } from "@/lib/checkout/pricing";
import { useCartStore } from "@/lib/store/cart-store";

export function OrderSummarySidebar({
  pricing,
}: {
  pricing: PricingBreakdown;
}) {
  const { locale } = useLocale();
  const items = useCartStore((s) => s.items);

  return (
    <aside className="rounded-3xl border border-canela/15 bg-cream p-6 lg:sticky lg:top-24">
      <h2 className="font-display text-xl">
        {locale === "es" ? "Tu orden" : "Your order"}
      </h2>

      <ul className="mt-4 space-y-3 border-b border-canela/15 pb-4">
        {items.map((it) => {
          const name = pickI18n(it as any, "name", locale) || it.name;
          return (
            <li key={it.productId} className="flex items-center gap-3 text-sm">
              {it.image && (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-canela-light">
                  <Image src={it.image} alt={name} fill className="object-cover" sizes="48px" />
                </div>
              )}
              <div className="flex-1">
                <p className="line-clamp-1 font-medium">{name}</p>
                <p className="text-xs text-ink-soft">×{it.quantity}</p>
              </div>
              <p className="font-bold">{formatCents(it.price * 100 * it.quantity, locale)}</p>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 space-y-2 text-sm">
        <Row label="Subtotal" value={formatCents(pricing.subtotalCents, locale)} />
        {pricing.couponDiscountCents > 0 && (
          <Row
            icon={<Tag className="h-3 w-3 text-canela-dark" />}
            label={locale === "es" ? "Cupón" : "Coupon"}
            value={`−${formatCents(pricing.couponDiscountCents, locale)}`}
            highlight
          />
        )}
        {pricing.pointsDiscountCents > 0 && (
          <Row
            icon={<Coins className="h-3 w-3 text-gold" />}
            label={locale === "es" ? "Puntos" : "Points"}
            value={`−${formatCents(pricing.pointsDiscountCents, locale)}`}
            highlight
          />
        )}
        <Row
          icon={<Truck className="h-3 w-3 text-ink-soft" />}
          label={
            pricing.freeDeliveryReason === "PICKUP"
              ? locale === "es" ? "Recolección" : "Pickup"
              : locale === "es" ? "Envío" : "Delivery"
          }
          value={
            pricing.deliveryFeeCents > 0
              ? formatCents(pricing.deliveryFeeCents, locale)
              : pricing.freeDeliveryReason === "MEMBER_FREE_DELIVERY"
              ? locale === "es" ? "GRATIS · MIEMBRO" : "FREE · MEMBER"
              : pricing.freeDeliveryReason === "FIRST_SE_DELIVERY"
              ? locale === "es" ? "GRATIS · 1RA SE" : "FREE · 1ST SE"
              : pricing.freeDeliveryReason === "COUPON_FREE_SHIPPING"
              ? locale === "es" ? "GRATIS · CUPÓN" : "FREE · COUPON"
              : locale === "es" ? "GRATIS" : "FREE"
          }
          highlight={pricing.deliveryFeeCents === 0 && pricing.freeDeliveryReason !== "PICKUP"}
        />
        {pricing.tipCents > 0 && (
          <Row
            icon={<Heart className="h-3 w-3 text-concha-rosa-dark" />}
            label={locale === "es" ? "Propina" : "Tip"}
            value={formatCents(pricing.tipCents, locale)}
          />
        )}
        <Row label="GST (5%)" value={formatCents(pricing.gstCents, locale)} />
        <div className="my-3 border-t border-canela/15" />
        <div className="flex items-center justify-between">
          <span className="font-display text-lg">Total</span>
          <span className="font-display text-2xl">{formatCents(pricing.totalCents, locale)}</span>
        </div>
        {pricing.pointsEarned > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-canela-light p-3 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span>
              {locale === "es" ? "Ganarás" : "You'll earn"}{" "}
              <strong>{pricing.pointsEarned} pts</strong>{" "}
              {locale === "es" ? "con esta orden" : "with this order"}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}

function Row({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={highlight ? "flex justify-between font-medium text-canela-dark" : "flex justify-between"}>
      <span className="flex items-center gap-1.5">{icon}{label}</span>
      <span>{value}</span>
    </div>
  );
}
