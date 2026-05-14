"use client";

import {
  Crown,
  Truck,
  Star,
  Cake,
  Calendar,
  Tag,
  Gift,
  Coins,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

export function MembershipBenefitsGrid() {
  const { locale } = useLocale();

  const benefits = [
    {
      icon: Crown,
      title: locale === "es" ? "Acceso premium" : "Premium access",
      desc:
        locale === "es"
          ? "Productos exclusivos, fuera de temporada y agotados"
          : "Exclusive, off-season, and out-of-stock items",
    },
    {
      icon: Truck,
      title: locale === "es" ? "Envío gratis" : "Free delivery",
      desc:
        locale === "es"
          ? "Sin costo de envío con orden mínima"
          : "Zero delivery fees with minimum order",
    },
    {
      icon: Coins,
      title: locale === "es" ? "Hasta 5x puntos" : "Up to 5x points",
      desc:
        locale === "es"
          ? "Acumula más rápido en cada compra"
          : "Earn rewards faster on every order",
    },
    {
      icon: Cake,
      title: locale === "es" ? "Pan nuevo gratis" : "Free new breads",
      desc:
        locale === "es"
          ? "Prueba primero los lanzamientos del mes"
          : "First taste of every new release",
    },
    {
      icon: Calendar,
      title: locale === "es" ? "Saltar la semana" : "Skip the week",
      desc:
        locale === "es"
          ? "Pausa tu orden cuando lo necesites"
          : "Pause your order whenever you need",
    },
    {
      icon: Gift,
      title:
        locale === "es" ? "Regalo de cumpleaños" : "Birthday gift",
      desc:
        locale === "es"
          ? "500 pts gratis en tu mes de cumpleaños"
          : "500 free points in your birthday month",
    },
    {
      icon: Tag,
      title: locale === "es" ? "Promos mensuales" : "Monthly promos",
      desc:
        locale === "es"
          ? "Cupones automáticos para miembros"
          : "Auto-applied member coupons",
    },
    {
      icon: Star,
      title: locale === "es" ? "Trato VIP" : "VIP treatment",
      desc:
        locale === "es"
          ? "Servicio personalizado y atención prioritaria"
          : "Personalized service and priority care",
    },
  ];

  return (
    <section className="bg-masa py-20">
      <div className="container-bakery">
        <div className="mb-12 max-w-2xl">
          <span className="eyebrow">
            {locale === "es" ? "Por qué unirte" : "Why join"}
          </span>
          <h2 className="section-title mt-2">
            {locale === "es" ? (
              <>
                Más que pan,{" "}
                <span className="font-script gold-text">una experiencia.</span>
              </>
            ) : (
              <>
                More than bread,{" "}
                <span className="font-script gold-text">an experience.</span>
              </>
            )}
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-canela/15 bg-cream p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-canela-light">
                <b.icon className="h-5 w-5 text-canela-dark" />
              </div>
              <h3 className="font-display text-lg">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
