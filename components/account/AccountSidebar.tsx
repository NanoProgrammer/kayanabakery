"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Crown,
  Gift,
  Settings,
  LogOut,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function AccountSidebar() {
  const pathname = usePathname();
  const { locale } = useLocale();

  const items = [
    {
      href: "/account/overview",
      icon: LayoutDashboard,
      label: locale === "es" ? "Resumen" : "Overview",
    },
    {
      href: "/account/orders",
      icon: Package,
      label: locale === "es" ? "Órdenes" : "Orders",
    },
    {
      href: "/account/addresses",
      icon: MapPin,
      label: locale === "es" ? "Direcciones" : "Addresses",
    },
    {
      href: "/account/membership",
      icon: Crown,
      label: locale === "es" ? "Membresía" : "Membership",
    },
    {
      href: "/account/referrals",
      icon: Gift,
      label: locale === "es" ? "Referidos" : "Referrals",
    },
    {
      href: "/account/preferences",
      icon: Settings,
      label: locale === "es" ? "Preferencias" : "Preferences",
    },
  ];

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm transition-colors",
              active
                ? "bg-canela text-ink"
                : "text-ink-soft hover:bg-canela-light hover:text-ink"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm text-ink-soft hover:bg-canela-light"
      >
        <LogOut className="h-4 w-4" />
        {locale === "es" ? "Salir" : "Sign out"}
      </button>
    </nav>
  );
}
