import { cookies } from "next/headers";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import type { Locale } from "./locale-provider";

const DICT = { en, es } as const;

export async function getServerLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get("karyana-lang")?.value;
  return v === "es" ? "es" : "en";
}

function lookup(dict: any, path: string): string | undefined {
  return path.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), dict);
}

/** Server-side translation helper for RSC. */
export async function getServerT() {
  const locale = await getServerLocale();
  return (key: string, vars?: Record<string, string | number>) => {
    const raw = lookup(DICT[locale], key) || lookup(DICT.en, key) || key;
    if (typeof raw !== "string") return key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, k) =>
      vars[k] != null ? String(vars[k]) : `{${k}}`
    );
  };
}
