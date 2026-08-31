"use client";

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

const REVIEWS_PER_PAGE = 6;

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

export const TOTAL_REVIEWS = 28; // Total real de reviews en Google

export function GoogleReviewsGrid() {
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_PAGE);

  const visibleReviews = REVIEWS.slice(0, visibleCount);
  const hasMore = visibleCount < TOTAL_REVIEWS;

  return (
    <>
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
    </>
  );
}
