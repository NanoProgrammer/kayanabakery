import type { Metadata } from "next";
import { Inter, Fraunces, Caveat, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { getServerLocale } from "@/lib/i18n/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { PopupBannerProvider } from "@/components/layout/PopupBannerProvider";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  siteSettingsQuery,
  activePopupBannerQuery,
} from "@/sanity/lib/queries";
import type { SiteSettings, PopupBanner } from "@/types";
import { auth } from "@/lib/auth/auth";
import { SessionProvider } from "next-auth/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Karyana Bakery — More than bread, a home memory",
    template: "%s · Karyana Bakery",
  },
  description:
    "Authentic Mexican bread baked in Calgary. Conchas, custom cakes, and traditional pan dulce delivered with love.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "Karyana Bakery",
    description: "More than bread, a home memory.",
    type: "website",
    locale: "en_CA",
    images: ["/logo.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, settings, popup, session] = await Promise.all([
    getServerLocale(),
    sanityFetch<SiteSettings>({
      query: siteSettingsQuery,
      tags: ["siteSettings"],
    }),
    sanityFetch<PopupBanner | null>({
      query: activePopupBannerQuery,
      tags: ["popupBanner"],
    }).catch(() => null),
    auth(),
  ]);

  const announcements =
    locale === "es" && settings?.announcementBarEs?.length
      ? settings.announcementBarEs
      : settings?.announcementBar ?? [];

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${fraunces.variable} ${caveat.variable} ${geistMono.variable}`}
    >
      <body className="bg-cream text-ink antialiased">
        <SessionProvider session={session}>
          <LocaleProvider initial={locale}>
            {announcements.length > 0 && (
              <AnnouncementBar messages={announcements} />
            )}
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer
              contactEmail={settings?.contactEmail}
              contactPhone={settings?.contactPhone}
              pickupAddress={settings?.pickupAddress}
            />
            <CartDrawer />
            {popup && <PopupBannerProvider banner={popup} />}
            <Toaster position="bottom-right" richColors />
          </LocaleProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
