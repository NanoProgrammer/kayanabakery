/**
 * Google Analytics (GA4) helper. Safe to call from anywhere client-side —
 * no-ops if gtag hasn't loaded yet (e.g. consent not yet given, script
 * still loading, or running server-side).
 */

export const GA_MEASUREMENT_ID = "G-Y1XFSDDE69";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function pageview(url: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("config", GA_MEASUREMENT_ID, { page_path: url });
}

export type GAItem = {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
};

/**
 * Fires a GA4 event. Use GA4's reserved ecommerce event names
 * (view_item, add_to_cart, begin_checkout, purchase, sign_up,
 * generate_lead, ...) so they show up in GA4's built-in reports.
 */
export function trackEvent(
  action: string,
  params: Record<string, unknown> = {}
) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", action, params);
}
