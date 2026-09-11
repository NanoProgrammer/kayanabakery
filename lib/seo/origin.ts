import { headers } from "next/headers";

/**
 * The origin the page was actually requested from (karyanabakery.ca or
 * karyanabakery.com — the site runs on both).
 *
 * og:url and the canonical link must match the domain the visitor/crawler
 * used. Building them from NEXT_PUBLIC_APP_URL instead pins every page to
 * one domain, so a .ca link declares itself canonical at .com; WhatsApp
 * treats that as the content living elsewhere and drops the whole preview
 * card — no title, no description, no image.
 */
export async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) {
    return (
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      "https://www.karyanabakery.ca"
    );
  }
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}
