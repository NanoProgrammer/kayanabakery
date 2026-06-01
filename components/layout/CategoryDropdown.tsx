"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

export type CategoryItem = {
  _id: string;
  slug: string;
  title: string;
  titleEs?: string;
  image?: string;
};

export function CategoryDropdown({
  categories: initialCategories,
  mobile = false,
}: {
  categories?: CategoryItem[];
  mobile?: boolean;
} = {}) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>(
    initialCategories ?? []
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) return;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, [initialCategories]);

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

      {open &&
  (mobile ? (
    <div className="mt-2 flex flex-col pl-4">
      <Link
        href="/shop"
        onClick={() => setOpen(false)}
        className="py-3 text-sm font-medium text-ink-soft"
      >
        {locale === "es" ? "Ver todos" : "View all"}
      </Link>

      {categories.map((cat) => {
        const name =
          locale === "es" && cat.titleEs
            ? cat.titleEs
            : cat.title;

        return (
          <Link
            key={cat._id}
            href={`/category/${cat.slug}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 py-3"
          >
            {cat.image && (
              <img
                src={cat.image}
                alt={name}
                className="h-8 w-8 rounded-lg object-cover"
              />
            )}

            <span className="text-sm">{name}</span>
          </Link>
        );
      })}
    </div>
  ) : (
    <div className="absolute left-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-2xl border border-canela/15 bg-cream shadow-xl">
      <Link
        href="/shop"
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
              href={`/category/${cat.slug}`}
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
    </div>
  ))}
    </div>
  );
}
