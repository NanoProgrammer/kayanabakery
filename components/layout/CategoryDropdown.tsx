"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useLocale, pickI18n } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

export type CategoryItem = {
  _id: string;
  slug: string;
  title: string;
  titleEs?: string;
  image?: string;
};

/**
 * Dropdown for site header showing ALL categories from Sanity.
 *
 * Categories are fetched once via /api/categories (cached).
 * Or pass them as a prop from a server component.
 */
export function CategoryDropdown({
  categories: initialCategories,
}: {
  categories?: CategoryItem[];
}) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>(
    initialCategories ?? []
  );
  const ref = useRef<HTMLDivElement>(null);

  // Fetch categories if not passed as prop
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) return;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, [initialCategories]);

  // Click outside to close
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-medium text-ink transition-colors hover:text-canela-dark"
      >
        {locale === "es" ? "Categorías" : "Categories"}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-canela/15 bg-cream shadow-xl">
          {/* All products link */}
          <Link
            href="/products"
            onClick={() => setOpen(false)}
            className="block border-b border-canela/10 px-4 py-3 text-sm font-medium transition-colors hover:bg-canela-light"
          >
            {locale === "es" ? "Ver todos" : "View all"}
          </Link>

          <div className="max-h-[60vh] overflow-y-auto py-1">
            {categories.map((cat) => {
              const name =
                locale === "es" && cat.titleEs
                  ? cat.titleEs
                  : cat.title;
              return (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-canela-light"
                >
                  {cat.image && (
                    <img
                      src={cat.image}
                      alt={name}
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  )}
                  <span>{name}</span>
                </Link>
              );
            })}
          </div>

          {categories.length === 0 && (
            <p className="px-4 py-4 text-center text-xs text-ink-soft">
              {locale === "es" ? "Cargando…" : "Loading…"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
