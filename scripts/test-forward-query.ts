/**
 * Query strings surviving a redirect.
 *
 *   npm run test:query
 *
 * `/account` redirects to the overview, and did it with a bare path — so
 * `/account?welcome=1` lost the flag and the "your account is set up" banner
 * never showed. This is the piece that was missing.
 */
import { withQuery } from "../lib/routing/forward-query";

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

console.log("\nForwarding the query string\n");

check(
  "the flag that shows the banner survives",
  withQuery("/account/overview", { welcome: "1" }),
  "/account/overview?welcome=1"
);
check("nothing to carry leaves a clean path", withQuery("/account/overview", {}), "/account/overview");
check(
  "several params all come through",
  withQuery("/account/overview", { welcome: "1", ref: "abc" }),
  "/account/overview?welcome=1&ref=abc"
);
check(
  "a repeated param keeps every value",
  withQuery("/account/overview", { tag: ["a", "b"] }),
  "/account/overview?tag=a&tag=b"
);
check(
  "an absent value is not written as empty",
  withQuery("/account/overview", { welcome: "1", missing: undefined }),
  "/account/overview?welcome=1"
);
check(
  "values that need escaping are escaped",
  withQuery("/account/overview", { note: "a b&c" }),
  "/account/overview?note=a+b%26c"
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
