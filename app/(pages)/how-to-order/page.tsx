"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Search, ShoppingBag, Calendar, Truck } from "lucide-react";

export default function HowToOrderPage() {
  const { locale } = useLocale();

  const steps = [
    {
      icon: Search,
      title: locale === "es" ? "1. Explora" : "1. Browse",
      desc:
        locale === "es"
          ? "Mira el menú completo, conchas, pasteles, y especialidades de temporada."
          : "Check out the full menu — conchas, cakes, and seasonal specialties.",
    },
    {
      icon: ShoppingBag,
      title: locale === "es" ? "2. Agrega al carrito" : "2. Add to cart",
      desc:
        locale === "es"
          ? "Selecciona cantidad. Algunos pasteles necesitan 24h de anticipación."
          : "Pick your quantity. Some cakes need 24h advance notice.",
    },
    {
      icon: Calendar,
      title:
        locale === "es" ? "3. Elige cuándo" : "3. Pick when",
      desc:
        locale === "es"
          ? "Recoge en el horario que te convenga, o pide envío (Lun 6-8pm, Vie 7-9pm)."
          : "Pick up at a time that works for you, or schedule delivery (Mon 6-8pm, Fri 7-9pm).",
    },
    {
      icon: Truck,
      title:
        locale === "es" ? "4. Listo" : "4. Done",
      desc:
        locale === "es"
          ? "Pagas seguro con Square, recibes confirmación y tu pan está listo."
          : "Pay securely via Square, get a confirmation, and your bread is ready.",
    },
  ];

  return (
    <div className="container-bakery py-16 md:py-20">
      <header className="mb-12 max-w-2xl">
        <span className="eyebrow">
          {locale === "es" ? "Cómo ordenar" : "How to order"}
        </span>
        <h1 className="section-title mt-2">
          {locale === "es" ? "Fácil," : "Easy,"}{" "}
          <span className="font-script text-canela-dark">
            {locale === "es" ? "rápido," : "quick,"}
          </span>
          {locale === "es" ? " y delicioso." : " and delicious."}
        </h1>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-canela/15 bg-cream p-6"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-canela-light">
              <s.icon className="h-5 w-5 text-canela-dark" />
            </div>
            <h3 className="font-display text-lg">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-3xl bg-canela-light p-8 md:p-12">
        <h2 className="font-display text-2xl md:text-3xl">
          {locale === "es"
            ? "¿Vives en Sureste de Calgary?"
            : "Live in Southeast Calgary?"}
        </h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          {locale === "es"
            ? "Tu primer envío es gratis. Y si te haces miembro, tienes envío gratis siempre (con orden mínima)."
            : "Your first delivery is free. And if you become a member, you get free delivery always (with minimum order)."}
        </p>
        <Link href="/memberships" className="btn-gold mt-6 inline-flex">
          {locale === "es" ? "Ver membresías" : "See memberships"}
        </Link>
      </div>
    </div>
  );
}
