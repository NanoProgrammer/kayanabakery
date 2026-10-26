/**
 * Renewals: charging, retrying, and when a membership really ends.
 *
 * A Selecto membership went PAST_DUE on the 22nd and nothing charged the card
 * again. The cron gave up on the first decline — it set endsAt = now, so
 * benefits stopped that second, and it only ever queried ACTIVE memberships,
 * so that member was never looked at again. A bank's routine decline
 * permanently ended a paid membership, and nobody was told.
 *
 *   npm run test:renewal
 */
import {
  GRACE_DAYS,
  graceDaysLeft,
  graceEndsAt,
  renewalDecision,
} from "../lib/membership/renewal";
import { membershipGrantsBenefits } from "../lib/membership/access";

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
const days = (n: number) => new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);

const member = (over: Partial<Parameters<typeof renewalDecision>[0]> = {}) => ({
  tier: "SELECTO",
  status: "ACTIVE",
  renewsAt: days(-1),
  endsAt: null,
  hasCard: true,
  ...over,
});

console.log("\nMembership renewals\n");

console.log("1. The ordinary run\n");

check("a membership due today is charged", renewalDecision(member(), NOW), {
  action: "charge",
  attempt: "first",
});
check(
  "one not due yet is left alone",
  renewalDecision(member({ renewsAt: days(5) }), NOW),
  { action: "skip", reason: "not due yet" }
);
check(
  "a free tier is not charged",
  renewalDecision(member({ tier: "BASICO" }), NOW),
  { action: "skip", reason: "BASICO is not a paid tier" }
);
check(
  "an Embajador is not charged either",
  renewalDecision(member({ tier: "EMBAJADOR" }), NOW).action,
  "skip"
);
check(
  "a membership with no card is not ended for it",
  renewalDecision(member({ hasCard: false }), NOW),
  { action: "skip", reason: "no card on file" }
);

console.log("\n2. The failure that used to be final\n");

// What the cron writes on a first decline.
const endsAt = graceEndsAt(NOW);
check(`the grace window is ${GRACE_DAYS} days`, graceDaysLeft(endsAt, NOW), GRACE_DAYS);

const justFailed = member({ status: "PAST_DUE", endsAt });

check(
  "the card is tried again the next day",
  renewalDecision(justFailed, days(1)),
  { action: "charge", attempt: "retry" }
);
check(
  "and again on the last day of the window",
  renewalDecision(justFailed, days(GRACE_DAYS - 0.5)),
  { action: "charge", attempt: "retry" }
);
check(
  "benefits continue the whole time",
  membershipGrantsBenefits(
    { tier: "SELECTO", status: "PAST_DUE", endsAt },
    days(GRACE_DAYS - 1)
  ),
  true
);
check(
  "which is what the old code got wrong — endsAt = now stops them at once",
  membershipGrantsBenefits(
    { tier: "SELECTO", status: "PAST_DUE", endsAt: NOW },
    days(0.001)
  ),
  false
);

console.log("\n3. When it really ends\n");

check(
  "the window runs out and the membership expires",
  renewalDecision(justFailed, days(GRACE_DAYS + 0.5)),
  { action: "expire", reason: "the grace period ran out" }
);
check(
  "benefits are gone by then",
  membershipGrantsBenefits(
    { tier: "SELECTO", status: "PAST_DUE", endsAt },
    days(GRACE_DAYS + 1)
  ),
  false
);
check(
  "a past-due membership whose card was removed is not retried",
  renewalDecision(member({ status: "PAST_DUE", endsAt, hasCard: false }), days(1)),
  { action: "skip", reason: "no card on file to retry" }
);
check(
  "but it still expires when the window closes",
  renewalDecision(
    member({ status: "PAST_DUE", endsAt, hasCard: false }),
    days(GRACE_DAYS + 1)
  ).action,
  "expire"
);
check(
  "an already expired membership is left alone",
  renewalDecision(member({ status: "EXPIRED", endsAt: null }), NOW),
  { action: "skip", reason: "status is EXPIRED" }
);
check(
  "a cancelled one is not charged again",
  renewalDecision(member({ status: "CANCELED", endsAt: days(10) }), NOW),
  { action: "skip", reason: "status is CANCELED" }
);

console.log("\n4. Days left, as the email says them\n");

check("a full window", graceDaysLeft(endsAt, NOW), 7);
check("most of the way through", graceDaysLeft(endsAt, days(6)), 1);
check("already over", graceDaysLeft(endsAt, days(8)), 0);
check("no window at all", graceDaysLeft(null, NOW), 0);

console.log("\n5. The member fixes their card\n");

// What /api/membership/card asks before charging the new card.
check(
  "a past-due member is charged on the spot",
  renewalDecision(member({ status: "PAST_DUE", endsAt }), NOW).action,
  "charge"
);
check(
  "a member who is paid up is not charged for changing cards",
  renewalDecision(member({ status: "ACTIVE", renewsAt: days(20) }), NOW).action,
  "skip"
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
