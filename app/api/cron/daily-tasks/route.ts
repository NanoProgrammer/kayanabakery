import { NextResponse } from "next/server";
import { syncAllCustomersToSanity } from "@/lib/sanity/sync-customers";
import { GET as weeklyBoxNotify } from "../weekly-box-notify/route";
import { GET as weeklyBoxProcess } from "../weekly-box-process/route";
import { GET as creditExpirationReminders } from "../credit-expiration-reminders/route";
import { GET as creditExpirationExecute } from "../credit-expiration-execute/route";

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

  /**
   * Runs a sub-task in this same process.
   *
   * These used to be called over HTTP, by fetching this deployment's own URL.
   * That went wrong twice: first a redirect between the .com and the .ca
   * dropped the Authorization header so every task answered 401, and then
   * something in front of the site answered the internal request with an HTML
   * page, which surfaced in the logs as `Unexpected token '<'` for three tasks
   * at once — naming neither the status nor the route.
   *
   * They are functions in the same bundle. Calling them directly cannot be
   * redirected, intercepted, or served someone else's error page, and a
   * failure arrives here as the real exception.
   */
  const run = async (
    name: string,
    handler: (req: Request) => Promise<Response>
  ) => {
    const res = await handler(new Request(`${base}/api/cron/${name}`, { headers }));
    const body = await res.text();
    try {
      return JSON.parse(body);
    } catch {
      return { error: `${name} answered HTTP ${res.status}`, body: body.slice(0, 300) };
    }
  };

  const now = new Date();
  const dow = now.getDay(); // 0 Sun ... 6 Sat

  const tasks: Record<string, () => Promise<any>> = {};

  if (dow === 2) {
    // Tuesday — gives members until Wednesday 11:59 PM to decide before Friday delivery.
    tasks.weeklyBoxNotify = () =>
      run("weekly-box-notify", weeklyBoxNotify);
  }
  if (dow === 4) {
    // Thursday — finalize whatever wasn't answered by the Wednesday cutoff, in time for Friday delivery.
    tasks.weeklyBoxProcess = () =>
      run("weekly-box-process", weeklyBoxProcess);
  }
  // Refresh every customer in Studio daily. Individual syncs can fail — a
  // network blip, a Sanity hiccup — and a stale mirror looks exactly like a
  // correct one, so nobody would ever notice. This repairs it on its own.
  tasks.customersToStudio = () => syncAllCustomersToSanity();

  tasks.creditExpirationReminders = () =>
    run("credit-expiration-reminders", creditExpirationReminders);
  tasks.creditExpirationExecute = () =>
    run("credit-expiration-execute", creditExpirationExecute);

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
