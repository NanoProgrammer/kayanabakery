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
