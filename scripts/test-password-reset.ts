/**
 * Password reset links.
 *
 * A customer of years couldn't sign in, there was no "forgot password"
 * anywhere on the site, and the bakery had nothing to offer her but an
 * apology. These are the rules the new links follow.
 *
 *   npm run test:reset
 */
process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "test-secret-for-signing";

import {
  createResetToken,
  readResetToken,
  resetLink,
  verifyResetToken,
} from "../lib/auth/password-reset";

let passed = 0;
let failed = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
    console.log(`      expected: ${JSON.stringify(expected)}`);
    console.log(`      got:      ${JSON.stringify(actual)}`);
  }
}

const NOW = new Date("2026-10-26T12:00:00Z");
const later = (mins: number) => new Date(NOW.getTime() + mins * 60_000);

const USER = "cus_odette";
const HASH = "$2a$10$abcdefghijklmnopqrstuv";

console.log("\nPassword reset links\n");

console.log("1. A link that works\n");

const token = createResetToken(USER, HASH, NOW);

check("it verifies", verifyResetToken(token, HASH, NOW), { ok: true, userId: USER });
check("it names the right account", readResetToken(token)?.userId, USER);
check("still good 59 minutes later", verifyResetToken(token, HASH, later(59)).ok, true);

console.log("\n2. A link that doesn't\n");

check(
  "it expires after an hour",
  verifyResetToken(token, HASH, later(61)),
  { ok: false, reason: "expired" }
);
check(
  "it cannot be used twice — the password it set changes the hash",
  verifyResetToken(token, "$2a$10$a-completely-different-hash", NOW),
  { ok: false, reason: "used" }
);
check(
  "a token for one account doesn't work on another's hash",
  verifyResetToken(createResetToken("someone_else", "other-hash", NOW), HASH, NOW).ok,
  false
);

console.log("\n3. Nothing can be forged\n");

const [body, signature] = token.split(".");

check("a tampered signature fails", verifyResetToken(`${body}.AAAA${signature.slice(4)}`, HASH, NOW).ok, false);
check("no signature at all fails", verifyResetToken(body, HASH, NOW).ok, false);
check(
  "a body edited to name another account fails",
  verifyResetToken(
    `${Buffer.from(`admin_user.${NOW.getTime() + 60_000}.n`).toString("base64url")}.${signature}`,
    HASH,
    NOW
  ).ok,
  false
);
check(
  "a body edited to never expire fails",
  verifyResetToken(
    `${Buffer.from(`${USER}.${NOW.getTime() + 1e12}.n`).toString("base64url")}.${signature}`,
    HASH,
    NOW
  ).ok,
  false
);

for (const junk of ["", "...", "not-a-token", "a.b.c.d", "🥖"]) {
  check(`garbage input (${JSON.stringify(junk)})`, verifyResetToken(junk, HASH, NOW).ok, false);
}

console.log("\n4. An account that never had a password\n");

// Someone who only ever signed in with Google. This is the likeliest reason a
// long-standing customer gets "Invalid credentials" — there is no password to
// be wrong — and the same flow has to let her set one.
const googleOnly = createResetToken(USER, null, NOW);
check("a link can still be made", verifyResetToken(googleOnly, null, NOW), { ok: true, userId: USER });
check(
  "and stops working once she has a password",
  verifyResetToken(googleOnly, HASH, NOW).ok,
  false
);

console.log("\n5. Two links in the same second differ\n");

check(
  "they are not the same string",
  createResetToken(USER, HASH, NOW) !== createResetToken(USER, HASH, NOW),
  true
);
check(
  "but both work",
  [createResetToken(USER, HASH, NOW), createResetToken(USER, HASH, NOW)]
    .every((t) => verifyResetToken(t, HASH, NOW).ok),
  true
);

console.log("\n6. The link itself\n");

check(
  "points at the reset page",
  resetLink("https://www.karyanabakery.ca/", "abc.def").startsWith(
    "https://www.karyanabakery.ca/reset-password?token="
  ),
  true
);
check(
  "and survives characters that need escaping",
  decodeURIComponent(
    resetLink("https://x.ca", "a+b/c=d").split("token=")[1]
  ),
  "a+b/c=d"
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
