"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ReferralShare({
  link,
  code,
}: {
  link: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 overflow-hidden rounded-full border border-canela/20 bg-cream px-5 py-3 text-sm text-ink/70">
          {link}
        </div>
        <button
          onClick={copy}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-canela px-6 py-3 text-sm font-medium text-cream transition-all hover:bg-canela-dark"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy link
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-ink/50">
        Your code:{" "}
        <span className="font-mono font-semibold text-canela">{code}</span>
      </p>
    </div>
  );
}
