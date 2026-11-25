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
            q: "¿Qué es el Karyana Club?",
            a: "Es un juego de niveles, no una membresía. No se paga nada y no hay cuota.\n\nCada vez que compras ganas créditos KLC, y los créditos te suben de nivel: Básico, Artesano, Selecto y Legendario. Cada nivel desbloquea beneficios — menos espera en tus pasteles, envío gratis, acceso a cosas que no están abiertas al público.\n\nLos KLC no son dinero y no se canjean por productos. Solo sirven para subir de nivel. Los puntos de Karyana son otra cosa distinta y siguen igual: 100 puntos = $1.",
          },
          {
            q: "¿Cómo subo de nivel?",
            a: "Hay cinco formas, y ninguna es pagar:\n\n• Comprar: cada compra válida suma.\n• Gastar: los pedidos más grandes suman más.\n• Quedarte: cada año con nosotros suma.\n• Invitar: cuando la persona que invitaste hace su primera compra.\n• Descubrir: la primera vez que pruebas una familia nueva — conchas, pan tradicional, pasteles, postres.\n\nInvitar y descubrir tienen un límite anual, para que el Club siga premiando sobre todo a quien regresa a comprar. Y Legendario pide además compras tuyas en días distintos: no se llega ahí solo con referidos.",
          },
          {
            q: "¿Qué pasa si dejo de comprar?",
            a: "No pierdes tu nivel de un día para otro. Los créditos cuentan mientras son recientes, y cuando dejan de alcanzar tienes un periodo de gracia antes de bajar.\n\nTe avisamos antes, nunca después, y nunca bajas más de un nivel a la vez. Una sola compra renueva tu nivel. Tus puntos acumulados no se tocan.",
          },
        ]
      : [
          {
            q: "What is the Karyana Club?",
            a: "It's a game of levels, not a membership. There is nothing to pay and no fee.\n\nEvery time you buy you earn KLC credits, and credits move you up: Básico, Artesano, Selecto and Legendario. Each level unlocks something — less waiting on your cakes, free delivery, access to things that aren't open to the public.\n\nKLC are not money and cannot be exchanged for products. They only move you up a level. Karyana points are a separate thing and work exactly as before: 100 points = $1.",
          },
          {
            q: "How do I move up?",
            a: "Five ways, and none of them is paying:\n\n• Buy: every valid purchase counts.\n• Spend: bigger orders count for more.\n• Stay: each year with us counts.\n• Refer: when the person you invited makes their first purchase.\n• Explore: the first time you try a new family — conchas, traditional bread, cakes, desserts.\n\nReferring and exploring have a yearly cap, so the Club keeps rewarding the people who come back to buy. And Legendario also asks for purchases of your own on different days: you can't get there on referrals alone.",
          },
          {
            q: "What happens if I stop buying?",
            a: "You don't lose your level overnight. Credits count while they are recent, and when they no longer add up you get a grace period before anything changes.\n\nWe tell you before, never after, and you never drop more than one level at a time. A single order renews it. Your accumulated points are untouched.",
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
