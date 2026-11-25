"use client";

import { Crown, TrendingUp, Clock } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import {
  progress,
  describeStanding,
  TIER_ORDER,
  tierRank,
  type Standing,
} from "@/lib/loyalty/standing";

/**
 * Where a member stands, and what is close.
 *
 * The addendum asked for progress that is easy to understand without
 * exposing a formula, so this shows the ladder, a bar, one sentence and
 * nothing else. No credit counts, no arithmetic — "4 to go" is as numeric
 * as it gets.
 *
 * Only rendered when the earned scheme is switched on; see
 * lib/loyalty/standing.ts.
 */
export function ClubProgress({ standing: s }: { standing: Standing }) {
  const { locale } = useLocale();
  const es = locale === "es";
  const p = progress(s);
  const here = tierRank(s.tier);

  return (
    <section className="rounded-3xl border border-gold/30 bg-cream p-6 md:p-8">
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-gold" />
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-gold">
          {es ? "Tu lugar" : "Your place"}
        </span>
      </div>

      <h2 className="mt-2 font-display text-3xl">{s.tier}</h2>
      <p className="mt-2 text-sm text-ink-soft">{describeStanding(s, locale)}</p>

      {/* The ladder. Where they are, and what is above. */}
      <ol className="mt-6 flex gap-1">
        {TIER_ORDER.map((tier, i) => (
          <li key={tier} className="flex-1">
            <div
              className={cn(
                "h-1.5 rounded-full",
                i < here ? "bg-gold" : i === here ? "bg-canela-dark" : "bg-canela/20"
              )}
            />
            <p
              className={cn(
                "mt-2 text-[10px] uppercase tracking-widest",
                i <= here ? "font-bold text-ink" : "text-ink-soft"
              )}
            >
              {tier}
            </p>
          </li>
        ))}
      </ol>

      {p.next && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-canela-dark" />
              {es ? `Camino a ${p.next}` : `On the way to ${p.next}`}
            </span>
            <span>{Math.round(p.fraction * 100)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-canela/20">
            <div
              className="h-full rounded-full bg-canela-dark transition-all duration-700"
              style={{ width: `${Math.round(p.fraction * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Said before it happens, never after. */}
      {s.inGrace && (
        <p className="mt-6 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          {es
            ? `Hace un tiempo que no te vemos. Conservas ${s.tier} ${s.graceDaysLeft} días más — una compra lo renueva.`
            : `It's been a while. You keep ${s.tier} for ${s.graceDaysLeft} more days — one order renews it.`}
        </p>
      )}
    </section>
  );
}
