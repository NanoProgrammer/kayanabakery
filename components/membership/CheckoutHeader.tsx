"use client";

import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck, EyeOff } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

export function CheckoutHeader({ isArtesano }: { isArtesano: boolean }) {
  const { locale } = useLocale();
  const es = locale === "es";

  return (
    <>
      <Link
        href="/memberships"
        className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-ink-soft hover:underline"
      >
        <ArrowLeft className="h-3 w-3" />
        {es ? "Volver a los planes" : "Back to plans"}
      </Link>

      <h1 className="mt-4 font-display text-4xl md:text-5xl">
        {isArtesano
          ? es ? "Empieza tu año gratis" : "Start your free year"
          : es ? "Completa tu suscripción" : "Complete your subscription"}
      </h1>

      <p className="mt-3 text-ink-soft">
        {isArtesano
          ? es
            ? "Agrega una tarjeta para activar tu membresía Artesano. No se te cobra hoy — tu primer año es completamente gratis."
            : "Add a card on file to activate your Artesano membership. You won't be charged today — your first year is completely free."
          : es
          ? "Ingresa tus datos de pago para activar tu membresía."
          : "Enter your payment details to activate your membership."}
      </p>

      <TrustStrip es={es} />
    </>
  );
}

/**
 * Says who handles the card and what happens to it, above the form rather
 * than under it — the moment someone hesitates is before typing a card
 * number, not after.
 *
 * Every line here is literally true of this checkout, which is the only
 * reason to show it: the card fields belong to Square's Web Payments SDK and
 * are rendered by Square, the number is tokenized in the browser and never
 * reaches this site's servers, and what gets stored is a Square token that
 * cannot be used anywhere else.
 */
function TrustStrip({ es }: { es: boolean }) {
  const points = [
    {
      icon: ShieldCheck,
      text: es ? "Pagos con Square" : "Payments by Square",
    },
    {
      icon: Lock,
      text: es ? "Conexión cifrada" : "Encrypted connection",
    },
    {
      icon: EyeOff,
      text: es
        ? "No guardamos tu tarjeta"
        : "We never store your card",
    },
  ];

  return (
    <div className="mt-5 rounded-2xl border border-canela/20 bg-canela-light/30 px-4 py-3">
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {points.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-2 text-xs font-medium text-ink sm:text-[13px]"
          >
            <Icon className="h-4 w-4 shrink-0 text-canela-dark" />
            {text}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-snug text-ink-soft">
        {es
          ? "Los datos de tu tarjeta viajan directo a Square y nunca pasan por nuestros servidores."
          : "Your card details go straight to Square and never pass through our servers."}
      </p>
    </div>
  );
}
