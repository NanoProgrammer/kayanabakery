"use client";

import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { useLocale } from "@/lib/i18n/locale-provider";
import { formatPrice, cn } from "@/lib/utils";

export function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const setOpen = useCartStore((s) => s.setOpen);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const { t, locale } = useLocale();

  return (
    <Fragment>
      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div
          className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute right-0 top-0 flex h-full w-[92%] max-w-md flex-col bg-cream shadow-2xl transition-transform",
            isOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-canela/15 px-6 py-5">
            <h2 className="font-display text-2xl">{t("cart.title")}</h2>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-full p-2 hover:bg-canela-light"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-canela-light">
                  <ShoppingBag className="h-8 w-8 text-canela-dark" />
                </div>
                <p className="font-display text-xl">{t("cart.empty")}</p>
                <p className="mt-2 text-sm text-ink-soft">
                  {t("cart.emptyDescription")}
                </p>
                <Link
                  href="/shop"
                  onClick={() => setOpen(false)}
                  className="btn-primary mt-6"
                >
                  {t("cart.browse")}
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {items.map((item) => {
                  const name =
                    locale === "es" && item.nameEs ? item.nameEs : item.name;
                  return (
                    <li
                      key={item.productId}
                      className="flex gap-4 rounded-xl border border-canela/10 bg-cream p-3"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-canela-light">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-medium">
                            {name}
                          </p>
                          <button
                            onClick={() => removeItem(item.productId)}
                            aria-label="Remove"
                            className="rounded-md p-1 text-ink-soft hover:bg-canela-light hover:text-ink"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-0.5 text-xs text-ink-soft">
                          {formatPrice(item.price, locale)}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex items-center gap-1 rounded-full border border-canela/30">
                            <button
                              onClick={() => decrement(item.productId)}
                              aria-label="Decrease"
                              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-canela-light"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => increment(item.productId)}
                              aria-label="Increase"
                              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-canela-light"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-sm font-bold">
                            {formatPrice(item.price * item.quantity, locale)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <footer className="border-t border-canela/15 bg-masa px-6 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">{t("cart.subtotal")}</span>
                <span className="font-bold">
                  {formatPrice(subtotal, locale)}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-soft">
                {t("cart.calculatedAtCheckout")}
              </p>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="btn-primary mt-4 w-full"
              >
                {t("cart.checkout")}
              </Link>
              <button
                onClick={clear}
                className="mt-3 w-full text-center text-xs text-ink-soft underline-offset-2 hover:underline"
              >
                {t("cart.clearCart")}
              </button>
            </footer>
          )}
        </aside>
      </div>
    </Fragment>
  );
}
