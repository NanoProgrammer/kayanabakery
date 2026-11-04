/**
 * Closing /login and /register to people who are already signed in.
 *
 *   npm run test:signedin
 *
 * Two things are being tested: that the auth pages are recognised, and that
 * the place someone is sent instead cannot be pointed off the site by
 * whoever wrote the link.
 */
import {
  isAuthPage,
  safeInternalPath,
  signedInRedirect,
  SIGNED_IN_NOTICE,
} from "../lib/auth/signed-in-redirect";

let passed = 0;
let failed = 0;
function check(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
    console.log(`      expected: ${JSON.stringify(expected)}`);
    console.log(`      got:      ${JSON.stringify(actual)}`);
  }
}

console.log("\nAlready signed in\n");

console.log("  which pages are closed");
for (const p of ["/login", "/register", "/signup"]) {
  check(`${p} is closed while signed in`, isAuthPage(p), true);
}
// A reset link is opened from an email, often in a browser that still has a
// session. Bouncing it would break the flow built for the customer who could
// not sign in in the first place.
check("a password reset link still opens", isAuthPage("/reset-password?token=abc"), false);
check("asking for a reset link still works", isAuthPage("/forgot-password"), false);
check("a trailing slash still counts", isAuthPage("/login/"), true);
check("a query string still counts", isAuthPage("/login?callbackUrl=/account"), true);
check("the shop is not an auth page", isAuthPage("/shop"), false);
check("the account area is not an auth page", isAuthPage("/account/overview"), false);
check("a page that merely starts with the word is not one", isAuthPage("/registers-of-cakes"), false);

console.log("\n  where they land");
check("by default, their account", signedInRedirect(null), `/account/overview?notice=${SIGNED_IN_NOTICE}`);
check(
  "where they were headed, when that is given",
  signedInRedirect("/account/orders"),
  `/account/orders?notice=${SIGNED_IN_NOTICE}`
);
check(
  "a target with its own query keeps it",
  signedInRedirect("/shop?category=cakes"),
  `/shop?category=cakes&notice=${SIGNED_IN_NOTICE}`
);
check(
  "never back to the page they were bounced off",
  signedInRedirect("/login"),
  `/account/overview?notice=${SIGNED_IN_NOTICE}`
);

console.log("\n  and never off the site");
check("an absolute URL is refused", safeInternalPath("https://evil.example.com"), null);
check("a protocol-relative URL is refused", safeInternalPath("//evil.example.com"), null);
check("a backslash authority is refused", safeInternalPath("/\\evil.example.com"), null);
check("a newline is refused", safeInternalPath("/account\n/x"), null);
check("a tab is refused", safeInternalPath("/ac\tcount"), null);
check("javascript: is refused", safeInternalPath("javascript:alert(1)"), null);
check("a bare word is refused", safeInternalPath("account"), null);
check("an empty string is refused", safeInternalPath(""), null);
check("a plain path is allowed", safeInternalPath("/account/orders"), "/account/orders");
check(
  "an off-site callbackUrl falls back to the account page, not to itself",
  signedInRedirect("https://evil.example.com"),
  `/account/overview?notice=${SIGNED_IN_NOTICE}`
);
check(
  "...and the result never contains the attacker's host",
  signedInRedirect("https://evil.example.com").includes("evil.example.com"),
  false
);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
