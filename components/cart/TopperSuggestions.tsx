"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Plus, Check } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { useLocale } from "@/lib/i18n/locale-provider";
import { formatPrice } from "@/lib/utils";
import type { SuggestableProduct } from "@/lib/products/addons";

/**
 * Offers cake toppers the moment a tres leches goes into the cart.
 *
 * A cake went out plain unless the customer thought to go looking for a
 * decoration, and by the time the cake is in the cart they are heading for
 * the checkout. This is the one moment they are definitely thinking about
 * that cake.
 *
 * It asks the server whether to open at all: the browser does not hold the
 * catalog, so it cannot tell a tres leches from a concha, and it must not
 * open empty — a dialog with nothing in it is worse than no dialog. Nothing
 * here blocks the cart; the customer can close it and carry on.
 */
export function TopperSuggestions() {
  const { locale } = useLocale();
  const lastAdded = useCartStore((s) => s.lastAdded);
  const clearLastAdded = useCartStore((s) => s.clearLastAdded);
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);

  const [toppers, setToppers] = useState<SuggestableProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const [cakeName, setCakeName] = useState("");

  useEffect(() => {
    if (!lastAdded) return;
    const { productId, name } = lastAdded;
    // Consumed straight away: the question is asked once per add, and leaving
    // it set would re-open the dialog on the next unrelated re-render.
    clearLastAdded();

    let cancelled = false;
    const inCart = useCartStore
      .getState()
      .items.map((i) => i.productId)
      .join(",");

    fetch(
      `/api/addons/toppers?productId=${encodeURIComponent(productId)}&inCart=${encodeURIComponent(inCart)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.suggest || !data?.toppers?.length) return;
        setToppers(data.toppers);
        setCakeName(name);
        setAdded([]);
        setOpen(true);
      })
      // A decoration is a nicety; a customer must never meet an error over one.
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [lastAdded, clearLastAdded]);

  // Escape closes it, like every other dialog on the site.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const es = locale === "es";
  const remaining = toppers.filter((t) => !items.some((i) => i.productId === t._id));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={es ? "Decoraciones para tu cake" : "Toppers for your cake"}
      className="fixed inset-0 z-[10002] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream p-6 sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-canela-dark">
              {es ? "¿Le pones decoración?" : "Add a topper?"}
            </p>
            <h2 className="mt-1 font-display text-2xl">
              {cakeName}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={es ? "Cerrar" : "Close"}
            className="shrink-0 rounded-full p-1.5 text-ink-soft hover:bg-canela-light hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {toppers.map((t) => {
            const name = es && t.nameEs ? t.nameEs : t.name;
            const isAdded = added.includes(t._id);
            return (
              <div
                key={t._id}
                className="overflow-hidden rounded-2xl border border-canela/20 bg-canela-light/30"
              >
                <div className="relative aspect-square bg-canela-light">
                  {t.image && (
                    <Image
                      src={t.image}
                      alt={name}
                      fill
                      sizes="(max-width: 640px) 50vw, 160px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-medium">{name}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {formatPrice(t.price, locale)}
                  </p>
                  <button
                    type="button"
                    disabled={isAdded}
                    onClick={() => {
                      addItem({
                        productId: t._id,
                        slug: t.slug,
                        name: t.name,
                        nameEs: t.nameEs ?? undefined,
                        price: t.price,
                        image: t.image ?? undefined,
                      });
                      setAdded((prev) => [...prev, t._id]);
                    }}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-full bg-canela px-3 py-1.5 text-xs font-medium text-ink disabled:bg-canela-light disabled:text-ink-soft"
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-3 w-3" />
                        {es ? "Agregado" : "Added"}
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3" />
                        {es ? "Agregar" : "Add"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-5 w-full rounded-full border border-canela/30 px-4 py-2.5 text-sm font-medium"
        >
          {added.length
            ? es
              ? "Listo"
              : "Done"
            : remaining.length
            ? es
              ? "No, gracias"
              : "No thanks"
            : es
            ? "Cerrar"
            : "Close"}
        </button>
      </div>
    </div>
  );
}
