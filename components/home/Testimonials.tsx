import { Quote } from "lucide-react";
import type { Testimonial } from "@/types";

type Props = { testimonials: Testimonial[] };

export function Testimonials({ testimonials }: Props) {
  if (!testimonials?.length) return null;

  return (
    <section className="relative bg-masa/60 py-20 md:py-28">
      <div className="container-bakery">
        <div className="mb-14 text-center">
          <span className="eyebrow mb-3">Kind words</span>
          <h2 className="section-title mx-auto max-w-2xl">
            From the <span className="italic text-canela">Karyana family.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {testimonials.slice(0, 3).map((t, i) => (
            <figure
              key={t._id}
              className={`relative flex flex-col rounded-3xl bg-cream p-8 shadow-sm transition-transform duration-500 hover:-translate-y-1 md:p-10 ${
                i === 1 ? "md:mt-10" : ""
              }`}
            >
              <Quote
                className={`h-8 w-8 ${t.accent || "text-otomi-red"}`}
                strokeWidth={1.5}
              />
              <blockquote className="mt-5 flex-1 font-display text-xl leading-relaxed text-ink md:text-2xl">
                {t.quote}
              </blockquote>
              <figcaption className="mt-8 border-t border-canela/10 pt-5">
                <div className="font-medium text-ink">{t.author}</div>
                {t.role && (
                  <div className="mt-0.5 text-xs uppercase tracking-widest text-ink/50">
                    {t.role}
                  </div>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
