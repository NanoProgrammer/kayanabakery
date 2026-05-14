"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";

export function Footer({
  contactEmail,
  contactPhone,
  pickupAddress,
}: {
  contactEmail?: string;
  contactPhone?: string;
  pickupAddress?: string;
}) {
  const { t, locale } = useLocale();
  const tagline = t("footer.tagline");

  return (
    <footer className="relative mt-32 overflow-hidden border-t border-canela/15 bg-masa">
      <div className="grain absolute inset-0" />
      <div className="container-bakery relative grid gap-14 py-20 md:grid-cols-12">
        {/* Brand */}
        <div className="md:col-span-5">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Karyana Ruiz Bakery"
              width={64}
              height={64}
              className="h-16 w-16 object-contain"
            />
            <div>
              <p className="font-display text-2xl">Karyana Ruiz</p>
              <p className="font-script text-xl text-canela-dark">Bakery</p>
            </div>
          </div>
          <p className="mt-6 max-w-sm font-script text-2xl text-ink">
            {tagline}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-ink-soft">
            Est. 2018
          </p>

          <div className="mt-8 space-y-3 text-sm text-ink-soft">
            {pickupAddress && (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-canela-dark" />
                <span>{pickupAddress}</span>
              </p>
            )}
            {contactPhone && (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-canela-dark" />
                <a href={`tel:${contactPhone}`} className="hover:text-ink">
                  {contactPhone}
                </a>
              </p>
            )}
            {contactEmail && (
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-canela-dark" />
                <a href={`mailto:${contactEmail}`} className="hover:text-ink">
                  {contactEmail}
                </a>
              </p>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <a
              href="https://instagram.com/karyanabakery"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-canela transition-transform hover:scale-110"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4 text-ink" />
            </a>
          </div>
        </div>

        {/* Shop */}
        <div className="md:col-span-2">
          <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.2em]">
            {t("footer.shop")}
          </h4>
          <ul className="space-y-2.5 text-sm text-ink-soft">
            <li>
              <Link href="/shop" className="hover:text-ink">
                {t("nav.shop")}
              </Link>
            </li>
            <li>
              <Link href="/category/conchas" className="hover:text-ink">
                {t("nav.conchas")}
              </Link>
            </li>
            <li>
              <Link href="/category/cakes" className="hover:text-ink">
                {t("nav.cakes")}
              </Link>
            </li>
            <li>
              <Link href="/memberships" className="hover:text-ink">
                {t("nav.memberships")}
              </Link>
            </li>
            <li>
              <Link href="/events" className="hover:text-ink">
                {t("nav.events")}
              </Link>
            </li>
          </ul>
        </div>

        {/* Help */}
        <div className="md:col-span-2">
          <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.2em]">
            {t("footer.help")}
          </h4>
          <ul className="space-y-2.5 text-sm text-ink-soft">
            <li>
              <Link href="/faq" className="hover:text-ink">
                {t("nav.faq")}
              </Link>
            </li>
            <li>
              <Link href="/how-to-order" className="hover:text-ink">
                {t("nav.howToOrder")}
              </Link>
            </li>
            <li>
              <Link href="/track-order" className="hover:text-ink">
                {locale === "es" ? "Rastrear orden" : "Track order"}
              </Link>
            </li>
            <li>
              <Link href="/refer-a-friend" className="hover:text-ink">
                {t("nav.referAFriend")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-ink">
                {t("nav.contact")}
              </Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div className="md:col-span-3">
          <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.2em]">
            {t("footer.company")}
          </h4>
          <ul className="space-y-2.5 text-sm text-ink-soft">
            <li>
              <Link href="/about" className="hover:text-ink">
                {t("nav.about")}
              </Link>
            </li>
            <li>
              <Link href="/ambassador" className="hover:text-ink">
                {t("nav.ambassador")}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-ink">
                {locale === "es" ? "Privacidad" : "Privacy"}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-ink">
                {locale === "es" ? "Términos" : "Terms"}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="container-bakery relative flex flex-col items-center justify-between gap-3 border-t border-canela/15 py-6 text-xs text-ink-soft md:flex-row">
        <p>
          © {new Date().getFullYear()} Karyana Ruiz Bakery — {t("footer.rights")}
        </p>
        <p className="font-script text-base text-canela-dark">{tagline}</p>
      </div>
    </footer>
  );
}
