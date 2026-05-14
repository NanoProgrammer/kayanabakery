"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ThumbsUp } from "lucide-react";
import { useState } from "react";

// ==========================================================
// REVIEWS — actualiza este array cuando haya reviews nuevas
// ==========================================================

type Review = {
  author: string;
  authorMeta: string; // "Local Guide · 14 reviews" or "3 reviews · 1 photo"
  initials: string;
  avatarColor: string; // tailwind bg color for the initials circle
  timeAgo: string;
  rating: number;
  context?: string; // "Delivery · Breakfast · $60-70"
  text: string;
  helpful?: number;
  ownerReply?: string;
  ownerReplyTime?: string;
  photos?: number; // count of photos in the review
};

const REVIEWS: Review[] = [
  {
    author: "Marlena Catala",
    authorMeta: "4 reviews · 3 photos",
    initials: "M",
    avatarColor: "bg-rose-500",
    timeAgo: "6 months ago",
    rating: 5,
    text: "This bread looks and it's delicious. I truly was brought back to my home land when opening the box. The bread is amazing! The service was seamless and their attention to detail is chef's kiss! If anyone is curious about Mexican bread please give Karyana Bakery a try — you won't regret it.",
    helpful: 2,
    photos: 3,
    ownerReply:
      "We're so happy to read this! 🥰 It warms our hearts to know that our bread made you feel close to home. That's exactly our goal — to bring a little piece of Mexico to every bite 🇲🇽💛. Thank you for your kind words and for supporting Karyana Bakery!",
    ownerReplyTime: "6 months ago",
  },
  {
    author: "Miki Nyckel",
    authorMeta: "Local Guide · 240 reviews · 163 photos",
    initials: "M",
    avatarColor: "bg-purple-500",
    timeAgo: "2 months ago",
    rating: 5,
    text: "Delicious baked goods! Some of the absolute best I've tasted. Chef's kiss! 👌 Divine cakes that shine with the love and talent of the hands that baked them. I will buy their cakes every time and can't wait to find them again. 🤩🥰🤤",
    helpful: 1,
    ownerReply:
      "Thank you so much, Miki. Your beautiful words truly touched our hearts. Knowing that you can feel the love and passion behind our baking means everything to us. Our greatest wish is to create moments you can look forward to again and again, and we would be honored to be part of your sweet ritual whenever you crave something special. We can't wait to bake for you again soon. 💗",
    ownerReplyTime: "2 months ago",
  },
  {
    author: "Vanessa Vieyra",
    authorMeta: "2 reviews",
    initials: "V",
    avatarColor: "bg-emerald-500",
    timeAgo: "4 months ago",
    rating: 5,
    context: "Delivery · $1–10",
    text: "Karyana Ruiz Bakery truly lives up to its slogan: Mexican roots, incomparable taste. I tried the conchas and puerquitos, and they were absolutely delicious, just like the pan dulce back home in Mexico. Even after three days, a quick 10-second warm-up made them taste fresh out of the oven.",
    helpful: 1,
    ownerReply:
      "Thank you so much for this beautiful review! ✨ Your words truly touched our hearts. Knowing that our bread brought you back to Mexico and reminded you of those special moments, means everything to us. That feeling of home is exactly what we hope to share through our bread. Thank you for trusting us and for recommending our bakery. We can't wait to welcome you again very soon 💖 Con mucho cariño, Karyana Bakery 🫶",
    ownerReplyTime: "4 months ago",
  },
  {
    author: "Nayeli Gijon",
    authorMeta: "3 reviews · 1 photo",
    initials: "N",
    avatarColor: "bg-amber-500",
    timeAgo: "4 months ago",
    rating: 5,
    text: "Bread was moist, fresh and tasty. They were really accommodating in terms of delivery.",
    helpful: 3,
    photos: 1,
    ownerReply:
      "Thank you so much for your wonderful review! It helps us improve every day! With much love, Karyana Bakery 🫶",
    ownerReplyTime: "4 months ago",
  },
  {
    author: "Samina Nazeer",
    authorMeta: "6 reviews · 1 photo",
    initials: "S",
    avatarColor: "bg-blue-500",
    timeAgo: "a year ago",
    rating: 5,
    context: "Take out · $70–80",
    text: "We ordered a birthday cake for my twins birthday party from Karyana's bakery and it did not only look amazing but was very delicious. Everyone enjoyed it. Will order again for sure!",
    helpful: 1,
    photos: 1,
    ownerReply: "Thank you so much Samina, so happy to bake for you 😊",
    ownerReplyTime: "a year ago",
  },
  {
    author: "Araceli Herrera",
    authorMeta: "13 reviews · 4 photos",
    initials: "A",
    avatarColor: "bg-pink-500",
    timeAgo: "11 months ago",
    rating: 5,
    context: "Delivery · Breakfast · $60–70",
    text: "Woooowwww Everything was excellent, genuine and delicious flavor, 100% Mexican bread.",
    helpful: 2,
    photos: 3,
    ownerReply:
      "Thank you Araceli, these comments motivate me to grow 🇲🇽🙌✨️",
    ownerReplyTime: "11 months ago",
  },
  {
    author: "Arlette Denton",
    authorMeta: "9 reviews · 1 photo",
    initials: "A",
    avatarColor: "bg-indigo-500",
    timeAgo: "a year ago",
    rating: 5,
    context: "Take out · $1–10",
    text: "Amazing bakery!!! The presentation, the flavors, the service, everything is simply perfect!! We can't wait to try the rest of her creations!",
    helpful: 2,
    photos: 1,
    ownerReply: "Thank you, happy to bake for you 😋🇲🇽✨️🙌",
    ownerReplyTime: "a year ago",
  },
  {
    author: "Jordan Fryers",
    authorMeta: "Local Guide · 14 reviews",
    initials: "J",
    avatarColor: "bg-teal-500",
    timeAgo: "2 months ago",
    rating: 5,
    text: "Baked goods, delivered! What an awesome concept and such a treat!",
    ownerReply:
      "Thank you so much, Jordan! We're so glad you enjoyed the experience. Your kind words mean a lot to us. We truly appreciate your support and hope to bake for you again very soon! 😊",
    ownerReplyTime: "2 months ago",
  },
  {
    author: "Carlos Alegría",
    authorMeta: "6 reviews",
    initials: "C",
    avatarColor: "bg-orange-500",
    timeAgo: "a year ago",
    rating: 5,
    text: "I love Karyna's homemade Mexican bread. They really taste like the ones you buy in Mexico. Her cakes are not only good looking, they are also delicious!",
    helpful: 3,
    ownerReply: "Thank you, for your support 😋🇲🇽✨️🙌",
    ownerReplyTime: "a year ago",
  },
  {
    author: "Reyna Ricardez",
    authorMeta: "1 review · 1 photo",
    initials: "R",
    avatarColor: "bg-red-500",
    timeAgo: "a year ago",
    rating: 5,
    text: "Delicious conchas accompanied with a coffee or hot chocolate. Churro my favorite flavor.",
    photos: 1,
    ownerReply: "Mil Gracias! Your review makes me feel delighted ☺️",
    ownerReplyTime: "a year ago",
  },
  {
    author: "Pablo L.N.",
    authorMeta: "14 reviews · 3 photos",
    initials: "P",
    avatarColor: "bg-cyan-500",
    timeAgo: "6 months ago",
    rating: 5,
    context: "Delivery · CA$30–40",
    text: "Amazing bread! Like if I was in Mexico! And fantastic service!",
  },
];

// ==========================================================
// Configuration
// ==========================================================
const BUSINESS_NAME = "Karyana Bakery";
const TOTAL_REVIEWS = 28; // Total real de reviews en Google
const AVERAGE_RATING = 5.0; // Todas son 5 stars
const GOOGLE_PROFILE_URL = "https://maps.app.goo.gl/zkvg5uyPpBPrU4Xn8";
const REVIEWS_PER_PAGE = 6;

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

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const [replyExpanded, setReplyExpanded] = useState(false);

  const isLong = review.text.length > 220;
  const visibleText =
    expanded || !isLong ? review.text : review.text.slice(0, 220) + "...";

  const replyIsLong = (review.ownerReply?.length ?? 0) > 180;
  const visibleReply =
    !review.ownerReply
      ? ""
      : replyExpanded || !replyIsLong
      ? review.ownerReply
      : review.ownerReply.slice(0, 180) + "...";

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <header className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white ${review.avatarColor}`}
        >
          {review.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            {review.author}
          </p>
          <p className="truncate text-xs text-gray-500">
            {review.authorMeta}
          </p>
        </div>
      </header>

      {/* Rating + time */}
      <div className="mt-3 flex items-center gap-2">
        <StarRow rating={review.rating} />
        <span className="text-xs text-gray-500">{review.timeAgo}</span>
      </div>

      {/* Context (Delivery / Take out etc.) */}
      {review.context && (
        <p className="mt-1.5 text-xs text-gray-500">{review.context}</p>
      )}

      {/* Review text */}
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-800">
        {visibleText}
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="ml-1 font-medium text-blue-700 hover:underline"
          >
            {expanded ? "Show less" : "More"}
          </button>
        )}
      </p>

      {/* Photo placeholders (just count, like Google does in some layouts) */}
      {review.photos && review.photos > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
          <span>
            📷 {review.photos} {review.photos === 1 ? "photo" : "photos"}
          </span>
        </div>
      )}

      {/* Helpful */}
      {review.helpful && review.helpful > 0 && (
        <div className="mt-3 flex items-center gap-1.5">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50"
            aria-label="Helpful"
          >
            <ThumbsUp className="h-3 w-3" />
            <span>{review.helpful}</span>
          </button>
        </div>
      )}

      {/* Owner reply */}
      {review.ownerReply && (
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-900">
            Response from the owner
            {review.ownerReplyTime && (
              <span className="ml-2 font-normal text-gray-500">
                {review.ownerReplyTime}
              </span>
            )}
          </p>
          <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-gray-700">
            {visibleReply}
            {replyIsLong && (
              <button
                type="button"
                onClick={() => setReplyExpanded(!replyExpanded)}
                className="ml-1 font-medium text-blue-700 hover:underline"
              >
                {replyExpanded ? "Show less" : "More"}
              </button>
            )}
          </p>
        </div>
      )}
    </article>
  );
}

// ==========================================================
// Main component
// ==========================================================

export function GoogleReviewsSection() {
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_PAGE);

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

  const visibleReviews = REVIEWS.slice(0, visibleCount);
  const hasMore = visibleCount < TOTAL_REVIEWS;

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

        {/* Review cards grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleReviews.map((review, i) => (
            <ReviewCard key={i} review={review} />
          ))}
        </div>

        {/* Load more button */}
        {hasMore && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setVisibleCount(visibleCount + REVIEWS_PER_PAGE)}
              className="rounded-full border border-gray-300 bg-white px-8 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              Load more reviews
            </button>
          </div>
        )}

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