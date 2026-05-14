"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

export function Newsletter() {
  const { t, locale } = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, language: locale }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="container-bakery py-24">
      <div className="overflow-hidden rounded-3xl bg-ink p-10 text-cream md:p-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-cream/10 px-3 py-1 text-xs uppercase tracking-[0.25em]">
              {t("home.newsletterEyebrow")}
            </span>
            <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
              {t("home.newsletterTitle")}{" "}
              <span className="font-script text-canela">
                {t("home.newsletterTitleAccent")}
              </span>
            </h2>
            <p className="mt-4 text-base text-cream/80">
              {t("home.newsletterSubtitle")}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("home.newsletterPlaceholder")}
                className="flex-1 rounded-full border border-cream/20 bg-transparent px-6 py-3.5 text-sm placeholder:text-cream/50 focus:border-canela focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-canela px-7 py-3.5 text-sm font-medium text-ink transition-all hover:bg-canela-dark disabled:opacity-60"
              >
                {status === "success" ? (
                  <>
                    <Check className="h-4 w-4" />
                    {t("home.newsletterSubscribed")}
                  </>
                ) : status === "loading" ? (
                  t("common.loading")
                ) : (
                  <>
                    {t("home.newsletterCta")}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-cream/60">
              {t("home.newsletterDisclaimer")}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
