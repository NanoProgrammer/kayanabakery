"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";
import { CreditCard, Clock, AlertTriangle, Cake, Truck, Camera } from "lucide-react";

export default function CakeTermsPage() {
  const { locale } = useLocale();

  const sections = locale === "es" ? [
    {
      icon: CreditCard,
      title: "Pago primero, pastel después",
      body: "Todos los pasteles personalizados requieren pago completo por adelantado antes de que comience la producción. No se aceptan pagos parciales ni al momento de la entrega. Esto nos permite comprar ingredientes frescos y reservar tu fecha.",
    },
    {
      icon: Clock,
      title: "Tiempo de anticipación",
      body: "Los pasteles personalizados requieren un mínimo de 72 horas (3 días) de anticipación. Pasteles con diseños elaborados o más de 3 pisos pueden requerir hasta 7 días. Fechas populares (Día de las Madres, San Valentín, Navidad) se llenan rápido — reserva con al menos 2 semanas.",
    },
    {
      icon: Camera,
      title: "Imágenes de referencia, no copias exactas",
      body: "Aceptamos imágenes de referencia como inspiración, pero cada pastel es una pieza artesanal única. No garantizamos réplicas exactas de otros pasteles. Las variaciones de color, textura y proporción son parte del proceso artesanal y no se consideran defectos.",
    },
    {
      icon: Cake,
      title: "Sabores y rellenos",
      body: "Los sabores disponibles están listados en nuestro menú. Tres leches NO puede usarse en pasteles altos o de varios pisos. Si necesitas un sabor que no está en la lista, pregúntanos — intentaremos acomodarte. Los rellenos de mermelada son hechos a mano.",
    },
    {
      icon: Truck,
      title: "Entrega y recolección",
      body: "Los pasteles pueden recogerse en nuestro punto de recolección en Southeast Calgary o enviarse (sujeto a disponibilidad de horarios). El cliente asume la responsabilidad del pastel una vez que sale de nuestras manos. No nos hacemos responsables de daños durante el transporte si el cliente elige recoger.",
    },
    {
      icon: AlertTriangle,
      title: "Cancelaciones y cambios",
      body: "Cancelaciones con más de 72 horas de anticipación: reembolso del 80%. Cancelaciones con menos de 72 horas: sin reembolso (los ingredientes ya fueron comprados). Cambios menores de sabor o mensaje se aceptan hasta 48 horas antes. Cambios de diseño no se aceptan después de iniciar la producción.",
    },
  ] : [
    {
      icon: CreditCard,
      title: "Pay first, cake second",
      body: "All custom cakes require full payment upfront before production begins. No partial payments or pay-on-delivery. This allows us to purchase fresh ingredients and reserve your date.",
    },
    {
      icon: Clock,
      title: "Lead time",
      body: "Custom cakes require a minimum of 72 hours (3 days) advance notice. Cakes with elaborate designs or more than 3 tiers may require up to 7 days. Popular dates (Mother's Day, Valentine's, Christmas) fill up fast — book at least 2 weeks ahead.",
    },
    {
      icon: Camera,
      title: "Reference images, not exact copies",
      body: "We accept reference images as inspiration, but every cake is a unique artisan piece. We do not guarantee exact replicas of other cakes. Variations in color, texture, and proportion are part of the handmade process and are not considered defects.",
    },
    {
      icon: Cake,
      title: "Flavors and fillings",
      body: "Available flavors are listed in our menu. Tres leches CANNOT be used for tall cakes or multi-tier cakes. If you need a flavor not on the list, ask us — we'll try to accommodate. Jam fillings are handmade.",
    },
    {
      icon: Truck,
      title: "Delivery and pickup",
      body: "Cakes can be picked up at our Southeast Calgary location or delivered (subject to slot availability). The customer assumes responsibility once the cake leaves our hands. We are not responsible for damage during transport if the customer opts for pickup.",
    },
    {
      icon: AlertTriangle,
      title: "Cancellations and changes",
      body: "Cancellations 72+ hours before: 80% refund. Cancellations less than 72 hours: no refund (ingredients already purchased). Minor flavor or message changes accepted up to 48 hours before. Design changes not accepted after production starts.",
    },
  ];

  return (
    <div className="container-bakery py-16 md:py-20">
      <header className="mb-12 max-w-3xl">
        <span className="eyebrow">
          {locale === "es" ? "Pasteles personalizados" : "Custom cakes"}
        </span>
        <h1 className="section-title mt-2">
          {locale === "es" ? "Términos para " : "Cake order "}
          <span className="font-script text-canela-dark">
            {locale === "es" ? "pasteles." : "terms."}
          </span>
        </h1>
        <p className="mt-4 text-ink-soft">
          {locale === "es"
            ? "Lee estos términos antes de ordenar un pastel personalizado. Al enviar tu solicitud, aceptas estas condiciones."
            : "Please read these terms before ordering a custom cake. By submitting your request, you agree to these conditions."}
        </p>
      </header>

      <div className="mx-auto max-w-3xl space-y-6">
        {sections.map((s, i) => (
          <div key={i} className="rounded-2xl border border-canela/15 bg-cream p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canela-light">
                <s.icon className="h-5 w-5 text-canela-dark" />
              </div>
              <div>
                <h3 className="font-display text-lg">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-3xl bg-canela-light p-8 md:p-12 text-center">
        <h2 className="font-display text-2xl md:text-3xl">
          {locale === "es" ? "¿Lista para ordenar?" : "Ready to order?"}
        </h2>
        <p className="mt-3 text-ink-soft">
          {locale === "es"
            ? "Llena nuestra forma de pastel personalizado y te contactamos en menos de 24 horas."
            : "Fill out our custom cake form and we'll get back to you within 24 hours."}
        </p>
        <Link href="/custom-cake" className="btn-primary mt-6 inline-flex">
          {locale === "es" ? "Ordenar pastel" : "Order a cake"}
        </Link>
      </div>

      <div className="mt-10 flex gap-4 justify-center text-xs">
        <Link href="/terms" className="text-ink-soft underline hover:text-ink">
          {locale === "es" ? "Términos generales" : "General terms"}
        </Link>
        <Link href="/privacy" className="text-ink-soft underline hover:text-ink">
          {locale === "es" ? "Privacidad" : "Privacy"}
        </Link>
      </div>
    </div>
  );
}
