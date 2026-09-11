import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "./client";

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source).auto("format").quality(80);
}

/**
 * For og:image/twitter:image URLs specifically. Link-preview crawlers
 * (WhatsApp in particular) negotiate content formats differently than
 * browsers and can silently fail to render AVIF/WebP — which `auto("format")`
 * may serve them — showing no image at all even though the tag is present
 * and correct. Forcing a plain JPEG here sidesteps that entirely.
 */
export function ogImageUrlFor(source: SanityImageSource) {
  return builder.image(source).format("jpg").quality(85);
}
