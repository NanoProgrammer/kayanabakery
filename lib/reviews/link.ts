/**
 * Where a customer goes to leave a Google review.
 *
 * The default is built from the bakery's Google listing id, taken from the
 * search URL. It opens the listing with the review panel ready, which works
 * from any device without a sign-in detour.
 *
 * Prefer setting GOOGLE_REVIEW_URL to the short link from Google Business
 * Profile ("Ask for reviews" → a g.page/r/…/review address). That one drops
 * the customer straight into the star picker, and Google counts the clicks.
 */
const LISTING_CID = "2846011783105315821";

export const GOOGLE_REVIEW_URL =
  process.env.GOOGLE_REVIEW_URL ||
  `https://www.google.com/maps?cid=${LISTING_CID}`;

/** Shown to a person, so it reads as a place rather than a tracking string. */
export const GOOGLE_REVIEW_SHORT = "Google";
