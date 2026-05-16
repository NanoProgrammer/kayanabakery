"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ShoppingBag, User, Menu, X, Crown } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/lib/store/cart-store";
import { useLocale } from "@/lib/i18n/locale-provider";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { CategoryDropdown } from "@/components/layout/CategoryDropdown";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: session } = useSession();
  const itemCount = useCartStore((s) => s.getItemCount());
  const setOpen = useCartStore((s) => s.setOpen);
  const { t } = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const tier = (session?.user as any)?.tier as string | undefined;
  const isMember =
    tier && tier !== "BASICO" && tier !== "EMBAJADOR";

  return (
    <header className="sticky top-0 z-40 border-b border-canela/15 bg-cream/90 backdrop-blur-md">
      <div className="container-bakery flex h-20 items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Karyana Bakery"
          className="flex items-center gap-3"
        >
          <Image
            src="/logo.png"
            alt="Karyana Ruiz Bakery"
            width={60}
            height={60}
            priority
            className="h-12 w-12 object-contain"
          />
          <div className="hidden flex-col leading-tight md:flex">
            <span className="font-display text-lg tracking-tight">
              Karyana Ruiz
            </span>
            <span className="font-script text-base text-canela-dark">
              Bakery
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 text-sm font-medium lg:flex">
          <Link href="/shop" className="link-underline">
            {t("nav.shop")}
          </Link>
          {/* Dynamic categories dropdown — replaces hardcoded Conchas/Cakes */}
          <CategoryDropdown />
          <Link href="/memberships" className="link-underline flex items-center gap-1">
            <Crown className="h-3.5 w-3.5 text-gold" />
            {t("nav.memberships")}
          </Link>
          <Link href="/events" className="link-underline">
            {t("nav.events")}
          </Link>
          <Link href="/about" className="link-underline">
            {t("nav.about")}
          </Link>
          <Link href="/contact" className="link-underline">
            {t("nav.contact")}
          </Link>
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-3">
          <LanguageToggle className="hidden sm:inline-flex" />

          {/* Account */}
          <div className="relative">
            {session ? (
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-canela/30 bg-cream px-3 py-1.5 text-xs font-medium hover:bg-canela-light"
                aria-label="Account menu"
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden md:inline">
                  {session.user?.name?.split(" ")[0] || t("common.account")}
                </span>
                {isMember && (
                  <Crown className="h-3 w-3 text-gold" />
                )}
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-full border border-canela/30 px-3 py-1.5 text-xs font-medium hover:bg-canela-light"
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{t("common.signIn")}</span>
              </Link>
            )}

            {accountOpen && session && (
              <div
                onMouseLeave={() => setAccountOpen(false)}
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-canela/20 bg-cream shadow-lg"
              >
                <Link
                  href="/account"
                  className="block px-4 py-2.5 text-sm hover:bg-canela-light"
                  onClick={() => setAccountOpen(false)}
                >
                  {t("account.overview")}
                </Link>
                <Link
                  href="/account/orders"
                  className="block px-4 py-2.5 text-sm hover:bg-canela-light"
                  onClick={() => setAccountOpen(false)}
                >
                  {t("account.orders")}
                </Link>
                <Link
                  href="/account/membership"
                  className="block px-4 py-2.5 text-sm hover:bg-canela-light"
                  onClick={() => setAccountOpen(false)}
                >
                  {t("account.membership")}
                </Link>
                {(session.user as any)?.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="block border-t border-canela/15 px-4 py-2.5 text-sm font-medium text-canela-dark hover:bg-canela-light"
                    onClick={() => setAccountOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="block w-full border-t border-canela/15 px-4 py-2.5 text-left text-sm hover:bg-canela-light"
                >
                  {t("common.signOut")}
                </button>
              </div>
            )}
          </div>

          {/* Cart */}
          <button
            onClick={() => setOpen(true)}
            className="relative inline-flex items-center justify-center rounded-full bg-canela px-3.5 py-2 text-ink transition-all hover:bg-canela-dark"
            aria-label="Open cart"
          >
            <ShoppingBag className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-cream">
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile burger */}
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div
          className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute right-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-cream p-6 shadow-2xl transition-transform",
            mobileOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="mb-8 flex items-center justify-between">
            <span className="font-display text-2xl">Menu</span>
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 text-lg">
            {[
              { href: "/shop", label: t("nav.shop") },
              { href: "/memberships", label: t("nav.memberships") },
              { href: "/events", label: t("nav.events") },
              { href: "/ambassador", label: t("nav.ambassador") },
              { href: "/faq", label: t("nav.faq") },
              { href: "/how-to-order", label: t("nav.howToOrder") },
              { href: "/refer-a-friend", label: t("nav.referAFriend") },
              { href: "/about", label: t("nav.about") },
              { href: "/contact", label: t("nav.contact") },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-3 hover:bg-canela-light"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 border-t border-canela/15 pt-6">
            <LanguageToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
