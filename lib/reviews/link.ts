/**
 * Where a customer goes to leave a Google review.
 *
 * The default is the bakery's own listing URL with `!1b1` in it, which is the
 * part that opens the reviews tab rather than the overview — so the customer
 * lands on the list with the "write a review" button in front of them instead
 * of on a map they have to navigate.
 *
 * The query string Google appends to that URL when you copy it from the
 * address bar (`?entry=ttu&g_ep=…`) is a session token. It is deliberately
 * dropped: it expires, and a link that quietly stops working is worse than a
 * plain one. What is left is the stable part — the place id and the CID,
 * 2846011783105315821, the same listing the old `?cid=` link pointed at.
 *
 * GOOGLE_REVIEW_URL overrides it. The one worth setting is the short link from
 * Google Business Profile ("Ask for reviews" → a g.page/r/…/review address):
 * it drops the customer straight into the star picker, and Google counts the
 * clicks as review requests.
 */
const LISTING_URL =
  "https://www.google.com/maps/place/Karyana+Bakery/" +
  "@51.1477893,-114.1919476,17z/" +
  "data=!4m8!3m7!1s0x5371691dcf318a37:0x277f10a34e9183ed" +
  "!8m2!3d51.1477893!4d-114.1893727!9m1!1b1!16s%2Fg%2F11y7ddn4_j";

export const GOOGLE_REVIEW_URL = process.env.GOOGLE_REVIEW_URL || LISTING_URL;

/** Shown to a person, so it reads as a place rather than a tracking string. */
export const GOOGLE_REVIEW_SHORT = "Google";
