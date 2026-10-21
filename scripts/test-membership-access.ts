/**
 * Who the site treats as a member, and why.
 *
 * A Selecto member was shown "Selecto · $30/mo" on their account page and told
 * at checkout that members-only bread needed Artesano. Four places decided
 * membership and three of them disagreed; this covers the one rule they now
 * share.  Run it with:  npm run test:membership
 */
import {
  effectiveTier,
  membershipAccessReason,
  membershipGrantsBenefits,
} from "../lib/membership/access";
import { tierMeets } from "../lib/membership/tiers";

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

const NOW = new Date("2026-10-21T12:00:00Z");
const NEXT_MONTH = new Date("2026-11-21T12:00:00Z");
const LAST_MONTH = new Date("2026-09-21T12:00:00Z");

console.log("\nMembership access\n");

console.log("1. The case that was broken\n");

const selecto = { tier: "SELECTO", status: "ACTIVE", endsAt: null };
check("an active Selecto member gets their benefits", membershipGrantsBenefits(selecto, NOW), true);
check("and counts as Selecto", effectiveTier(selecto, NOW), "SELECTO");
check(
  "which clears the Artesano bar the members-only gate uses",
  tierMeets(effectiveTier(selecto, NOW), "ARTESANO"),
  true
);

console.log("\n2. Paid through a date\n");

const cancelledButPaid = { tier: "SELECTO", status: "CANCELED", endsAt: NEXT_MONTH };
check(
  "cancelled but paid through next month keeps the benefits the page promises",
  membershipGrantsBenefits(cancelledButPaid, NOW),
  true
);
check("and keeps the tier", effectiveTier(cancelledButPaid, NOW), "SELECTO");
check(
  "a past-due member paid through next month keeps them too",
  membershipGrantsBenefits({ tier: "LEGENDARIO", status: "PAST_DUE", endsAt: NEXT_MONTH }, NOW),
  true
);
check(
  "once that date passes they stop",
  membershipGrantsBenefits({ tier: "SELECTO", status: "CANCELED", endsAt: LAST_MONTH }, NOW),
  false
);
check(
  "and the tier falls back to BASICO",
  effectiveTier({ tier: "SELECTO", status: "CANCELED", endsAt: LAST_MONTH }, NOW),
  "BASICO"
);
check(
  "a date stored as a string works the same",
  membershipGrantsBenefits({ tier: "SELECTO", status: "CANCELED", endsAt: NEXT_MONTH.toISOString() }, NOW),
  true
);

console.log("\n3. Nobody gets in who shouldn't\n");

check("no membership at all", membershipGrantsBenefits(null, NOW), false);
check("no membership means BASICO", effectiveTier(null, NOW), "BASICO");
check(
  "an Embajador application awaiting approval grants nothing",
  membershipGrantsBenefits({ tier: "EMBAJADOR", status: "PENDING_APPROVAL", endsAt: NEXT_MONTH }, NOW),
  false
);
check(
  "cancelled with no end date stops immediately",
  membershipGrantsBenefits({ tier: "SELECTO", status: "CANCELED", endsAt: null }, NOW),
  false
);
check(
  "expired with no end date stops immediately",
  membershipGrantsBenefits({ tier: "ARTESANO", status: "EXPIRED", endsAt: null }, NOW),
  false
);
check(
  "an unreadable end date is not a free pass",
  membershipGrantsBenefits({ tier: "SELECTO", status: "CANCELED", endsAt: "not a date" }, NOW),
  false
);
check(
  "a basic account is not a member",
  tierMeets(effectiveTier({ tier: "BASICO", status: "ACTIVE", endsAt: null }, NOW), "ARTESANO"),
  false
);

console.log("\n4. The reason shown to the member\n");

check("active says so", membershipAccessReason(selecto, NOW), "Active.");
check(
  "paid through names the date",
  membershipAccessReason(cancelledButPaid, NOW),
  "Status is CANCELED, but paid through 2026-11-21 — benefits continue until then."
);
check(
  "ended names the date too",
  membershipAccessReason({ tier: "SELECTO", status: "CANCELED", endsAt: LAST_MONTH }, NOW),
  "Status is CANCELED and benefits ended on 2026-09-21."
);
check(
  "no end date explains the sudden stop",
  membershipAccessReason({ tier: "SELECTO", status: "PAST_DUE", endsAt: null }, NOW),
  "Status is PAST_DUE and there is no end date, so benefits stopped immediately."
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
