"use client";

import { useLocale } from "@/lib/i18n/locale-provider";
import { Globe } from "lucide-react";

export function LanguageToggle({
  className = "",
  compact = false,
}: {
  className?: string;
  /** Drops the globe and tightens the padding, for the phone bar where
   *  every pixel is competing with the logo. */
  compact?: boolean;
}) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-canela/30 bg-cream p-0.5 text-xs ${className}`}
    >
      {!compact && <Globe className="ml-2 h-3.5 w-3.5 text-canela-dark" />}
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-full ${compact ? "px-2" : "px-2.5"} py-1 font-medium transition-colors ${
          locale === "en"
            ? "bg-canela text-ink"
            : "text-ink/60 hover:text-ink"
        }`}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("es")}
        className={`rounded-full ${compact ? "px-2" : "px-2.5"} py-1 font-medium transition-colors ${
          locale === "es"
            ? "bg-canela text-ink"
            : "text-ink/60 hover:text-ink"
        }`}
        aria-pressed={locale === "es"}
      >
        ES
      </button>
    </div>
  );
}
