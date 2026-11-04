/**
 * Where to send someone who is already signed in and opens /login or /register.
 *
 * Leaving those pages reachable while signed in is how a customer ends up
 * with two accounts: the form is right there, it works, and nothing says the
 * browser already has a session. Then the orders, points and addresses are
 * split across two accounts and only one of them is the one the staff can
 * find.
 *
 * So the pages are closed while a session exists. This decides where the
 * person lands instead — and it is the only thing deciding it, because a
 * redirect target taken from the URL is an open redirect unless something
 * checks it.
 */
export const SIGNED_IN_NOTICE = "already-signed-in";

/**
 * Only a path on this site. A `callbackUrl` arrives in the query string,
 * which means anyone can put anything there: `//evil.example.com` and
 * `https://evil.example.com` are both redirects off the site, and
 * `/\evil.example.com` is one in several browsers. Anything that is not a
 * plain single-slash path is refused rather than cleaned up.
 */
export function safeInternalPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.startsWith("/\\")) return null;
  // A backslash anywhere in the authority position, and control characters
  // that browsers strip before parsing, both turn into off-site redirects.
  if (/[\x00-\x1f\x7f]/.test(raw)) return null;
  // Sending someone back to the page they were just bounced off would loop.
  if (isAuthPage(raw)) return null;
  return raw;
}

/**
 * The pages that are closed to someone who already has a session.
 *
 * Password reset is deliberately NOT one of them. A reset link is opened from
 * an email, often in a browser that still has a session, and bouncing it
 * would leave the customer unable to use the link they were sent — which is
 * the exact problem the reset flow was built for.
 */
export function isAuthPage(pathname: string): boolean {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  return path === "/login" || path === "/register" || path === "/signup";
}

/**
 * The destination, with the notice flag that makes the page say what
 * happened. Without it the redirect is silent and reads as the site being
 * broken — which is the complaint that started this.
 */
export function signedInRedirect(callbackUrl?: string | null): string {
  const target = safeInternalPath(callbackUrl) ?? "/account/overview";
  const sep = target.includes("?") ? "&" : "?";
  return `${target}${sep}notice=${SIGNED_IN_NOTICE}`;
}
