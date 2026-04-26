"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { Plus, Minus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export function CartDrawer() {
  const [mounted, setMounted] = useState(false);
  const isOpen = useCartStore((s) => s.isOpen);
  const setOpen = useCartStore((s) => s.setOpen);
  const items = useCartStore((s) => s.items);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.getSubtotal());

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div
        className={`absolute inset-0 bg-ink/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      <div
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-500 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-canela/10 p-6">
          <div>
            <h2 className="font-display text-2xl text-ink">Your cart</h2>
            <p className="text-xs text-ink/50">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-canela transition-colors hover:bg-canela/10"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-masa">
                <ShoppingBag className="h-8 w-8 text-canela/60" />
              </div>
              <h3 className="font-display text-xl text-ink">
                Your cart is empty
              </h3>
              <p className="mt-2 max-w-xs text-sm text-ink/60">
                Add some pan dulce and your cart will come to life.
              </p>
              <button
                onClick={() => setOpen(false)}
                className="mt-6 btn-primary"
              >
                Start shopping
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-canela/10">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-4 py-5">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={() => setOpen(false)}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-masa"
                  >
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={() => setOpen(false)}
                          className="font-display text-base text-ink hover:text-otomi-red"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-ink/50">
                          {formatPrice(item.price)} {item.unit && `/ ${item.unit}`}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-xs text-ink/40 hover:text-otomi-red"
                        aria-label="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex h-9 items-center overflow-hidden rounded-full border border-canela/20">
                        <button
                          onClick={() => decrement(item.productId)}
                          className="flex h-full w-9 items-center justify-center text-canela transition-colors hover:bg-canela hover:text-cream"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="flex min-w-[2.5rem] items-center justify-center font-display text-sm tabular-nums text-ink">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => increment(item.productId)}
                          className="flex h-full w-9 items-center justify-center text-canela transition-colors hover:bg-canela hover:text-cream"
                          aria-label="Increase"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-display text-base text-canela">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-canela/10 bg-cream p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm uppercase tracking-widest text-ink/60">
                Subtotal
              </span>
              <span className="font-display text-2xl text-canela">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="mb-4 text-xs text-ink/50">
              Taxes and pickup/delivery calculated at checkout.
            </p>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-canela text-sm font-medium text-cream transition-all hover:bg-canela-dark"
            >
              Checkout
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="mt-2 block text-center text-xs text-ink/60 underline-offset-4 hover:underline"
            >
              View full cart
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
