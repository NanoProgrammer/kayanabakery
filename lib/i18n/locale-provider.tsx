"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

export type Locale = "en" | "es";
const DICT = { en, es } as const;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const COOKIE_NAME = "karyana-lang";

function readCookie(): Locale {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`)
  );
  const v = m?.[1] as Locale | undefined;
  return v === "es" || v === "en" ? v : "en";
}

function writeCookie(l: Locale) {
  if (typeof document === "undefined") return;
  // 1 year
  document.cookie = `${COOKIE_NAME}=${l}; path=/; max-age=31536000; SameSite=Lax`;
}

function lookup(dict: any, path: string): string | undefined {
  return path.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), dict);
}

export function LocaleProvider({
  initial = "en",
  children,
}: {
  initial?: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initial);

  // hydrate from cookie on mount
  useEffect(() => {
    const c = readCookie();
    if (c !== locale) setLocaleState(c);
    document.documentElement.lang = c;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setLocale = useCallback((l: Locale) => {
    writeCookie(l);
    setLocaleState(l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw =
        lookup(DICT[locale], key) ||
        lookup(DICT.en, key) ||
        key;
      if (typeof raw !== "string") return key;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, k) =>
        vars[k] != null ? String(vars[k]) : `{${k}}`
      );
    },
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Fallback for places that aren't wrapped (e.g. error pages)
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      t: (k: string) => k,
    };
  }
  return ctx;
}

/**
 * Pick the right field from a Sanity doc that has bilingual fields like
 *   { name: "Concha", nameEs: "Concha" }
 * Pass the EN field name (e.g. "name") and the doc; we'll return ES if
 * available and locale is ES, else EN.
 */
export function pickI18n<T extends Record<string, any>>(
  doc: T | null | undefined,
  enKey: keyof T & string,
  locale: Locale
): T[typeof enKey] | undefined {
  if (!doc) return undefined;
  if (locale === "es") {
    const esKey = `${enKey}Es` as keyof T;
    if (doc[esKey]) return doc[esKey] as T[typeof enKey];
  }
  return doc[enKey];
}
