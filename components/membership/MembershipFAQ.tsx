"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function MembershipFAQ() {
  const { locale } = useLocale();
  const [open, setOpen] = useState<number | null>(0);

  const items =
    locale === "es"
      ? [
          {
            q: "¿Cómo se cobran las membresías?",
            a: "Procesamos los pagos con Square. La tarjeta se carga automáticamente cada mes (Selecto, Legendario) o cada año (Artesano). Puedes cancelar cuando quieras.",
          },
          {
            q: "¿Qué pasa si cancelo?",
            a: "Mantienes los beneficios hasta el final del periodo facturado. Después regresas al plan Básico (gratis) sin perder los puntos acumulados.",
          },
          {
            q: "¿Cómo funcionan los puntos?",
            a: "100 puntos = $1 CAD. Ganas puntos en cada compra según tu tier (Básico 1x, Artesano 2x, Selecto 4x, Legendario 5x, Embajador 10x). Los puedes canjear directamente en el checkout.",
          },
          {
            q: "¿Cómo aplico para Embajador?",
            a: "Llena el formulario en /ambassador. Revisamos cada aplicación en 5 días hábiles. Buscamos personas que aman Karyana y quieran compartirlo con su comunidad.",
          },
          {
            q: "¿Puedo cambiar de plan?",
            a: "Sí, puedes hacer upgrade en cualquier momento desde tu cuenta. El cambio se aplica inmediatamente con prorrateo del periodo actual.",
          },
        ]
      : [
          {
            q: "How are memberships billed?",
            a: "We process payments through Square. Your card is auto-charged monthly (Selecto, Legendario) or yearly (Artesano). Cancel anytime.",
          },
          {
            q: "What happens if I cancel?",
            a: "You keep your benefits until the end of the billing period, then go back to Basico (free). Your accumulated points stay with you.",
          },
          {
            q: "How do points work?",
            a: "100 points = $1 CAD. Earn on every purchase based on your tier (Basico 1x, Artesano 2x, Selecto 4x, Legendario 5x, Embajador 10x). Redeem at checkout.",
          },
          {
            q: "How do I apply for Embajador?",
            a: "Fill out the form at /ambassador. We review applications within 5 business days. We look for people who love Karyana and want to share it with their community.",
          },
          {
            q: "Can I change plans?",
            a: "Yes, you can upgrade anytime from your account. Changes apply immediately with proration of the current period.",
          },
        ];

  return (
    <section className="container-bakery py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center font-display text-3xl md:text-4xl">
          {locale === "es"
            ? "Preguntas frecuentes"
            : "Frequently asked questions"}
        </h2>
        <div className="mt-10 space-y-3">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-canela/15 bg-cream"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-medium">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-canela/15 px-6 py-5 text-sm leading-relaxed text-ink-soft">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
