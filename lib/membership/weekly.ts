import crypto from "crypto";
import { bakeryDateString, bakeryWallClockToUtc } from "@/lib/time/edmonton";

/**
 * Monday 00:00 Calgary time of the week containing `date`, as a UTC instant.
 *
 * This used to use the machine's own clock, which made the answer depend on
 * where the code ran: Vercel is UTC, so it bucketed weeks from Monday 00:00
 * UTC — Sunday 6 PM in Calgary — while a laptop here computed a different
 * instant for the same week. The two never matched, so a local script looking
 * up the week the server had just written found nothing, and a decision made
 * on a Sunday evening landed in the following week.
 *
 * Anchoring it to the bakery's own clock makes the week mean the same thing
 * everywhere, which is what a unique key on (membership, weekStart) needs.
 */
export function weekStartOf(date = new Date()): Date {
  const localDate = bakeryDateString(date); // YYYY-MM-DD in Calgary
  const [y, m, d] = localDate.split("-").map(Number);

  // Day of week for that Calgary calendar date, read at noon UTC so the date
  // itself can't drift across a boundary while we're asking.
  const dow = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay(); // 0 Sun … 6 Sat
  const daysBack = dow === 0 ? 6 : dow - 1;

  const monday = new Date(Date.UTC(y, m - 1, d, 12));
  monday.setUTCDate(monday.getUTCDate() - daysBack);

  return bakeryWallClockToUtc(
    `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, "0")}-${String(
      monday.getUTCDate()
    ).padStart(2, "0")}`,
    0
  );
}

/** Whole weeks between two week-start dates, DST-safe. */
function weeksBetween(from: Date, to: Date): number {
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
  // Compare at UTC midnight so a DST shift inside the range can't turn an
  // exact 4 weeks into 3.96 and round the wrong way.
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / MS_PER_WEEK);
}

/**
 * Whether a membership's box goes out in the week starting `weekStart`.
 *
 * WEEKLY is always due. EVERY_4_WEEKS counts from the member's anchor week —
 * the week they made the switch — so they get a box that week and then every
 * fourth one. Without an anchor the membership falls back to weekly: sending
 * bread that was paid for is the safe failure, silently skipping it is not.
 */
export function isDueThisWeek({
  frequency,
  anchorAt,
  weekStart,
}: {
  frequency: "WEEKLY" | "EVERY_4_WEEKS";
  anchorAt: Date | null | undefined;
  weekStart: Date;
}): boolean {
  if (frequency !== "EVERY_4_WEEKS") return true;
  if (!anchorAt) return true;

  const anchorWeek = weekStartOf(anchorAt);
  const elapsed = weeksBetween(anchorWeek, weekStart);

  // A week before the anchor (clock skew, a backdated anchor) is not due.
  if (elapsed < 0) return false;

  return elapsed % 4 === 0;
}

function secret(): string {
  const s = process.env.CRON_SECRET;
  if (!s) throw new Error("CRON_SECRET missing — required to sign weekly action links");
  return s;
}

/** Signs `${logId}.${action}` so email links can't be forged or replayed for other logs. */
export function signWeeklyAction(logId: string, action: "send" | "skip"): string {
  return crypto
    .createHmac("sha256", secret())
    .update(`${logId}.${action}`)
    .digest("hex")
    .slice(0, 32);
}

export function verifyWeeklyAction(
  logId: string,
  action: string,
  token: string
): boolean {
  if (action !== "send" && action !== "skip") return false;
  const expected = Buffer.from(signWeeklyAction(logId, action));
  const given = Buffer.from(token || "");
  if (expected.length !== given.length) return false;
  return crypto.timingSafeEqual(expected, given);
}
