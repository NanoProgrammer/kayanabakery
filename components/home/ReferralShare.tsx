"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { toast } from "sonner";

export function ReferralShare({ code }: { code: string }) {
  const { locale } = useLocale();
  const [copied, setCopied] = useState(false);

  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(locale === "es" ? "Copiado!" : "Copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Karyana Bakery",
          text:
            locale === "es"
              ? `Get $10 off at Karyana Bakery — usa mi código: ${code}`
              : `Get $10 off at Karyana Bakery — use my code: ${code}`,
          url,
        });
      } catch {}
    } else {
      copy();
    }
  }

  return (
    <div className="rounded-3xl border border-canela/15 bg-cream p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
        {locale === "es" ? "Tu código" : "Your code"}
      </p>
      <p className="mt-2 font-mono text-3xl tracking-widest">{code.toUpperCase()}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          readOnly
          value={url}
          className="flex-1 rounded-full border border-canela/30 bg-cream px-5 py-3 text-sm"
        />
        <button onClick={copy} className="btn-ghost">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? (locale === "es" ? "Copiado" : "Copied") : (locale === "es" ? "Copiar" : "Copy")}
        </button>
        <button onClick={nativeShare} className="btn-primary">
          <Share2 className="h-4 w-4" />
          {locale === "es" ? "Compartir" : "Share"}
        </button>
      </div>
    </div>
  );
}
