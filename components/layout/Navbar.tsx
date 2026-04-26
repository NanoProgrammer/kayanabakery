"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingBag, User, Menu, X, Search } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/category/conchas", label: "Conchas" },
  { href: "/category/cakes", label: "Cakes" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const announcements = [
  "✦ Free pickup in Calgary",
  "✦ Fresh baked daily",
  "✦ Order 48h in advance for custom cakes",
  "✦ More than bread, a home memory",
  "✦ Est. 2018",
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const itemCount = useCartStore((s) => s.getItemCount());
  const setCartOpen = useCartStore((s) => s.setOpen);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="relative overflow-hidden bg-canela text-cream">
        <div className="flex animate-[marquee_40s_linear_infinite] whitespace-nowrap py-2 text-xs font-medium tracking-widest uppercase">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-12 px-6">
              {announcements.map((a, j) => (
                <span key={j}>{a}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <header
        className={`sticky top-0 z-40 transition-all duration-500 ${
          scrolled
            ? "border-b border-canela/10 bg-cream/85 backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="container-bakery">
          <div className="flex h-20 items-center justify-between gap-6">
            <div className="flex flex-1 items-center gap-8">
              <button
                onClick={() => setMobileOpen(true)}
                className="text-canela lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <nav className="hidden items-center gap-7 lg:flex">
                {navLinks.slice(0, 3).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="link-underline text-sm font-medium tracking-wide text-canela transition-colors hover:text-canela-dark"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <Link href="/" className="flex flex-col items-center">
              <span className="font-display text-2xl leading-none tracking-tight text-canela md:text-3xl">
                Karyana
              </span>
              <span className="font-script text-sm leading-tight text-otomi-red">
                bakery
              </span>
            </Link>

            <div className="flex flex-1 items-center justify-end gap-5">
              <nav className="hidden items-center gap-7 lg:flex">
                {navLinks.slice(3).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="link-underline text-sm font-medium tracking-wide text-canela transition-colors hover:text-canela-dark"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-1">
                <Link
                  href="/shop"
                  className="hidden h-10 w-10 items-center justify-center rounded-full text-canela transition-colors hover:bg-canela/10 md:flex"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </Link>
                <Link
                  href="/account"
                  className="hidden h-10 w-10 items-center justify-center rounded-full text-canela transition-colors hover:bg-canela/10 md:flex"
                  aria-label="Account"
                >
                  <User className="h-5 w-5" />
                </Link>
                <button
                  onClick={() => setCartOpen(true)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full text-canela transition-colors hover:bg-canela/10"
                  aria-label="Cart"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {mounted && itemCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-otomi-red px-1 text-[10px] font-bold text-cream">
                      {itemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`absolute left-0 top-0 h-full w-[85%] max-w-sm bg-cream p-8 shadow-xl transition-transform duration-500 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-10 flex items-center justify-between">
            <span className="font-display text-2xl text-canela">Karyana</span>
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X className="h-6 w-6 text-canela" />
            </button>
          </div>
          <nav className="flex flex-col gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-display text-3xl text-ink transition-colors hover:text-otomi-red"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-10 flex flex-col gap-3 border-t border-canela/10 pt-6">
            <Link href="/account" className="text-sm text-canela">
              My Account
            </Link>
            <Link href="/how-to-order" className="text-sm text-canela">
              How to Order
            </Link>
            <Link href="/faq" className="text-sm text-canela">
              FAQ
            </Link>
            <Link href="/refer-a-friend" className="text-sm text-canela">
              Refer a Friend
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
