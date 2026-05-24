"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Heart } from "lucide-react";

export function Footer() {
  const { locale } = useLocale();

  const shopLinks = [
    { href: "/shop", label: locale === "es" ? "Tienda" : "Shop" },
    { href: "/category/conchas", label: "Conchas" },
    { href: "/category/cakes", label: locale === "es" ? "Pasteles" : "Cakes" },
    { href: "/category/churros", label: "Churros" },
    {
      href: "/category/traditional-mexican-bread",
      label: locale === "es" ? "Pan tradicional" : "Traditional bread",
    },
    {
      href: "/category/boxes",
      label: locale === "es" ? "Cajas" : "Boxes",
    },
  ];

  const aboutLinks = [
    { href: "/about", label: locale === "es" ? "Nosotros" : "About us" },
    { href: "/events", label: locale === "es" ? "Eventos" : "Events" },
    { href: "/memberships", label: locale === "es" ? "Membresías" : "Memberships" },
    {
      href: "/refer-a-friend",
      label: locale === "es" ? "Refiere un amigo" : "Refer a friend",
    },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: locale === "es" ? "Contacto" : "Contact" },
  ];

  const helpLinks = [
    {
      href: "/how-to-order",
      label: locale === "es" ? "Cómo ordenar" : "How to order",
    },
    {
      href: "/track",
      label: locale === "es" ? "Rastrear orden" : "Track order",
    },
    {
      href: "/account",
      label: locale === "es" ? "Mi cuenta" : "My account",
    },
  ];

  return (
    <footer className="border-t border-canela/15 bg-masa/40">
      <div className="container-bakery py-16 md:py-20">
        {/* Top: brand + columns */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="font-display text-2xl text-ink">
              Karyana
              <span className="ml-1 text-sm font-normal text-canela">
                Bakery
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
              {locale === "es"
                ? "Más que pan, un recuerdo de casa. Pan mexicano artesanal horneado con amor en Calgary desde 2018."
                : "More than bread, a home memory. Handmade Mexican bread baked with love in Calgary since 2018."}
            </p>
            <p className="mt-4 text-xs text-ink-soft">Calgary, AB 🇨🇦</p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-canela-dark">
              {locale === "es" ? "Tienda" : "Shop"}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {shopLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-ink-soft transition-colors hover:text-canela-dark"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-canela-dark">
              {locale === "es" ? "Karyana" : "Karyana"}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {aboutLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-ink-soft transition-colors hover:text-canela-dark"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-canela-dark">
              {locale === "es" ? "Ayuda" : "Help"}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {helpLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-ink-soft transition-colors hover:text-canela-dark"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Dicho */}
        <div className="mt-14 border-t border-canela/15 pt-8 text-center">
          <p className="font-script text-xl text-canela-dark">
            "Las penas con pan son menos."
          </p>
        </div>

        {/* Bottom */}
        <div className="mt-6 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between">
          <p className="text-[11px] uppercase tracking-widest text-ink-soft">
            © {new Date().getFullYear()} Karyana Bakery.{" "}
            {locale === "es"
              ? "Todos los derechos reservados."
              : "All rights reserved."}
          </p>
          <p className="inline-flex items-center gap-1 text-[11px] text-ink-soft">
            {locale === "es" ? "Hecho con" : "Made with"}
            <Heart className="h-3 w-3 fill-otomi-red text-otomi-red" />
            {locale === "es" ? "en Calgary" : "in Calgary"}
          </p>
        </div>
      </div>
    </footer>
  );
}