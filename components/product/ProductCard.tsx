"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus, Crown, Lock } from "lucide-react";
import { useLocale, pickI18n } from "@/lib/i18n/locale-provider";
import { useCartStore } from "@/lib/store/cart-store";
import { urlFor } from "@/sanity/lib/image";
import { formatPrice, cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { tierMeets, type MembershipTier } from "@/lib/membership/tiers";
import { toast } from "sonner";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const { t, locale } = useLocale();
  const { data: session } = useSession();
  const tier = ((session?.user as any)?.tier ?? "BASICO") as MembershipTier;

  const addItem = useCartStore((s) => s.addItem);
  const setOpen = useCartStore((s) => s.setOpen);
  const getQuantity = useCartStore((s) => s.getQuantity);
  const inCart = getQuantity(product._id);

  const name = pickI18n(product, "name", locale) || product.name;
  const description = pickI18n(product, "description", locale);
  const tagLabel = product.tag
    ? t(`product.tags.${product.tag}`)
    : null;

  // Members-only or off-season check
  const memberRequired = product.membersOnly && !tierMeets(tier, "ARTESANO");
  const offSeasonLocked =
    product.isOffSeason && !product.inStock && !tierMeets(tier, "ARTESANO");

  const isLocked = memberRequired || offSeasonLocked;
  const isUnavailable = !product.inStock && !product.isOffSeason;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isLocked) {
      toast.error(
        locale === "es"
          ? "Producto solo para miembros"
          : "Members only"
      );
      return;
    }
    if (isUnavailable) {
      toast.error(t("product.outOfStock"));
      return;
    }
    addItem({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      nameEs: product.nameEs,
      price: product.price,
      image: product.image
        ? urlFor(product.image).width(400).height(400).url()
        : "",
      unit: product.unit,
      leadTime: product.leadTime,
    });
    setOpen(true);
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block"
      aria-label={name}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-canela-light">
        {product.image && (
          <Image
            src={urlFor(product.image).width(600).height(600).url()}
            alt={name}
            fill
            className={cn(
              "object-cover transition-transform duration-500 group-hover:scale-105",
              isLocked && "opacity-60"
            )}
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        )}

        {/* Tag badge */}
        {tagLabel && (
          <span className="absolute left-3 top-3 rounded-full bg-cream px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink shadow-sm">
            {tagLabel}
          </span>
        )}

        {/* Members-only overlay */}
        {product.membersOnly && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cream shadow-sm">
            <Crown className="h-3 w-3" />
            {t("product.membersOnly")}
          </span>
        )}

        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/20">
            <div className="rounded-full bg-cream/90 p-3">
              <Lock className="h-5 w-5 text-ink" />
            </div>
          </div>
        )}

        {/* Sale badge */}
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <span className="absolute bottom-3 left-3 rounded-full bg-canela-dark px-2.5 py-1 text-[10px] font-bold uppercase text-cream shadow-sm">
            -
            {Math.round(
              ((product.compareAtPrice - product.price) /
                product.compareAtPrice) *
                100
            )}
            %
          </span>
        )}

        {/* Add button */}
        <button
          onClick={handleAdd}
          disabled={isUnavailable || isLocked}
          aria-label={t("product.addToCart")}
          className={cn(
            "absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-all",
            isUnavailable || isLocked
              ? "cursor-not-allowed bg-cream/60 text-ink-soft"
              : "bg-cream text-ink hover:bg-canela hover:scale-110"
          )}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 px-1">
        <h3 className="line-clamp-1 text-sm font-medium">{name}</h3>
        {description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">
            {description}
          </p>
        )}
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold">
              {formatPrice(product.price, locale)}
            </span>
            {product.compareAtPrice &&
              product.compareAtPrice > product.price && (
                <span className="text-xs text-ink-soft line-through">
                  {formatPrice(product.compareAtPrice, locale)}
                </span>
              )}
          </div>
          {inCart > 0 && (
            <span className="text-[10px] uppercase tracking-wider text-canela-dark">
              {inCart} {t("product.inCart")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
