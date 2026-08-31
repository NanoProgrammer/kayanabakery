import Link from "next/link";
import { Star } from "lucide-react";
import { GoogleReviewsGrid, TOTAL_REVIEWS } from "./GoogleReviewsGrid";

// ==========================================================
// Configuration
// ==========================================================
const AVERAGE_RATING = 5.0; // Todas son 5 stars
const GOOGLE_PROFILE_URL = "https://maps.app.goo.gl/zkvg5uyPpBPrU4Xn8";

// ==========================================================
// Sub-components
// ==========================================================

function GoogleLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

function StarRow({
  rating,
  size = "h-3.5 w-3.5",
}: {
  rating: number;
  size?: string;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${
            i <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

// ==========================================================
// Main component
// ==========================================================

export function GoogleReviewsSection() {
  // Compute rating bar distribution
  // Usar datos hardcodeados para reflejar las 28 reviews reales
  const ratingCounts = {
    5: 28,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = ratingCounts[stars as keyof typeof ratingCounts];
    const pct = (count / TOTAL_REVIEWS) * 100;
    return { stars, count, pct };
  });

  return (
    <section className="bg-cream py-20 md:py-28">
      <div className="container-bakery">
        {/* Section heading */}
        <header className="mb-10 text-center">
          <span className="eyebrow mb-3">Real reviews</span>
          <h2 className="font-display text-4xl text-ink md:text-5xl">
            What our <span className="italic text-canela">customers</span> say
          </h2>
        </header>

        {/* Google-styled summary card */}
        <div className="mx-auto mb-10 max-w-3xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-10">
            {/* Logo + score */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-2">
                <GoogleLogo className="h-6 w-6" />
                <span className="text-sm font-medium text-gray-700">
                  Reviews
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-5xl font-medium text-gray-900">
                  {AVERAGE_RATING.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">/ 5</span>
              </div>
              <StarRow rating={Math.round(AVERAGE_RATING)} size="h-4 w-4" />
              <p className="mt-2 text-xs text-gray-500">
                Based on {TOTAL_REVIEWS} Google reviews
              </p>
            </div>

            {/* Distribution bars */}
            <div className="flex-1 space-y-1.5 self-stretch md:self-center md:pl-6 md:border-l md:border-gray-200">
              {distribution.map(({ stars, count, pct }) => (
                <div key={stars} className="flex items-center gap-2.5">
                  <span className="w-3 text-xs text-gray-600">{stars}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs text-gray-500">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA row */}
          <div className="mt-6 flex flex-col items-center gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-between">
            <p className="text-xs text-gray-500">
              Powered by Google
            </p>
            <Link
              href={GOOGLE_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <GoogleLogo className="h-4 w-4" />
              Write a review on Google
            </Link>
          </div>
        </div>

        <GoogleReviewsGrid />

        {/* Footer link */}
        <footer className="mt-10 text-center">
          <Link
            href={GOOGLE_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <span>See all reviews on</span>
            <GoogleLogo className="h-4 w-4" />
            <span className="font-bold">Google</span>
          </Link>
        </footer>
      </div>
    </section>
  );
}
