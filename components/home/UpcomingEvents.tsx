"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar, ArrowUpRight } from "lucide-react";
import { useLocale, pickI18n } from "@/lib/i18n/locale-provider";
import { urlFor } from "@/sanity/lib/image";
import type { BakeryEvent } from "@/types";

export function UpcomingEvents({ events }: { events: BakeryEvent[] }) {
  const { t, locale } = useLocale();
  if (!events?.length) return null;

  return (
    <section className="container-bakery py-24">
      <div className="mb-12 flex flex-col items-end justify-between gap-6 md:flex-row">
        <div className="max-w-2xl">
          <span className="eyebrow">{t("home.whatsNext")}</span>
          <h2 className="section-title mt-2">
            {t("home.comeSayHola")}{" "}
            <span className="font-script text-canela-dark">
              {t("home.comeSayHolaAccent")}
            </span>
          </h2>
          <p className="mt-4 text-base text-ink-soft md:text-lg">
            {t("home.eventsSubtitle")}
          </p>
        </div>
        <Link
          href="/events"
          className="link-underline text-sm font-medium text-ink"
        >
          {t("home.allEvents")} →
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {events.slice(0, 3).map((e) => {
          const title = pickI18n(e, "title", locale) || e.title;
          const date = e.dateLabel
            ? e.dateLabel
            : new Date(e.startDate).toLocaleDateString(
                locale === "es" ? "es-MX" : "en-CA",
                { month: "short", day: "numeric", year: "numeric" }
              );

          const Inner = (
            <>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-canela-light">
                {e.image ? (
                  <Image
                    src={urlFor(e.image).width(800).height(600).url()}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-canela">
                    <Calendar className="h-12 w-12 text-cream" />
                  </div>
                )}
                <div className="absolute right-4 top-4 rounded-full bg-cream px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                  {date}
                </div>
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl">{title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                    <MapPin className="h-3.5 w-3.5" />
                    {e.location}
                  </p>
                </div>
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </div>
            </>
          );

          return e.externalUrl ? (
            <a
              key={e._id}
              href={e.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              {Inner}
            </a>
          ) : (
            <Link key={e._id} href={`/events`} className="group block">
              {Inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
