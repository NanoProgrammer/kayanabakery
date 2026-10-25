/**
 * The "Pickup / delivery date & time" field in Studio.
 *
 * The bakery opened an order due today at 1 p.m. and found two empty boxes
 * under a line that read "Current: Sunday, Oct 25, 1:00 p.m." — the editor
 * never filled them in from the value. And because they started empty, the
 * editor submitted an empty date the moment anyone touched the time, which
 * cleared the whole field: setting the time erased the date.
 *
 *   npm run test:pickup
 */
import { formatPickupLabel, parsePickupLabel, pickupEdit } from "../lib/studio/pickup-label";

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

const NOW = new Date("2026-10-25T12:00:00");

console.log("\nPickup / delivery date & time\n");

console.log("1. The order from the bakery's screenshot\n");

check(
  "a delivery label written by checkout",
  parsePickupLabel("Sunday, Oct 25, 1:00 p.m.", NOW),
  { date: "2026-10-25", time: "13:00" }
);

console.log("\n2. Every shape that is already stored\n");

check(
  "a pickup window written by checkout",
  parsePickupLabel("2026-10-25 · 10:00 AM - 12:00 PM", NOW),
  { date: "2026-10-25", time: "10:00" }
);
check(
  "the old Studio editor's own format",
  parsePickupLabel("Sunday, Oct 25 · 1:00 p.m.", NOW),
  { date: "2026-10-25", time: "13:00" }
);
check(
  "a label carrying its year",
  parsePickupLabel("Sunday, Oct 25, 2026, 1:00 p.m.", NOW),
  { date: "2026-10-25", time: "13:00" }
);
check(
  "a bare date with no time",
  parsePickupLabel("2026-12-24", NOW),
  { date: "2026-12-24", time: "" }
);
check(
  "a full month name",
  parsePickupLabel("Thursday, December 24, 9:30 a.m.", NOW),
  { date: "2026-12-24", time: "09:30" }
);

console.log("\n3. Times that are easy to get wrong\n");

check("midnight", parsePickupLabel("Oct 25, 12:00 a.m.", NOW).time, "00:00");
check("noon", parsePickupLabel("Oct 25, 12:00 p.m.", NOW).time, "12:00");
check("an afternoon hour", parsePickupLabel("Oct 25, 4:45 p.m.", NOW).time, "16:45");
check("a morning hour", parsePickupLabel("Oct 25, 8:05 a.m.", NOW).time, "08:05");
check("24-hour with no period", parsePickupLabel("2026-10-25 17:30", NOW).time, "17:30");
check(
  "a window takes its start, not its end",
  parsePickupLabel("2026-10-25 · 10:00 AM - 12:00 PM", NOW).time,
  "10:00"
);

console.log("\n4. Guessing the year on a label that has none\n");

check(
  "December read in January belongs to last year",
  parsePickupLabel("Thursday, Dec 24, 9:00 a.m.", new Date("2027-01-04T12:00:00")).date,
  "2026-12-24"
);
check(
  "January read in December belongs to next year",
  parsePickupLabel("Friday, Jan 8, 9:00 a.m.", new Date("2026-12-28T12:00:00")).date,
  "2027-01-08"
);

console.log("\n5. Nothing to read\n");

check("empty", parsePickupLabel("", NOW), { date: "", time: "" });
check("null", parsePickupLabel(null, NOW), { date: "", time: "" });
check("free text", parsePickupLabel("call the customer", NOW), { date: "", time: "" });
check(
  "the weekly auto-order's placeholder",
  parsePickupLabel("Contact you to schedule — weekly auto-order", NOW),
  { date: "", time: "" }
);

console.log("\n6. Writing it back\n");

check(
  "a date and time",
  formatPickupLabel("2026-10-25", "13:00"),
  "Sunday, Oct 25, 2026, 1:00 p.m."
);
check("a date alone", formatPickupLabel("2026-10-25", ""), "Sunday, Oct 25, 2026");
check("no date is no label", formatPickupLabel("", "13:00"), "");

console.log("\n7. It survives a round trip\n");

for (const [d, t] of [
  ["2026-10-25", "13:00"],
  ["2026-12-24", "09:30"],
  ["2027-01-01", "00:00"],
  ["2026-07-04", "12:00"],
  ["2026-03-15", "23:45"],
  ["2026-10-25", ""],
] as const) {
  const round = parsePickupLabel(formatPickupLabel(d, t), NOW);
  check(`${d} ${t || "(no time)"}`, round, { date: d, time: t });
}

console.log("\n8. Editing a box must never lose the order's date\n");

check(
  "setting the time on an order whose date box is empty keeps what is stored",
  pickupEdit("", "13:00"),
  { action: "keep" }
);
check(
  "setting a date writes the label",
  pickupEdit("2026-10-25", "13:00"),
  { action: "set", label: "Sunday, Oct 25, 2026, 1:00 p.m." }
);
check(
  "a date with no time is still a label",
  pickupEdit("2026-10-25", ""),
  { action: "set", label: "Sunday, Oct 25, 2026" }
);
check(
  "clearing both boxes empties the field",
  pickupEdit("", ""),
  { action: "unset" }
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
