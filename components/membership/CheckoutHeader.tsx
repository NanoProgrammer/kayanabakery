"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
    </>
  );
}
