import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, ArrowUpRight } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";
import { format } from "date-fns";
import type { BakeryEvent } from "@/types";

type Props = { events: BakeryEvent[] };

export function UpcomingEvents({ events }: Props) {
  if (!events?.length) return null;

  return (
    <section className="relative bg-cream py-20 md:py-28">
      <div className="container-bakery">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="eyebrow mb-3">What&apos;s next</span>
            <h2 className="section-title">
              Come say <span className="italic text-otomi-teal">hola.</span>
            </h2>
            <p className="mt-4 max-w-md text-ink/70">
              Find us at markets, pop-ups and festivals across Calgary.
            </p>
          </div>
          <Link
            href="/events"
            className="group inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-canela"
          >
            <span className="link-underline">All events</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="divide-y divide-canela/15 border-y border-canela/15">
          {events.slice(0, 5).map((event) => {
            const startDate = new Date(event.startDate);
            const day = format(startDate, "dd");
            const month = format(startDate, "MMM").toUpperCase();
            const dateLabel =
              event.dateLabel ||
              (event.endDate
                ? `${format(startDate, "MMM d")} – ${format(
                    new Date(event.endDate),
                    "MMM d, yyyy"
                  )}`
                : format(startDate, "MMMM d, yyyy"));

            const image = event.image
              ? urlFor(event.image).width(400).height(300).url()
              : null;

            const isExternal = !!event.externalUrl;
            const href = isExternal
              ? event.externalUrl!
              : `/events/${event.slug}`;

            const anchorProps = isExternal
              ? {
                  target: "_blank",
                  rel: "noopener noreferrer",
                }
              : {};

            return (
              <Link
                key={event._id}
                href={href}
                {...anchorProps}
                className="group grid grid-cols-12 items-center gap-4 py-8 transition-colors hover:bg-masa/40 md:gap-8 md:py-10"
              >
                <div className="col-span-3 md:col-span-2">
                  <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl border border-canela/20 text-canela md:h-24 md:w-24">
                    <span className="font-display text-3xl leading-none md:text-4xl">
                      {day}
                    </span>
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-otomi-red">
                      {month}
                    </span>
                  </div>
                </div>

                <div className="col-span-9 md:col-span-6">
                  <h3 className="font-display text-xl text-ink transition-colors group-hover:text-otomi-red md:text-3xl">
                    {event.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink/60 md:text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {dateLabel}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.location}
                    </span>
                  </div>
                </div>

                {image && (
                  <div className="col-span-12 hidden md:col-span-3 md:block">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-masa">
                      <Image
                        src={image}
                        alt={event.title}
                        fill
                        sizes="25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </div>
                )}

                <div className="col-span-12 hidden md:col-span-1 md:flex md:justify-end">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-canela/20 text-canela transition-all duration-300 group-hover:border-canela group-hover:bg-canela group-hover:text-cream">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
