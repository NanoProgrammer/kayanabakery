import Link from "next/link";
import { Gift, ArrowRight } from "lucide-react";

type Props = { discount?: number };

export function ReferralBanner({ discount = 10 }: Props) {
  return (
    <section className="relative overflow-hidden bg-canela py-20 md:py-24">
      <div className="grain absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          className="absolute left-[8%] top-1/2 h-32 w-32 -translate-y-1/2 text-otomi-yellow/20"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <path d="M50 10 L55 40 L85 35 L60 55 L80 85 L50 65 L20 85 L40 55 L15 35 L45 40 Z" />
        </svg>
        <svg
          className="absolute right-[8%] top-1/2 h-40 w-40 -translate-y-1/2 text-concha-rosa/20"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <path d="M50 10 L55 40 L85 35 L60 55 L80 85 L50 65 L20 85 L40 55 L15 35 L45 40 Z" />
        </svg>
      </div>

      <div className="container-bakery relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cream/20 bg-cream/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-cream/80 backdrop-blur-sm">
            <Gift className="h-3.5 w-3.5" />
            Refer a friend
          </div>

          <h2 className="font-display text-[length:var(--text-display-lg)] leading-[var(--text-display-lg--line-height)] tracking-[var(--text-display-lg--letter-spacing)] text-cream">
            <span className="font-script text-otomi-yellow">
              &ldquo;Las penas con pan
            </span>
            <br />
            <span className="italic">son menos.&rdquo;</span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-cream/75">
            Sorrows are softer with bread. Share Karyana with a friend and
            you&apos;ll both get{" "}
            <span className="font-semibold text-otomi-yellow">
              ${discount} off
            </span>{" "}
            your next order. Because good pan dulce is meant to be shared.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/refer-a-friend"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-cream px-7 py-3.5 text-sm font-medium text-canela transition-all duration-300 hover:bg-otomi-yellow active:scale-[0.98]"
            >
              Get your link
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/how-to-order"
              className="inline-flex items-center gap-2 text-sm font-medium text-cream/80 underline-offset-4 transition-colors hover:text-cream hover:underline"
            >
              How it works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
