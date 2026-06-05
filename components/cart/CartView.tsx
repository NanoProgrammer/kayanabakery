"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus, Minus, X, ShoppingBag } from "lucide-react";
import { useLocale, pickI18n } from "@/lib/i18n/locale-provider";
import { useCartStore } from "@/lib/store/cart-store";
import { formatPrice, cn } from "@/lib/utils";

export function CartView() {
  const { t, locale } = useLocale();
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = items.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <div className="container-bakery py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-canela-light">
          <ShoppingBag className="h-8 w-8 text-canela-dark" />
        </div>
        <h1 className="mt-6 font-display text-3xl">
          {locale === "es" ? "Tu carrito está vacío" : "Your cart is empty"}
        </h1>
        <p className="mt-2 text-ink-soft">
          {locale === "es"
            ? "Empieza a llenarlo con pan recién hecho."
            : "Start filling it with fresh-baked goodness."}
        </p>
        <Link href="/shop" className="btn-primary mt-8 inline-flex">
          {locale === "es" ? "Ver el menú" : "Browse menu"}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-bakery py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl">
          {locale === "es" ? "Tu carrito" : "Your cart"}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {items.length} {items.length === 1 ? (locale === "es" ? "producto" : "item") : (locale === "es" ? "productos" : "items")}
        </p>
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
        {/* Items list */}
        <ul className="space-y-4">
          {items.map((it) => {
            const name = pickI18n(it as any, "name", locale) || it.name;
            return (
              <li
                key={it.productId}
                className="flex gap-4 rounded-2xl border border-canela/15 bg-cream p-4"
              >
                {it.image && (
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-canela-light">
                    <Image
                      src={it.image}
                      alt={name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Link
                    href={`/product/${it.slug}`}
                    className="font-medium hover:underline"
                  >
                    {name}
                  </Link>
                  {it.unit && (
                    <p className="text-xs text-ink-soft">/ {it.unit}</p>
                  )}
                  {!!it.leadTime && it.leadTime > 0 && (
                    <p className="mt-1 text-xs text-canela-dark">
                      ⏱ {it.leadTime}h {locale === "es" ? "anticipación" : "advance notice"}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full border border-canela/30">
                      <button
                        onClick={() =>
                          updateQty(it.productId, Math.max(1, it.quantity - 1))
                        }
                        className="flex h-8 w-8 items-center justify-center hover:bg-canela-light"
                        aria-label="Decrease"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">
                        {it.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(it.productId, it.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center hover:bg-canela-light"
                        aria-label="Increase"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {formatPrice(it.price * it.quantity, locale)}
                      </p>
                      {it.quantity > 1 && (
                        <p className="text-xs text-ink-soft">
                          {formatPrice(it.price, locale)} {locale === "es" ? "c/u" : "ea"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(it.productId)}
                  className="self-start text-ink-soft hover:text-canela-dark"
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>

        {/* Summary */}
        <aside className="h-fit rounded-3xl border border-canela/15 bg-cream p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl">
            {locale === "es" ? "Resumen" : "Summary"}
          </h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{locale === "es" ? "Subtotal" : "Subtotal"}</span>
              <span className="font-bold">{formatPrice(subtotal, locale)}</span>
            </div>
            <p className="text-xs text-ink-soft">
              {locale === "es"
                ? "Envío, impuestos y descuentos en el checkout."
                : "Delivery, tax & discounts at checkout."}
            </p>
          </div>
          <Link
            href="/checkout"
            className="btn-primary mt-6 w-full"
          >
            {locale === "es" ? "Pagar" : "Checkout"} →
          </Link>
          <Link
            href="/shop"
            className="mt-3 block text-center text-sm text-ink-soft underline"
          >
            {locale === "es" ? "Seguir comprando" : "Keep shopping"}
          </Link>
        </aside>
      </div>
    </div>
  );
}