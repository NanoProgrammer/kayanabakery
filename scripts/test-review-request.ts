/**
 * Who gets asked for a review, and when.
 *
 * The ask used to ride along with the "your order is complete" message, which
 * reaches the customer while they are still in the shop. It goes out the
 * middle of the next day now, which means it can no longer be worked out from
 * the order's status — by the time it is due the order has looked completed
 * for hours — so it keeps its own record of having been asked.
 *
 *   npm run test:review
 */
import { dueForReview, OLDEST_DAYS } from "../lib/reviews/request";
import { bakeryWallClockToUtc } from "../lib/time/edmonton";

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

/** Midday in Calgary on the given day — when the daily run happens. */
const midday = (date: string) => bakeryWallClockToUtc(date, 12);
const at = (date: string, hour: number) => bakeryWallClockToUtc(date, hour);

const order = (over: Partial<Parameters<typeof dueForReview>[0]> = {}) => ({
  status: "COMPLETED",
  completedAt: at("2026-11-02", 19),
  reviewRequestedAt: null,
  hasEmail: true,
  hasPhone: true,
  ...over,
});

console.log("\nReview requests\n");

console.log("1. The day after, at midday\n");

check(
  "collected last night, asked today at lunch",
  dueForReview(order(), midday("2026-11-03")),
  { ask: true }
);
check(
  "collected this morning, not asked until tomorrow",
  dueForReview(order({ completedAt: at("2026-11-03", 9) }), midday("2026-11-03")),
  { ask: false, reason: "completed today — ask tomorrow" }
);
check(
  "an order completed at 11 PM is asked at midday, not at 11 PM",
  dueForReview(order({ completedAt: at("2026-11-02", 23) }), midday("2026-11-03")),
  { ask: true }
);
check(
  "and is still not due at 1 AM the same night",
  dueForReview(order({ completedAt: at("2026-11-02", 23) }), at("2026-11-03", 1)).ask,
  true
);

console.log("\n2. Nobody is asked twice\n");

check(
  "already asked",
  dueForReview(order({ reviewRequestedAt: at("2026-11-03", 12) }), midday("2026-11-04")),
  { ask: false, reason: "already asked" }
);
check(
  "an order still being made",
  dueForReview(order({ status: "IN_PROGRESS" }), midday("2026-11-03")),
  { ask: false, reason: "order is IN_PROGRESS" }
);
check(
  "a cancelled order",
  dueForReview(order({ status: "CANCELLED" }), midday("2026-11-03")).ask,
  false
);

console.log("\n3. Turning it on must not message months of people\n");

check(
  `${OLDEST_DAYS} days old is still asked`,
  dueForReview(order({ completedAt: at("2026-10-31", 19) }), midday("2026-11-03")).ask,
  true
);
check(
  "a week old is left alone",
  dueForReview(order({ completedAt: at("2026-10-27", 19) }), midday("2026-11-03")),
  { ask: false, reason: "completed 7 days ago — too old to ask" }
);
check(
  "and so is one from last month",
  dueForReview(order({ completedAt: at("2026-10-03", 19) }), midday("2026-11-03")).ask,
  false
);

console.log("\n4. Nothing to send to\n");

check(
  "no email and no phone",
  dueForReview(order({ hasEmail: false, hasPhone: false }), midday("2026-11-03")),
  { ask: false, reason: "no email or phone" }
);
check(
  "email alone is enough",
  dueForReview(order({ hasEmail: true, hasPhone: false }), midday("2026-11-03")).ask,
  true
);
check(
  "so is a phone alone",
  dueForReview(order({ hasEmail: false, hasPhone: true }), midday("2026-11-03")).ask,
  true
);
check(
  "an order with no completion time has nothing to count from",
  dueForReview(order({ completedAt: null }), midday("2026-11-03")),
  { ask: false, reason: "no completion time to count from" }
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
