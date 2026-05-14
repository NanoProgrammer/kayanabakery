"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  UserPlus,
  Truck,
  Crown,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname();

  const items = [
    { href: "/admin/orders", icon: Package, label: "Orders" },
    { href: "/admin/ambassadors", icon: UserPlus, label: "Ambassador apps" },
    { href: "/admin/deliveries", icon: Truck, label: "Deliveries" },
    { href: "/admin/memberships", icon: Crown, label: "Memberships" },
    { href: "/admin/members", icon: Users, label: "Customers" },
  ];

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm transition-colors",
              active
                ? "bg-canela-dark text-cream"
                : "text-ink-soft hover:bg-canela-light hover:text-ink"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
