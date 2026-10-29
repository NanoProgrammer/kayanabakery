"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, ShoppingBag, Crown, Lock } from "lucide-react";
import { useSession } from "next-auth/react";
import { PortableText } from "@portabletext/react";
import { useLocale, pickI18n } from "@/lib/i18n/locale-provider";
import { useCartStore } from "@/lib/store/cart-store";
import { urlFor } from "@/sanity/lib/image";
import { ProductOptions } from "./ProductOptions";
import {
  describeChoices,
  optionKey,
  resolveOptions,
  type ProductOption,
} from "@/lib/products/options";
import { formatPrice, cn } from "@/lib/utils";
import { tierMeets, type MembershipTier } from "@/lib/membership/tiers";
import { MembershipUpsellModal } from "@/components/membership/MembershipUpsellModal";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics/gtag";
import type { Product } from "@/types";

export function ProductDetail({ product }: { product: Product }) {
  const { t, locale } = useLocale();
  const { data: session } = useSession();
  const tier = ((session?.user as any)?.tier ?? "BASICO") as MembershipTier;

  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [showUpsell, setShowUpsell] = useState(false);

  // Sizes and flavours. Required ones start on their first available choice so
  // the price on screen is a price somebody can actually pay.
  const options: ProductOption[] = (product as any).options ?? [];
  const [selection, setSelection] = useState<Record<string, string>>(() => {
    const start: Record<string, string> = {};
    for (const option of options) {
      if (option.required === false) continue;
      const first = (option.choices ?? []).find((c) => !c.soldOut);
      if (first) start[optionKey(option)] = first.label;
    }
    return start;
  });

  const resolved = resolveOptions(options, selection, product.name);
  const optionsDelta = resolved.ok ? resolved.priceDeltaCents / 100 : 0;
  const livePrice = product.price + optionsDelta;

  // A chosen flavour with its own photo replaces the product shot.
  const choiceImage = (() => {
    for (const option of options) {
      const label = selection[optionKey(option)];
      const match = (option.choices ?? []).find((c) => c.label === label);
      if (match && (match as any).image) return (match as any).image;
    }
    return null;
  })();

  const addItem = useCartStore((s) => s.addItem);
  const setOpen = useCartStore((s) => s.setOpen);

  const name = pickI18n(product, "name", locale) || product.name;
  const description = pickI18n(product, "description", locale);
  const longDesc =
    locale === "es" && product.longDescriptionEs
      ? product.longDescriptionEs
      : product.longDescription;

  const memberRequired = product.membersOnly && !tierMeets(tier, "ARTESANO");
  const offSeasonLocked =
    product.isOffSeason && !product.inStock && !tierMeets(tier, "ARTESANO");
  const isLocked = memberRequired || offSeasonLocked;
  const isUnavailable = !product.inStock && !product.isOffSeason;

  const images = [product.image, ...(product.gallery || [])].filter(Boolean);

  useEffect(() => {
    trackEvent("view_item", {
      currency: "CAD",
      value: product.price,
      items: [
        {
          item_id: product._id,
          item_name: product.name,
          price: product.price,
        },
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product._id]);

  function handleAdd() {
    if (isUnavailable) {
      toast.error(t("product.outOfStock"));
      return;
    }

    // The same check the server runs. Catching it here means the customer is
    // told to pick a size instead of being refused at checkout with a card
    // already typed in.
    if (!resolved.ok) {
      toast.error(resolved.error);
      return;
    }

    // ALWAYS add to cart — even for members-only products
    addItem(
      {
        productId: product._id,
        slug: product.slug,
        name: product.name,
        nameEs: product.nameEs,
        price: livePrice,
        image: (choiceImage ?? product.image)
          ? urlFor(choiceImage ?? product.image).width(400).height(400).url()
          : "",
        unit: product.unit,
        leadTime: product.leadTime,
        membersOnly: product.membersOnly ?? false,
        ...(resolved.ok && resolved.choices.length
          ? {
              options: Object.fromEntries(
                resolved.choices.map((c) => [c.key, c.label])
              ),
              optionsLabel: describeChoices(resolved.choices),
            }
          : {}),
      },
      qty
    );

    // If member-locked, show upsell modal instead of opening cart
    if (isLocked) {
      setShowUpsell(true);
    } else {
      setOpen(true);
    }
  }

  return (
    <article className="container-bakery py-12 md:py-16">
      <div className="grid gap-12 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-canela-light">
            {(choiceImage ?? images[activeImg]) && (
              <Image
                src={urlFor(choiceImage ?? images[activeImg]).width(900).height(900).url()}
                alt={name}
                fill
                priority
                className={cn(
                  "object-cover",
                  isLocked && "opacity-60"
                )}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-2xl bg-cream/95 px-6 py-4 text-center shadow-lg">
                  <Crown className="mx-auto h-6 w-6 text-gold" />
                  <p className="mt-2 text-sm font-bold uppercase tracking-widest">
                    {t("product.membersOnly")}
                  </p>
                  <Link
                    href="/memberships"
                    className="mt-2 inline-block text-xs underline"
                  >
                    {locale === "es" ? "Ver planes" : "See plans"}
                  </Link>
                </div>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    "relative h-20 w-20 overflow-hidden rounded-xl border-2 transition-all",
                    activeImg === i
                      ? "border-canela-dark"
                      : "border-transparent hover:border-canela/50"
                  )}
                >
                  <Image
                    src={urlFor(img).width(160).height(160).url()}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.tag && (
            <span className="inline-block rounded-full bg-canela-light px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              {t(`product.tags.${product.tag}`)}
            </span>
          )}
          {product.membersOnly && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gold">
              <Crown className="h-3 w-3" />
              {t("product.membersOnly")}
            </span>
          )}

          <h1 className="mt-3 font-display text-[length:var(--text-display-md)] leading-tight tracking-tight">
            {name}
          </h1>
          {description && (
            <p className="mt-3 text-base text-ink-soft md:text-lg">
              {description}
            </p>
          )}

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-3xl">
              {formatPrice(livePrice, locale)}
            </span>
            {product.compareAtPrice &&
              product.compareAtPrice > product.price && (
                <span className="text-lg text-ink-soft line-through">
                  {formatPrice(product.compareAtPrice, locale)}
                </span>
              )}
            {product.unit && (
              <span className="text-xs uppercase tracking-widest text-ink-soft">
                / {product.unit}
              </span>
            )}
          </div>

          <ProductOptions
            options={options}
            selection={selection}
            onChange={(key, label) =>
              setSelection((current) => {
                const next = { ...current };
                if (label) next[key] = label;
                else delete next[key];
                return next;
              })
            }
          />

          {!!product.leadTime && product.leadTime > 0 && (
            <p className="mt-3 rounded-2xl border border-canela/20 bg-canela-light px-4 py-3 text-xs text-ink">
              ⏱ {t("product.leadTimeNotice", { hours: product.leadTime })}
            </p>
          )}

          {/* Quantity + Add */}
          <div className="mt-8 flex items-stretch gap-3">
            <div className="inline-flex items-center rounded-full border border-canela/30">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1}
                className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-canela-light disabled:opacity-40"
                aria-label="Decrease"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-bold">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-canela-light"
                aria-label="Increase"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={isUnavailable}
              className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLocked ? (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  {t("product.membersOnly")}
                </>
              ) : isUnavailable ? (
                t("product.outOfStock")
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  {t("product.addToCart")}
                </>
              )}
            </button>
          </div>

          {/* Allergens */}
          {product.allergens?.length ? (
            <div className="mt-8 border-t border-canela/15 pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
                {t("product.contains")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.allergens.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-canela-light px-3 py-1 text-xs"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Long description */}
          {longDesc && (
            <div className="prose prose-sm mt-8 max-w-none border-t border-canela/15 pt-6 text-ink-soft">
              <PortableText value={longDesc} />
            </div>
          )}
        </div>
      </div>

      {/* Membership upsell modal */}
      {showUpsell && (
        <MembershipUpsellModal
          productName={name}
          isLoggedIn={!!session}
          onClose={() => setShowUpsell(false)}
        />
      )}
    </article>
  );
}
