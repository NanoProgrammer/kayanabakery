"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

export type CategoryItem = {
  _id: string;
  slug: string;
  title: string;
  titleEs?: string;
  image?: string;
  /** Subcategories — Tres Leches, Gourmet and Clásicos under Cakes. */
  children?: CategoryItem[];
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
  // Which parent row the pointer is on, so its subcategories can open beside
  // the menu instead of being listed inside it.
  const [hovered, setHovered] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const submenu = categories.find(
    (c) => c._id === hovered && !!c.children?.length
  );

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
        setHovered(null);
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
          <div key={cat._id}>
            <Link
              href={`/category/${cat.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 py-3"
            >
              {cat.image && (
                <Image
                  src={cat.image}
                  alt={name}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-lg object-cover"
                />
              )}

              <span className="text-sm">{name}</span>
            </Link>

            {/* Tres Leches, Gourmet, Clásicos — reachable without opening
                Cakes first, which is the point of putting them here. */}
            {cat.children?.map((child) => (
              <Link
                key={child._id}
                href={`/category/${child.slug}`}
                onClick={() => setOpen(false)}
                className="block border-l border-canela/20 py-2 pl-6 text-sm text-ink-soft"
              >
                {locale === "es" && child.titleEs ? child.titleEs : child.title}
              </Link>
            ))}
          </div>
        );
      })}
    </div>
  ) : (
    <div className="absolute left-0 top-full z-50 mt-3 flex items-start">
      <div className="w-72 overflow-hidden rounded-2xl border border-canela/15 bg-cream shadow-xl">
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
              locale === "es" && cat.titleEs ? cat.titleEs : cat.title;
            const hasChildren = !!cat.children?.length;

            return (
              <div
                key={cat._id}
                // The subcategories used to sit indented under their parent in
                // this same list, so the menu was one long column of
                // everything the shop sells. Hovering a parent now opens them
                // beside it instead, and clicking the parent goes to its page,
                // where the subcategories are laid out as cards to choose
                // from. onFocus/onBlur so a keyboard reaches them too.
                onMouseEnter={() => hasChildren && setHovered(cat._id)}
                onMouseLeave={() => hasChildren && setHovered((h) => (h === cat._id ? null : h))}
                onFocus={() => hasChildren && setHovered(cat._id)}
              >
                <Link
                  href={`/category/${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-canela-light",
                    hovered === cat._id && "bg-canela-light"
                  )}
                >
                  {cat.image && (
                    <img
                      src={cat.image}
                      alt={name}
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  )}
                  <span className="flex-1">{name}</span>
                  {hasChildren && (
                    <ChevronRight className="h-3.5 w-3.5 text-ink-soft" />
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* The hovered category's subcategories, beside the menu rather than
          inside it. Kept mounted on hover of the panel itself so the pointer
          can travel from the parent row across to a child without the panel
          closing under it. */}
      {submenu && (
        <div
          onMouseEnter={() => setHovered(submenu._id)}
          onMouseLeave={() => setHovered(null)}
          className="ml-2 w-60 overflow-hidden rounded-2xl border border-canela/15 bg-cream shadow-xl"
        >
          <p className="border-b border-canela/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-canela-dark">
            {locale === "es" && submenu.titleEs ? submenu.titleEs : submenu.title}
          </p>
          {submenu.children!.map((child) => (
            <Link
              key={child._id}
              href={`/category/${child.slug}`}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-canela-light hover:text-ink"
            >
              {locale === "es" && child.titleEs ? child.titleEs : child.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  ))}
    </div>
  );
}
