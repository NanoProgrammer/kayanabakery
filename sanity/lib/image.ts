import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "./client";

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source).auto("format").quality(80);
}

/** Standard Open Graph banner size. */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/**
 * Absolute og:image/twitter:image URL for a Sanity image, or null when the
 * source can't produce one (missing/broken asset reference).
 *
 * Three things matter here, all of them learned the hard way:
 *  - Size. WhatsApp silently drops preview images over roughly 300KB, while
 *    Facebook happily renders multi-megabyte ones — which is why the same
 *    tags previewed fine in Facebook's debugger and showed no image at all
 *    in WhatsApp. 1200x630 at quality 70 lands well under that.
 *  - Format. auto("format") serves WebP/AVIF based on the requester's
 *    Accept header; crawlers handle those inconsistently, so force JPEG.
 *  - Never throwing. builder.image() throws on a malformed source, and an
 *    exception here takes down the page's entire metadata (no title, no
 *    description, no image), so callers get null instead.
 */
export function ogImageUrl(
  source: SanityImageSource | undefined | null
): string | null {
  if (!source) return null;
  try {
    return builder
      .image(source)
      .width(OG_IMAGE_WIDTH)
      .height(OG_IMAGE_HEIGHT)
      .fit("crop")
      .format("jpg")
      .quality(70)
      .url();
  } catch {
    return null;
  }
}
