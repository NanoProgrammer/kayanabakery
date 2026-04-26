import type { Metadata } from "next";
import { Fraunces, Inter, Caveat } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Karyana Bakery — More than bread, a home memory",
  description:
    "Handcrafted Mexican bakery in Calgary. Conchas, tres leches, churros, and traditional pan dulce made with love since 2018.",
  openGraph: {
    title: "Karyana Bakery",
    description:
      "More than bread, a home memory. Handcrafted Mexican pan dulce in Calgary.",
    type: "website",
    locale: "en_CA",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${caveat.variable}`}
    >
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <CartDrawer />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
