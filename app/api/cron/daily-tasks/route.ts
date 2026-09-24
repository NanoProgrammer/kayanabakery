import { NextResponse } from "next/server";
import { syncAllCustomersToSanity } from "@/lib/sanity/sync-customers";

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

  // Built from the request that just arrived, not from NEXT_PUBLIC_APP_URL.
  // That variable points at the .com mirror, which redirects to .ca — and a
  // redirect to a different origin drops the Authorization header, so every
  // sub-task below answered 401 and silently did nothing. No weekly emails
  // went out and no WeeklyOrderLog rows were ever written.
  const base = new URL(req.url).origin;
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
  // Refresh every customer in Studio daily. Individual syncs can fail — a
  // network blip, a Sanity hiccup — and a stale mirror looks exactly like a
  // correct one, so nobody would ever notice. This repairs it on its own.
  tasks.customersToStudio = () => syncAllCustomersToSanity();

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

  // A sub-task that answers "Unauthorized" looks like success from here — the
  // fetch resolved, the JSON parsed. Call it out so it shows up in the logs
  // as a failure instead of hiding inside a 200.
  const rejected = Object.entries(results)
    .filter(([, r]) => r && typeof r === "object" && (r.error || r.error === "Unauthorized"))
    .map(([name]) => name);

  if (rejected.length > 0) {
    console.error(`[cron/daily-tasks] sub-tasks failed: ${rejected.join(", ")}`, results);
  } else {
    console.log("[cron/daily-tasks] ran", Object.keys(results).join(", "), results);
  }

  return NextResponse.json({ base, results, failed: rejected });
}
