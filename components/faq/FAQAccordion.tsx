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


const PAYMENT_SECURITY_FAQ: FAQ = {
  _id: "karyana-square-payment-security",
  category: "payment",
  questionEn: "How are payments processed at Karyana Bakery, and how is my card protected?",
  questionEs: "¿Cómo se procesan los pagos en Karyana Bakery y cómo se protege mi tarjeta?",
  answerEn:
    "Your peace of mind matters to us. Our card payments are processed through Square, a company specializing in electronic payments. Square encrypts sensitive payment data when transmitting and storing it, and meets PCI DSS Level 1, the payment card industry's data security standard. Square also restricts access to sensitive information and regularly tests its security systems. These measures help protect your card information when you pay with us. You can read more in Square's official security information below.",
  answerEs:
    "Tu tranquilidad nos importa. Nuestros pagos con tarjeta se procesan a través de Square, una empresa especializada en pagos electrónicos. Square cifra los datos sensibles de pago al transmitirlos y almacenarlos, y cumple con PCI DSS Nivel 1, el estándar de seguridad de datos de la industria de tarjetas de pago. También limita el acceso a la información sensible y realiza pruebas periódicas de sus sistemas de seguridad. Estas medidas ayudan a proteger la información de tu tarjeta cuando pagas con nosotros. Puedes conocer más en la información oficial de seguridad de Square que encontrarás a continuación.",
};

const SQUARE_SECURITY_URL =
  "https://squareup.com/help/ca/en/article/3797-secure-data-encryption";

export function FAQAccordion({ faqs }: { faqs: FAQ[] }) {
  const { locale } = useLocale();
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const allFaqs = useMemo(
    () => [...faqs.filter((f) => f._id !== PAYMENT_SECURITY_FAQ._id), PAYMENT_SECURITY_FAQ],
    [faqs]
  );

  const filtered = useMemo(
    () =>
      activeCat
        ? allFaqs.filter((f) => f.category === activeCat)
        : allFaqs,
    [activeCat, allFaqs]
  );

  // Only show categories that have entries
  const usedCategories = CATEGORIES.filter((c) =>
    allFaqs.some((f) => f.category === c.value)
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
                    {f._id === PAYMENT_SECURITY_FAQ._id && (
                      <a
                        href={SQUARE_SECURITY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 block font-medium text-ink underline underline-offset-4"
                      >
                        {locale === "es"
                          ? "Conoce cómo Square protege los datos de tu tarjeta (en inglés)"
                          : "Learn how Square protects your card information"}
                      </a>
                    )}
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
