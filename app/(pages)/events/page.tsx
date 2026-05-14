import Image from "next/image";
import Link from "next/link";
import { sanityFetch } from "@/sanity/lib/fetch";
import { allEventsQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import { Calendar, MapPin, ArrowUpRight } from "lucide-react";
import type { BakeryEvent } from "@/types";

export const revalidate = 60;

export const metadata = { title: "Events" };

export default async function EventsPage() {
  const events = await sanityFetch<BakeryEvent[]>({
    query: allEventsQuery,
    tags: ["event"],
  });

  const now = Date.now();
  const upcoming = events
    .filter((e) => new Date(e.startDate).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  const past = events
    .filter((e) => new Date(e.startDate).getTime() < now)
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

  return (
    <div className="container-bakery py-16">
      <header className="mb-10">
        <span className="eyebrow">Markets, pop-ups, festivals</span>
        <h1 className="section-title mt-2">
          Find us{" "}
          <span className="font-script text-canela-dark">around Calgary.</span>
        </h1>
      </header>

      {upcoming.length > 0 && (
        <>
          <h2 className="mb-6 font-display text-2xl">Upcoming</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => (
              <EventCard key={e._id} event={e} />
            ))}
          </div>
        </>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mt-16 mb-6 font-display text-2xl text-ink-soft">
            Past
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {past.slice(0, 9).map((e) => (
              <EventCard key={e._id} event={e} muted />
            ))}
          </div>
        </>
      )}

      {events.length === 0 && (
        <p className="py-20 text-center text-ink-soft">
          No events scheduled yet. Check back soon!
        </p>
      )}
    </div>
  );
}

function EventCard({
  event,
  muted = false,
}: {
  event: BakeryEvent;
  muted?: boolean;
}) {
  const date = event.dateLabel
    ? event.dateLabel
    : new Date(event.startDate).toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  const Inner = (
    <div className={muted ? "opacity-60" : ""}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-canela-light">
        {event.image ? (
          <Image
            src={urlFor(event.image).width(800).height(600).url()}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-canela">
            <Calendar className="h-12 w-12 text-cream" />
          </div>
        )}
        <div className="absolute right-3 top-3 rounded-full bg-cream px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm">
          {date}
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl">{event.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5" />
            {event.location}
          </p>
        </div>
        {event.externalUrl && <ArrowUpRight className="h-4 w-4 mt-1" />}
      </div>
    </div>
  );

  return event.externalUrl ? (
    <a
      href={event.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      {Inner}
    </a>
  ) : (
    <div className="group block">{Inner}</div>
  );
}
