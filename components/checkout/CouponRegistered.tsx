"use client";

import { Gift } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import {
  COUPON_NAME,
  FREE_BREADS,
  MIN_ORDER_DOLLARS,
  REGISTERED_MESSAGE,
  couponCodeFor,
} from "@/lib/coupons/discover-bread";

/**
 * "¡TU CUPÓN HA SIDO REGISTRADO!"
 *
 * Shown on the confirmation page when the order contained a cake. The
 * meeting asked for the customer to be told in those words, and this is the
 * one screen they are guaranteed to look at — an email can go unopened and
 * the kitchen slip never reaches them.
 *
 * It states the two conditions plainly. A coupon whose rules the customer
 * discovers at the till is worse than no coupon.
 */
export function CouponRegistered({ orderNumber }: { orderNumber: string }) {
  const { locale } = useLocale();
  const es = locale === "es";
  const code = couponCodeFor(orderNumber);

  return (
    <section className="mt-8 rounded-3xl border-2 border-gold/40 bg-gold/5 p-6">
      <div className="flex items-start gap-3">
        <Gift className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            {COUPON_NAME}
          </p>
          <h2 className="mt-1 font-display text-2xl">
            {es ? REGISTERED_MESSAGE.es : REGISTERED_MESSAGE.en}
          </h2>
          <p className="mt-2 text-sm text-ink">
            {es
              ? `En tu próximo pedido de pan te regalamos ${FREE_BREADS} panes. Los escogemos nosotros — es una sorpresa.`
              : `On your next bread order we'll add ${FREE_BREADS} breads on us. We pick them — it's a surprise.`}
          </p>

          <p className="mt-4 text-xs uppercase tracking-widest text-ink-soft">
            {es ? "Tu código" : "Your code"}
          </p>
          <p className="select-all font-mono text-lg font-bold tracking-wider text-canela-dark">
            {code}
          </p>

          {/* Said here, not discovered at the till. */}
          <ul className="mt-4 space-y-1 text-xs text-ink-soft">
            <li>
              {es
                ? `· Pedido mínimo de pan de $${MIN_ORDER_DOLLARS}, antes de impuestos.`
                : `· Minimum bread order of $${MIN_ORDER_DOLLARS}, before tax.`}
            </li>
            <li>{es ? "· Una sola vez." : "· One time only."}</li>
            <li>
              {es
                ? "· Los panes van en tu caja; no es un descuento."
                : "· The breads go in your box; it isn't a discount."}
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
