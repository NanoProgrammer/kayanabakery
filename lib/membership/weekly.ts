import crypto from "crypto";

/** Monday 00:00 (server local time) of the week containing `date`. */
export function weekStartOf(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 Sun ... 6 Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
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
