"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ShoppingBag, User, Menu, X, Crown, Search } from "lucide-react";
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
  const isMember = tier && tier !== "BASICO" && tier !== "EMBAJADOR";

  return (
    <header className="sticky z-10 top-0 left-0 right-0 z-[9999] overflow-visible border-b border-canela/15 bg-cream/90 ">
      <div className="container-bakery relative overflow-visible flex h-30 items-center justify-between gap-3 md:h-20 md:gap-4">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Karyana Bakery"
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3 md:relative md:left-auto md:translate-x-0"?
        >
          <Image
            src="/logo.png"
            alt="Karyana Ruiz Bakery"
            width={90}
            height={90}
            priority
            className="h-25 w-25 object-contain md:h-25 md:w-25"
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
          <CategoryDropdown />
          <Link
            href="/memberships"
            className="link-underline flex items-center gap-1"
          >
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
        <div className="flex items-center gap-2 md:gap-3">
          <LanguageToggle className="hidden sm:inline-flex" />

          {/* Search — mobile */}
          <Link
            href="/shop"
            className="hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5 md:h-4 md:w-4" />
          </Link>

          {/* Account */}
          <div className="relative">
            {session ? (
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-canela/30 bg-cream px-2.5 py-1.5 text-xs font-medium hover:bg-canela-light md:px-3"
                aria-label="Account menu"
              >
                <User className="h-5 w-5 md:h-3.5 md:w-3.5" />
                <span className="hidden md:inline">
                  {session.user?.name?.split(" ")[0] || t("common.account")}
                </span>
                {isMember && <Crown className="h-3 w-3 text-gold" />}
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-full border border-canela/30 px-2.5 py-1.5 text-xs font-medium hover:bg-canela-light md:px-3"
              >
                <User className="h-5 w-5 md:h-3.5 md:w-3.5" />
                <span className="hidden md:inline">{t("common.signIn")}</span>
              </Link>
            )}

            {accountOpen && session && (
              <div
  onMouseLeave={() => setAccountOpen(false)}
  className="absolute right-0 top-full z-[10000] mt-2 w-56 overflow-hidden rounded-xl border border-canela/20 bg-cream shadow-2xl"
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
            className="relative inline-flex items-center justify-center rounded-full bg-canela p-2.5 text-ink transition-all hover:bg-canela-dark md:px-3.5 md:py-2"
            aria-label="Open cart"
          >
            <ShoppingBag className="h-5 w-5 md:h-4 md:w-4" />
            {itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-cream">
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile burger */}
          <button
            className="inline-flex items-center justify-center rounded-full p-2 hover:bg-canela-light lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity lg:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
      >
        <div
          className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute right-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-cream shadow-2xl transition-transform",
            mobileOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between border-b border-canela/15 px-6 py-5">
            <Link
              href="/"
              className="flex items-center gap-2"
              onClick={() => setMobileOpen(false)}
            >
              <Image
                src="/logo.png"
                alt="Karyana"
                width={40}
                height={40}
                className="h-8 w-8 object-contain"
              />
              <span className="font-display text-lg">Karyana</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="rounded-full p-2 hover:bg-canela-light"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Drawer nav */}
          <nav className="flex flex-col px-4 py-4">
            {[
              { href: "/shop", label: t("nav.shop") },
              { href: "/category/conchas", label: "Conchas" },
              { href: "/category/cakes", label: "Cakes" },
              { href: "/category/churros", label: "Churros" },
              { href: "/category/boxes", label: "Boxes" },
              { href: "/memberships", label: t("nav.memberships") },
              { href: "/events", label: t("nav.events") },
              { href: "/about", label: t("nav.about") },
              { href: "/contact", label: t("nav.contact") },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-4 py-3.5 text-base font-medium hover:bg-canela-light"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}

            <div className="my-3 border-t border-canela/15" />

            {[
              { href: "/how-to-order", label: t("nav.howToOrder") },
              { href: "/refer-a-friend", label: t("nav.referAFriend") },
              { href: "/faq", label: t("nav.faq") },
              { href: "/track", label: "Track order" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-4 py-3 text-sm text-ink-soft hover:bg-canela-light"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Drawer footer */}
          <div className="border-t border-canela/15 px-6 py-5">
            <LanguageToggle />

            {session ? (
              <div className="mt-4 space-y-2">
                <Link
                  href="/account"
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium hover:bg-canela-light"
                  onClick={() => setMobileOpen(false)}
                >
                  <User className="h-4 w-4" />
                  {t("account.overview")}
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                >
                  {t("common.signOut")}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="btn-primary mt-4 flex w-full justify-center"
                onClick={() => setMobileOpen(false)}
              >
                {t("common.signIn")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
