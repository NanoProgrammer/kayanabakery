"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { useLocale, pickI18n } from "@/lib/i18n/locale-provider";
import { urlFor } from "@/sanity/lib/image";
import type { PopupBanner } from "@/types";

const STORAGE_PREFIX = "karyana-popup-";

export function PopupBannerProvider({ banner }: { banner: PopupBanner }) {
  const { locale } = useLocale();
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!banner) return;
    if (banner.showOnPaths?.length) {
      const matches = banner.showOnPaths.some((p) =>
        p === "/" ? pathname === "/" : pathname.startsWith(p)
      );
      if (!matches) return;
    }

    // Frequency check
    const key = STORAGE_PREFIX + banner._id;
    if (banner.frequency === "once") {
      if (typeof localStorage !== "undefined" && localStorage.getItem(key))
        return;
    } else if (banner.frequency === "session") {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key))
        return;
    }

    const t = setTimeout(() => setShow(true), (banner.delaySeconds ?? 3) * 1000);
    return () => clearTimeout(t);
  }, [banner, pathname]);

  function dismiss() {
    setShow(false);
    if (!banner) return;
    const key = STORAGE_PREFIX + banner._id;
    if (banner.frequency === "once") {
      try {
        localStorage.setItem(key, "1");
      } catch {}
    } else if (banner.frequency === "session") {
      try {
        sessionStorage.setItem(key, "1");
      } catch {}
    }
  }

  if (!banner || !show) return null;

  const title = pickI18n(banner, "titleEn", locale) || banner.titleEn;
  const message = pickI18n(banner, "messageEn", locale) || banner.messageEn;
  const ctaLabel =
    pickI18n(banner, "ctaLabelEn", locale) || banner.ctaLabelEn;
  const mode = banner.displayMode || "modal";

  if (mode === "top-bar") {
    return (
      <div className="fixed left-0 right-0 top-0 z-[60] flex items-center justify-between gap-4 border-b border-canela/30 bg-canela px-6 py-3 text-sm text-ink">
        <div className="flex items-center gap-3">
          <span className="font-medium">{title}</span>
          {message && <span className="opacity-80">— {message}</span>}
          {ctaLabel && banner.ctaHref && (
            <Link
              href={banner.ctaHref}
              className="font-bold underline hover:no-underline"
              onClick={dismiss}
            >
              {ctaLabel}
            </Link>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="rounded-full p-1 hover:bg-ink/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (mode === "bottom-slide") {
    return (
      <div className="fixed bottom-4 right-4 z-[60] w-[90vw] max-w-sm overflow-hidden rounded-2xl border border-canela/20 bg-cream shadow-2xl">
        {banner.image && (
          <Image
            src={urlFor(banner.image).width(800).height(400).url()}
            alt={title}
            width={800}
            height={400}
            className="h-32 w-full object-cover"
          />
        )}
        <div className="p-5">
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="float-right -mr-2 -mt-2 rounded-full p-1 hover:bg-canela-light"
          >
            <X className="h-4 w-4" />
          </button>
          <h3 className="font-display text-xl">{title}</h3>
          {message && (
            <p className="mt-2 text-sm text-ink-soft">{message}</p>
          )}
          {ctaLabel && banner.ctaHref && (
            <Link
              href={banner.ctaHref}
              className="btn-primary mt-4 inline-flex"
              onClick={dismiss}
            >
              {ctaLabel}
            </Link>
          )}
        </div>
      </div>
    );
  }

  // modal
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-cream shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-full bg-cream p-2 shadow hover:bg-canela-light"
        >
          <X className="h-4 w-4" />
        </button>
        {banner.image && (
          <Image
            src={urlFor(banner.image).width(900).height(500).url()}
            alt={title}
            width={900}
            height={500}
            className="h-56 w-full object-cover"
          />
        )}
        <div className="p-7 text-center">
          <h2 className="font-display text-3xl tracking-tight">{title}</h2>
          {message && (
            <p className="mt-3 text-sm text-ink-soft">{message}</p>
          )}
          {ctaLabel && banner.ctaHref && (
            <Link
              href={banner.ctaHref}
              className="btn-primary mt-6 inline-flex"
              onClick={dismiss}
            >
              {ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
