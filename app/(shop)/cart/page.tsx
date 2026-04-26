"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { Plus, Minus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((s) => s.items);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const clear = useCartStore((s) => s.clear);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="container-bakery flex min-h-[60vh] items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-masa">
            <ShoppingBag className="h-10 w-10 text-canela/60" />
          </div>
          <h1 className="font-display text-4xl text-ink">Your cart is empty</h1>
          <p className="mx-auto mt-3 max-w-md text-ink/60">
            Looks like you haven&apos;t added anything yet. Let&apos;s fix that.
          </p>
          <Link href="/shop" className="btn-primary mt-8 inline-flex">
            Browse the menu
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-bakery py-12 md:py-16">
      <header className="mb-10">
        <span className="eyebrow">Your order</span>
        <h1 className="section-title mt-2">Cart</h1>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-14">
        <div className="lg:col-span-2">
          <ul className="divide-y divide-canela/10 border-y border-canela/10">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-5 py-6">
                <Link
                  href={`/product/${item.slug}`}
                  className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-masa sm:h-32 sm:w-32"
                >
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  )}
                </Link>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/product/${item.slug}`}
                        className="font-display text-xl text-ink hover:text-otomi-red"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm text-ink/60">
                        {formatPrice(item.price)}{" "}
                        {item.unit && `/ ${item.unit}`}
                      </p>
                      {item.leadTime && item.leadTime > 0 ? (
                        <p className="mt-1 text-[10px] uppercase tracking-widest text-ink/50">
                          {item.leadTime}h prep time
                        </p>
                      ) : null}
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-ink/40 hover:text-otomi-red"
                      aria-label="Remove"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="flex h-11 items-center overflow-hidden rounded-full border border-canela/20">
                      <button
                        onClick={() => decrement(item.productId)}
                        className="flex h-full w-11 items-center justify-center text-canela transition-colors hover:bg-canela hover:text-cream"
                        aria-label="Decrease"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="flex min-w-[3rem] items-center justify-center font-display text-base tabular-nums text-ink">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increment(item.productId)}
                        className="flex h-full w-11 items-center justify-center text-canela transition-colors hover:bg-canela hover:text-cream"
                        aria-label="Increase"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-display text-xl text-canela">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between">
            <Link
              href="/shop"
              className="text-sm text-canela underline-offset-4 hover:underline"
            >
              ← Continue shopping
            </Link>
            <button
              onClick={clear}
              className="text-sm text-ink/50 underline-offset-4 hover:text-otomi-red hover:underline"
            >
              Clear cart
            </button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="rounded-3xl border border-canela/15 bg-masa/40 p-8">
            <h2 className="font-display text-2xl text-ink">Order summary</h2>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between text-ink/70">
                <span>Subtotal</span>
                <span className="text-ink">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink/70">
                <span>Taxes</span>
                <span className="text-ink/50">Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-ink/70">
                <span>Pickup / Delivery</span>
                <span className="text-ink/50">Calculated at checkout</span>
              </div>
            </div>

            <div className="my-6 h-px bg-canela/15" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm uppercase tracking-widest text-ink/60">
                Total
              </span>
              <span className="font-display text-3xl text-canela">
                {formatPrice(subtotal)}
              </span>
            </div>

            <Link
              href="/checkout"
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-canela text-sm font-medium text-cream transition-all hover:bg-canela-dark"
            >
              Proceed to checkout
              <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="mt-4 text-center text-xs text-ink/50">
              Secure checkout · powered by Square
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
