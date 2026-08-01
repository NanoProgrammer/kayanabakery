import { NextResponse } from "next/server";

/**
 * Single daily dispatcher — Vercel Hobby plans cap the number of cron
 * jobs, so instead of scheduling weekly-box-notify (Thu), weekly-box-process
 * (Fri), and the two credit-expiration crons separately, one daily cron
 * calls each of them internally. Each sub-route still no-ops on the
 * wrong day, so this is safe to call every day.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? `https://${process.env.VERCEL_URL}`;
  const headers = { authorization: `Bearer ${process.env.CRON_SECRET}` };

  const now = new Date();
  const dow = now.getDay(); // 0 Sun ... 6 Sat

  const tasks: Record<string, () => Promise<any>> = {};

  if (dow === 2) {
    // Tuesday — gives members until Wednesday 11:59 PM to decide before Friday delivery.
    tasks.weeklyBoxNotify = () =>
      fetch(`${base}/api/cron/weekly-box-notify`, { headers }).then((r) => r.json());
  }
  if (dow === 4) {
    // Thursday — finalize whatever wasn't answered by the Wednesday cutoff, in time for Friday delivery.
    tasks.weeklyBoxProcess = () =>
      fetch(`${base}/api/cron/weekly-box-process`, { headers }).then((r) => r.json());
  }
  tasks.creditExpirationReminders = () =>
    fetch(`${base}/api/cron/credit-expiration-reminders`, { headers }).then((r) => r.json());
  tasks.creditExpirationExecute = () =>
    fetch(`${base}/api/cron/credit-expiration-execute`, { headers }).then((r) => r.json());

  const results: Record<string, any> = {};
  for (const [name, fn] of Object.entries(tasks)) {
    try {
      results[name] = await fn();
    } catch (err: any) {
      results[name] = { error: err.message };
    }
  }

  return NextResponse.json(results);
}
