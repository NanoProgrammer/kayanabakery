import Image from "next/image";
import Link from "next/link";
import { sanityFetch } from "@/sanity/lib/fetch";
import { allEventsQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import { Calendar, MapPin, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import type { BakeryEvent } from "@/types";

export const revalidate = 60;
export const metadata = { title: "Events · Karyana Bakery" };

export default async function EventsPage() {
  const events = await sanityFetch<BakeryEvent[]>({
    query: allEventsQuery,
    tags: ["event"],
  });

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.startDate).getTime() >= now);
  const past = events.filter((e) => new Date(e.startDate).getTime() < now);

  return (
    <div className="container-bakery py-16 md:py-24">
      <header className="mb-16 text-center">
        <span className="eyebrow mb-3">Pop-ups, markets & more</span>
        <h1 className="section-title mx-auto max-w-3xl">
          Come say <span className="italic text-otomi-teal">hola</span> in
          person.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-ink/70">
          We love meeting the people behind the orders. Here&apos;s where
          you&apos;ll find us.
        </p>
      </header>

      {upcoming.length > 0 && (
        <section className="mb-20">
          <h2 className="mb-8 font-display text-2xl text-ink">Upcoming</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {upcoming.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-8 font-display text-2xl text-ink/50">Past events</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <EventCard key={event._id} event={event} past />
            ))}
          </div>
        </section>
      )}

      {events.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-ink/60">No events scheduled yet. Stay tuned!</p>
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  past = false,
}: {
  event: BakeryEvent;
  past?: boolean;
}) {
  const startDate = new Date(event.startDate);
  const dateLabel =
    event.dateLabel ||
    (event.endDate
      ? `${format(startDate, "MMM d")} – ${format(
          new Date(event.endDate),
          "MMM d, yyyy"
        )}`
      : format(startDate, "MMMM d, yyyy"));

  const image = event.image
    ? urlFor(event.image).width(800).height(600).url()
    : null;

  const href = event.externalUrl || `/events/${event.slug}`;
  const isExternal = !!event.externalUrl;

  return (
    <Link
      href={href}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`group block overflow-hidden rounded-3xl bg-masa/40 transition-all hover:-translate-y-1 hover:shadow-xl ${
        past ? "opacity-60" : ""
      }`}
    >
      {image && (
        <div className="relative aspect-[16/10] overflow-hidden bg-masa">
          <Image
            src={image}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="font-display text-2xl text-ink transition-colors group-hover:text-otomi-red">
          {event.title}
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink/60">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> {dateLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> {event.location}
          </span>
        </div>
        {!past && (
          <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-canela">
            Learn more <ArrowUpRight className="h-4 w-4" />
          </div>
        )}
      </div>
    </Link>
  );
}
