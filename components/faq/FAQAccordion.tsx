"use client";

import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import type { FAQ } from "@/types";

const CATEGORIES = [
  { value: "general", labelEn: "General", labelEs: "General" },
  { value: "orders", labelEn: "Orders", labelEs: "Órdenes" },
  { value: "delivery", labelEn: "Delivery", labelEs: "Envíos" },
  { value: "custom-cakes", labelEn: "Custom Cakes", labelEs: "Pasteles" },
  { value: "memberships", labelEn: "Memberships", labelEs: "Membresías" },
  { value: "payment", labelEn: "Payment", labelEs: "Pago" },
];

export function FAQAccordion({ faqs }: { faqs: FAQ[] }) {
  const { locale } = useLocale();
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      activeCat
        ? faqs.filter((f) => f.category === activeCat)
        : faqs,
    [activeCat, faqs]
  );

  // Only show categories that have entries
  const usedCategories = CATEGORIES.filter((c) =>
    faqs.some((f) => f.category === c.value)
  );

  return (
    <section className="container-bakery pb-24">
      {/* Tabs */}
      {usedCategories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCat(null)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-medium transition-all",
              !activeCat
                ? "border-canela bg-canela text-ink"
                : "border-canela/30 bg-cream hover:bg-canela-light"
            )}
          >
            {locale === "es" ? "Todo" : "All"}
          </button>
          {usedCategories.map((c) => (
            <button
              key={c.value}
              onClick={() => setActiveCat(c.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-medium transition-all",
                activeCat === c.value
                  ? "border-canela bg-canela text-ink"
                  : "border-canela/30 bg-cream hover:bg-canela-light"
              )}
            >
              {locale === "es" ? c.labelEs : c.labelEn}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-20 text-center text-ink-soft">
          {locale === "es" ? "Sin preguntas todavía." : "No questions yet."}
        </p>
      ) : (
        <div className="mx-auto max-w-3xl space-y-3">
          {filtered.map((f) => {
            const q =
              (locale === "es" && f.questionEs) || f.questionEn;
            const a =
              (locale === "es" && f.answerEs) || f.answerEn;
            const isOpen = openId === f._id;
            return (
              <div
                key={f._id}
                className="overflow-hidden rounded-2xl border border-canela/15 bg-cream"
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : f._id)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium">{q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="whitespace-pre-line border-t border-canela/15 px-6 py-5 text-sm leading-relaxed text-ink-soft">
                    {a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
