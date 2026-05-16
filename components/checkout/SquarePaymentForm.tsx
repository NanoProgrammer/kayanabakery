"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useLocale } from "@/lib/i18n/locale-provider";
import { CreditCard } from "lucide-react";


export function SquarePaymentForm({
  onTokenReady,
  totalCents,
  disabled,
}: {
  onTokenReady: (token: string) => Promise<void>;
  totalCents: number;
  disabled?: boolean;
}) {
  const { locale } = useLocale();
  const [card, setCard] = useState<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scriptLoaded) return;
    if (!(window as any).Square) return;
    if (card) return;

    const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID;
    const locId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
    if (!appId || !locId) {
      setError("Square not configured");
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const payments = (window as any).Square.payments(appId, locId);
        const cardInstance = await payments.card({
          style: {
            input: {
              fontSize: "16px",
              color: "#2B1810",
              backgroundColor: "transparent",
            },
            "input.is-focus": {
              color: "#2B1810",
            },
            "input.is-error": {
              color: "#D64545",
            },
            "input::placeholder": {
              color: "rgba(43, 24, 16, 0.4)",
            },
          },
        });
        await cardInstance.attach(cardContainerRef.current);
        if (mounted) setCard(cardInstance);
      } catch (e: any) {
        console.error("[Square] init failed", e);
        if (mounted) setError(e.message || "Failed to load payment form");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [scriptLoaded, card]);

  async function handlePay() {
    if (!card || disabled) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await card.tokenize();
      if (result.status === "OK") {
        await onTokenReady(result.token);
      } else {
        const msg = result.errors?.[0]?.message || "Tokenization failed";
        setError(msg);
      }
    } catch (e: any) {
      setError(e.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Script
        src="https://web.squarecdn.com/v1/square.js"
        onLoad={() => setScriptLoaded(true)}
        strategy="afterInteractive"
      />
      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
        <CreditCard className="h-3 w-3" />
        {locale === "es" ? "Tarjeta" : "Card"}
      </label>
      <div
        ref={cardContainerRef}
        className="mt-2 min-h-[60px] rounded-2xl border border-canela/30 bg-cream p-3"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handlePay}
        disabled={!card || submitting || disabled}
        className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting
          ? locale === "es"
            ? "Procesando…"
            : "Processing…"
          : locale === "es"
          ? `Pagar $${(totalCents / 100).toFixed(2)} CAD`
          : `Pay $${(totalCents / 100).toFixed(2)} CAD`}
      </button>
      <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-ink-soft">
        {locale === "es" ? "Pago seguro vía Square" : "Secure payment via Square"}
      </p>
    </div>
  );
}