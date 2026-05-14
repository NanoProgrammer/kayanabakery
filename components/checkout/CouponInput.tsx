"use client";

import { useState } from "react";
import { Tag, X, Check } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

type AppliedCoupon = {
  code: string;
  discountType: "PERCENT" | "FIXED";
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

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-canela bg-canela-light p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-canela-dark text-cream">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold">{applied.code}</p>
            {applied.description && (
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
