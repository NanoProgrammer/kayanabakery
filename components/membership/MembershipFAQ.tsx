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
            q: "¿Qué es Karyana 1% Club?",
            a: "Nuestra meta no es venderle a todo el mundo. Es ganarnos la lealtad del 1%.\n\nNo queremos ser la panadería de todos. Queremos ser tu panadería.\n\nKaryana 1% Club representa nuestro sueño de ganarnos la lealtad de tan solo el 1% de cada ciudad de la que Karyana llegue a formar parte. No queremos lograrlo siendo la panadería más grande, sino convirtiéndonos en una panadería a la que quieras volver.\n\nPorque para nosotros, ese 1% no es un número. Son personas. Son familias. Es nuestra comunidad.\n\nUna ciudad a la vez. Una comunidad a la vez. Un recuerdo a la vez.",
          },
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
            q: "What is the Karyana 1% Club?",
            a: "Our goal isn't to sell to everyone. It's to earn the loyalty of 1%.\n\nWe don't want to be everyone's bakery. We want to be your bakery.\n\nThe Karyana 1% Club represents our dream of earning the loyalty of just 1% of every city Karyana becomes part of. We don't want to do it by being the biggest bakery, but by becoming a bakery worth coming back to.\n\nBecause to us, that 1% isn't a number. It's people. It's families. It's our community.\n\nOne city at a time. One community at a time. One memory at a time.",
          },
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
                  <div className="whitespace-pre-line border-t border-canela/15 px-6 py-5 text-sm leading-relaxed text-ink-soft">
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
