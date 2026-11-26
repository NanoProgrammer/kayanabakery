"use client";

import { useState } from "react";
import { Tag, X, Check, Croissant } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { isDiscoverBreadCode, FREE_BREADS } from "@/lib/coupons/discover-bread";

type AppliedCoupon = {
  code: string;
  discountType: "PERCENT" | "FIXED" | "FREE_SHIPPING" | "FREE_BREAD";
  appliesTo?: string | null;
  discountValue: number;
  description?: string;
};

export function CouponInput({
  applied,
  onApply,
  onRemove,
  subtotalCents,
}: {
  applied: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onRemove: () => void;
  subtotalCents: number;
}) {
  const { locale } = useLocale();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase(), subtotalCents }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid coupon");
        return;
      }
      onApply({
        code: data.coupon.code,
        discountType: data.coupon.discountType,
        appliesTo: data.coupon.appliesTo ?? null,
        discountValue: data.coupon.discountValue,
        description: data.coupon.description,
      });
      setCode("");
    } catch {
      setError(locale === "es" ? "Error al validar" : "Failed to validate");
    } finally {
      setLoading(false);
    }
  }

  // Por TIPO, no por el código: así funciona con cualquier cupón de
  // panes gratis que Karyana cree en el Studio, no solo con DESCUBREPAN.
  const freeBread =
    applied?.discountType === "FREE_BREAD" || isDiscoverBreadCode(applied?.code);

  if (applied) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-2xl border-2 p-3",
          freeBread ? "border-gold bg-gold/10" : "border-canela bg-canela-light"
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-cream",
              freeBread ? "bg-gold" : "bg-canela-dark"
            )}
          >
            {freeBread ? <Croissant className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </div>
          <div>
            <p className="font-bold">{applied.code}</p>
            {/* Un cupón de panes gratis no quita dinero: los dos panes van
                en la caja y los escoge la panadería. Si no se dice aquí,
                el cliente lo aplica, ve $0.00 de descuento y cree que
                está roto. No tiene que escoger nada. */}
            {freeBread ? (
              <p className="text-sm font-medium text-ink">
                {locale === "es"
                  ? `Se te otorgarán ${FREE_BREADS} panes gratis`
                  : `You'll be given ${FREE_BREADS} free breads`}
                <span className="mt-0.5 block text-xs font-normal text-ink-soft">
                  {locale === "es"
                    ? "Los escogemos nosotros y van en tu caja — no hay nada que elegir ni descuento en el total."
                    : "We pick them and they go in your box — nothing to choose, and nothing off the total."}
                </span>
              </p>
            ) : (
              <p className="text-xs text-ink-soft">{applied.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={onRemove}
          aria-label="Remove coupon"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-cream"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
        {locale === "es" ? "Cupón" : "Coupon"}
      </label>
      <div className="mt-2 flex gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApply())}
            placeholder={locale === "es" ? "Código de cupón" : "Coupon code"}
            className={cn(
              "w-full rounded-full border bg-cream pl-11 pr-4 py-3 text-sm uppercase tracking-wider focus:outline-none",
              error
                ? "border-red-400 focus:border-red-500"
                : "border-canela/30 focus:border-canela-dark"
            )}
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={loading || !code}
          className="rounded-full bg-canela px-5 py-3 text-sm font-medium text-ink hover:bg-canela-dark disabled:opacity-50"
        >
          {loading ? "..." : locale === "es" ? "Aplicar" : "Apply"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
