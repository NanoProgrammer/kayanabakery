"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

/**
 * Says the account was created.
 *
 * Registration used to sign the customer in and drop them on this page with
 * nothing said, so there was no moment where the site confirmed the account
 * existed — people filled the form, landed somewhere unfamiliar, and had no
 * reason to believe it had worked.
 */
export function WelcomeBanner() {
  const { locale } = useLocale();
  const params = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || params.get("welcome") !== "1") return null;

  const es = locale === "es";

  return (
    <div
      role="status"
      className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4"
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-green-900">
          {es ? "¡Tu cuenta quedó creada!" : "Your account is set up!"}
        </p>
        <p className="mt-1 text-sm text-green-900">
          {es
            ? "Ya puedes pedir, guardar tus direcciones y juntar puntos en cada orden."
            : "You can order now, save your addresses, and earn points on every order."}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={es ? "Cerrar" : "Dismiss"}
        className="shrink-0 rounded-full p-1 text-green-900/60 hover:bg-green-100 hover:text-green-900"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
