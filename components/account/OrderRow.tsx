"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Package, Truck, RotateCcw, FileText } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useCartStore } from "@/lib/store/cart-store";
import { formatCents } from "@/lib/checkout/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  fulfillmentType: string;
  createdAt: string;
  itemCount: number;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-canela/20 text-ink-soft",
  CONFIRMED: "bg-canela-light text-canela-dark",
  IN_PROGRESS: "bg-canela text-ink",
  READY: "bg-gold/20 text-gold",
  OUT_FOR_DELIVERY: "bg-gold/30 text-canela-dark",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function OrderRow({ orders }: { orders: OrderRow[] }) {
  const { locale } = useLocale();
  const router = useRouter();
  const replaceItems = useCartStore((s) => s.replaceItems);
  const setOpen = useCartStore((s) => s.setOpen);
  const [busy, setBusy] = useState<string | null>(null);

  async function reorder(orderId: string) {
    setBusy(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/reorder`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      replaceItems(data.items);
      if (data.droppedCount > 0) {
        toast.warning(
          locale === "es"
            ? `${data.droppedCount} producto(s) ya no están disponibles`
            : `${data.droppedCount} item(s) no longer available`
        );
      } else {
        toast.success(locale === "es" ? "Carrito actualizado" : "Cart updated");
      }
      setOpen(true);
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(null);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-canela/15 bg-cream p-8 text-center text-sm text-ink-soft">
        {locale === "es" ? "Sin órdenes todavía." : "No orders yet."}{" "}
        <Link href="/shop" className="text-canela-dark underline">
          {locale === "es" ? "Comenzar" : "Start shopping"}
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li
          key={o.id}
          className="rounded-2xl border border-canela/15 bg-cream p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {o.fulfillmentType === "DELIVERY" ? (
                <Truck className="h-4 w-4 text-ink-soft mt-0.5" />
              ) : (
                <Package className="h-4 w-4 text-ink-soft mt-0.5" />
              )}
              <div>
                <Link
                  href={`/account/orders/${o.id}`}
                  className="font-medium hover:underline"
                >
                  {o.orderNumber}
                </Link>
                <p className="text-xs text-ink-soft">
                  {new Date(o.createdAt).toLocaleDateString(
                    locale === "es" ? "es-MX" : "en-CA",
                    { year: "numeric", month: "short", day: "numeric" }
                  )}{" "}
                  · {o.itemCount}{" "}
                  {o.itemCount === 1
                    ? locale === "es"
                      ? "producto"
                      : "item"
                    : locale === "es"
                    ? "productos"
                    : "items"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">{formatCents(o.total, locale)}</p>
              <span
                className={cn(
                  "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                  STATUS_COLORS[o.status] || "bg-canela/20"
                )}
              >
                {o.status}
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => reorder(o.id)}
              disabled={busy === o.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-canela/30 px-3 py-1.5 text-xs font-medium hover:bg-canela-light disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" />
              {busy === o.id
                ? "..."
                : locale === "es"
                ? "Reordenar"
                : "Reorder"}
            </button>
            <a
              href={`/api/orders/${o.id}/invoice`}
              className="inline-flex items-center gap-1.5 rounded-full border border-canela/30 px-3 py-1.5 text-xs font-medium hover:bg-canela-light"
            >
              <FileText className="h-3 w-3" />
              {locale === "es" ? "Factura" : "Invoice"}
            </a>
            <Link
              href={`/account/orders/${o.id}`}
              className="inline-flex items-center rounded-full bg-canela px-3 py-1.5 text-xs font-medium hover:bg-canela-dark"
            >
              {locale === "es" ? "Detalles" : "Details"} →
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
