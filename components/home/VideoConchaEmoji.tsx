"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";

// ← Cambia esto al ID real del video de Karyana
const YOUTUBE_ID = "fzzXToN-SJc";

export function ConchaVideoSection() {
  const { locale } = useLocale();
  const [playing, setPlaying] = useState(false);

  return (
    <section className="bg-ink py-20 md:py-28">
      <div className="container-bakery">
        <div className="mb-10 max-w-2xl text-cream">
          <span className="eyebrow text-canela">
            {locale === "es" ? "Mira cómo las hacemos" : "Watch how we make them"}
          </span>
          <h2 className="section-title mt-2 text-cream">
            {locale === "es" ? "El arte de la " : "The art of the "}
            <span className="font-script text-canela">concha.</span>
          </h2>
          <p className="mt-4 text-base text-cream/70">
            {locale === "es"
              ? "Cada concha es formada a mano, con la misma técnica que se usa en las panaderías de México. Mira el proceso."
              : "Every concha is hand-shaped using the same technique from Mexican panaderías. Watch the process."}
          </p>
        </div>

        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl">
          {playing ? (
            <div className="relative aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1&rel=0&modestbranding=1`}
                title="Karyana Bakery — Conchas"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          ) : (
            <button
              onClick={() => setPlaying(true)}
              className="group relative block aspect-video w-full"
              aria-label="Play video"
            >
              <img
                src={`https://img.youtube.com/vi/${YOUTUBE_ID}/maxresdefault.jpg`}
                alt="Karyana Bakery conchas video"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-ink/30 transition-colors group-hover:bg-ink/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cream/90 shadow-xl transition-transform group-hover:scale-110 md:h-24 md:w-24">
                  <Play className="ml-1 h-8 w-8 text-canela-dark md:h-10 md:w-10" fill="currentColor" />
                </div>
              </div>
              <div className="absolute bottom-4 right-4 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-cream backdrop-blur-sm">
                2:30
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}