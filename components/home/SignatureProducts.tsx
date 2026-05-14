"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types";

export function SignatureProducts({ products }: { products: Product[] }) {
  const { t } = useLocale();
  if (!products?.length) return null;

  return (
    <section className="bg-masa py-24">
      <div className="container-bakery">
        <div className="mb-12 max-w-3xl">
          <span className="eyebrow">{t("home.signatureEyebrow")}</span>
          <h2 className="section-title mt-2">
            {t("home.signatureTitle")}{" "}
            <span className="font-script text-canela-dark">
              {t("home.signatureTitleAccent")}
            </span>
          </h2>
          <p className="mt-4 text-base text-ink-soft md:text-lg">
            {t("home.signatureSubtitle")}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/shop" className="btn-ghost">
            {t("home.seeFullMenu")} →
          </Link>
        </div>
      </div>
    </section>
  );
}
