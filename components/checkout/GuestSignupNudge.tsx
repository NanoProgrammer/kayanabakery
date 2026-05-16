"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Gift, UserPlus } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

export function GuestSignupNudge({
  show,
  onDismiss,
}: {
  show: boolean;
  onDismiss: () => void;
}) {
  const { locale } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      const dismissed = sessionStorage.getItem("karyana-guest-nudge-dismissed");
      if (!dismissed) {
        const t = setTimeout(() => setVisible(true), 600);
        return () => clearTimeout(t);
      }
    } else {
      setVisible(false);
    }
  }, [show]);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem("karyana-guest-nudge-dismissed", "1");
    onDismiss();
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-cream shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-full p-2 hover:bg-canela-light"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="h-2 bg-gradient-to-r from-canela via-canela-dark to-canela" />
        <div className="p-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-canela-light">
            <Gift className="h-8 w-8 text-canela-dark" />
          </div>
          <h3 className="font-display text-2xl">
            {locale === "es"
              ? "¡Tu primer envío gratis!"
              : "Your first delivery free!"}
          </h3>
          <p className="mt-3 text-sm text-ink-soft">
            {locale === "es"
              ? "Crea una cuenta y tu primer envío es por nuestra cuenta. Además, ganarás puntos en cada compra."
              : "Create an account and your first delivery is on us. Plus, earn points on every order."}
          </p>
          <Link
            href="/register?callbackUrl=/checkout"
            className="btn-primary mt-6 inline-flex w-full items-center justify-center gap-2"
            onClick={dismiss}
          >
            <UserPlus className="h-4 w-4" />
            {locale === "es" ? "Crear cuenta" : "Create account"}
          </Link>
          <button
            onClick={dismiss}
            className="mt-3 w-full text-center text-xs text-ink-soft underline-offset-2 hover:underline"
          >
            {locale === "es" ? "Continuar como invitado" : "Continue as guest"}
          </button>
          <p className="mt-4 text-[10px] text-ink-soft">
            {locale === "es" ? "Envío invitados: $7 CAD" : "Guest delivery: $7 CAD"}
          </p>
        </div>
      </div>
    </div>
  );
}
