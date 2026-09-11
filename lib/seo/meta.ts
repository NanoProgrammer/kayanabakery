/**
 * Flattens CMS text for use inside an HTML meta tag's content attribute.
 *
 * Sanity's description fields are multi-line, and the raw value was being
 * emitted straight into the attribute — newline and all:
 *
 *   <meta property="og:description" content="Size: 8 x 3 inches
 *   Serves approximately 8-10 people"/>
 *
 * That's legal HTML, and full parsers (browsers, Facebook's crawler) read it
 * fine — but simple regex-based link-preview parsers like WhatsApp's stop at
 * the line break and end up with no usable tags, producing a preview with no
 * title, description, or image.
 *
 * Also caps length: link previews truncate around 200 characters anyway, and
 * shorter values keep the head small.
 */
export function cleanMetaText(
  text: string | undefined | null,
  maxLength = 200
): string | undefined {
  if (!text) return undefined;

  const collapsed = text.replace(/\s+/g, " ").trim();
  if (!collapsed) return undefined;

  if (collapsed.length <= maxLength) return collapsed;
  return collapsed.slice(0, maxLength - 1).trimEnd() + "…";
}
