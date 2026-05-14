"use client";

import { Coins, Truck, Gift, Crown, Star, Calendar } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

export function AmbassadorPerks() {
  const { locale } = useLocale();

  const perks = [
    {
      icon: Coins,
      title: locale === "es" ? "10x puntos en cada compra" : "10x points on every order",
      desc: locale === "es"
        ? "El multiplicador más alto disponible"
        : "The highest multiplier available",
    },
    {
      icon: Truck,
      title: locale === "es" ? "Pago por entregas" : "Paid for deliveries",
      desc: locale === "es"
        ? "$8–$10 por cada entrega que hagas a otros miembros"
        : "$8–$10 per delivery you do for other members",
    },
    {
      icon: Crown,
      title: locale === "es" ? "Acceso total" : "Full access",
      desc: locale === "es"
        ? "Productos agotados, fuera de temporada y exclusivos"
        : "Out-of-stock, off-season, and exclusive items",
    },
    {
      icon: Gift,
      title: locale === "es" ? "Pan nuevo cada semana" : "New bread every week",
      desc: locale === "es"
        ? "Hasta 4 panes nuevos al mes para probar"
        : "Up to 4 new breads per month to try",
    },
    {
      icon: Star,
      title: locale === "es" ? "Trato VIP" : "VIP treatment",
      desc: locale === "es"
        ? "Servicio personalizado y atención prioritaria"
        : "Personalized service and priority care",
    },
    {
      icon: Calendar,
      title: locale === "es" ? "Membresía gratis" : "Free membership",
      desc: locale === "es"
        ? "Sin costo (requiere aprobación)"
        : "No cost (requires approval)",
    },
  ];

  return (
    <section className="bg-masa py-20">
      <div className="container-bakery">
        <div className="mb-12 max-w-2xl">
          <span className="eyebrow">
            {locale === "es" ? "Beneficios" : "What you get"}
          </span>
          <h2 className="section-title mt-2">
            {locale === "es"
              ? "Más que una membresía,"
              : "More than a membership,"}{" "}
            <span className="font-script text-canela-dark">
              {locale === "es" ? "una colaboración." : "a partnership."}
            </span>
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {perks.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-canela/15 bg-cream p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-canela-light">
                <p.icon className="h-5 w-5 text-canela-dark" />
              </div>
              <h3 className="font-display text-lg">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
