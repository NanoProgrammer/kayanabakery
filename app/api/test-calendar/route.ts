import { NextResponse } from "next/server";
import { getCalendar, KARYANA_CALENDAR_ID } from "@/lib/google/calendar";

/**
 * Diagnostic endpoint: runs 4 independent tests against Google Calendar API
 * to pinpoint exactly which permission/config is wrong.
 */
export async function GET() {
  const result: any = {
    envCheck: {
      hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      hasCalendarId: !!process.env.GOOGLE_CALENDAR_ID,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      calendarIdConfigured: process.env.GOOGLE_CALENDAR_ID,
    },
    tests: {},
  };

  if (!result.envCheck.hasEmail || !result.envCheck.hasPrivateKey) {
    result.diagnosis = "❌ Missing service account credentials.";
    return NextResponse.json(result);
  }

  let calendar;
  try {
    calendar = getCalendar();
  } catch (err: any) {
    result.diagnosis = `❌ Could not initialize Google client: ${err.message}`;
    return NextResponse.json(result);
  }

  // ===========================================================
  // TEST 1: Authentication works at all?
  // We try the most permissive thing: list ALL calendars accessible
  // to this service account. If this fails, it's an auth issue.
  // ===========================================================
  try {
    const calList = await calendar.calendarList.list({ maxResults: 100 });
    const calendars = (calList.data.items || []).map((c) => ({
      id: c.id,
      summary: c.summary,
      accessRole: c.accessRole,
    }));

    result.tests.test1_authentication = {
      ok: true,
      message: "✅ Authentication works",
      calendarsAccessibleToServiceAccount: calendars.length,
      calendars,
    };

    // Check if the configured calendar is in the list
    const configuredId = process.env.GOOGLE_CALENDAR_ID;
    const found = calendars.find((c) => c.id === configuredId);

    if (found) {
      result.tests.test1_authentication.configuredCalendarFound = {
        ok: true,
        message: `✅ Calendar "${configuredId}" IS shared with the service account`,
        accessRole: found.accessRole,
      };
    } else {
      result.tests.test1_authentication.configuredCalendarFound = {
        ok: false,
        message: `❌ Calendar "${configuredId}" is NOT shared with this service account.`,
        hint: `The service account ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL} can access ${calendars.length} calendar(s). The configured GOOGLE_CALENDAR_ID is not one of them. See the "calendars" list above to find a valid ID, OR re-share the target calendar with this service account email.`,
      };
    }
  } catch (err: any) {
    result.tests.test1_authentication = {
      ok: false,
      message: "❌ Authentication failed",
      errorCode: err.code,
      errorStatus: err.response?.status,
      errorMessage: err.message,
      hint:
        err.code === 403
          ? "Authentication works but lacks scopes. Check that lib/google/calendar.ts has BOTH 'calendar.events' and 'calendar.readonly' scopes, then RESTART npm run dev."
          : "Service account credentials may be wrong, or Google Calendar API not enabled in Google Cloud Console.",
    };
    result.diagnosis = "Stop: authentication is broken. Fix that first.";
    return NextResponse.json(result);
  }

  // ===========================================================
  // TEST 2: Get calendar metadata directly
  // (this is what was failing with 404)
  // ===========================================================
  try {
    const cal = await calendar.calendars.get({
      calendarId: KARYANA_CALENDAR_ID,
    });
    result.tests.test2_calendarsGet = {
      ok: true,
      message: "✅ Direct calendar.get() works",
      calendar: {
        id: cal.data.id,
        summary: cal.data.summary,
        timeZone: cal.data.timeZone,
      },
    };
  } catch (err: any) {
    result.tests.test2_calendarsGet = {
      ok: false,
      errorCode: err.code,
      errorStatus: err.response?.status,
      errorMessage: err.message,
    };
  }

  // ===========================================================
  // TEST 3: List events in the calendar
  // (this is what /api/delivery-slots actually uses)
  // ===========================================================
  try {
    const now = new Date();
    const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const events = await calendar.events.list({
      calendarId: KARYANA_CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: true,
      maxResults: 5,
    });
    result.tests.test3_eventsList = {
      ok: true,
      message: "✅ events.list() works",
      eventsFoundInNext7Days: events.data.items?.length || 0,
    };
  } catch (err: any) {
    result.tests.test3_eventsList = {
      ok: false,
      errorCode: err.code,
      errorStatus: err.response?.status,
      errorMessage: err.message,
    };
  }

  // ===========================================================
  // FINAL DIAGNOSIS
  // ===========================================================
  const t1 = result.tests.test1_authentication;
  const t1Found = t1.configuredCalendarFound;
  const t2 = result.tests.test2_calendarsGet;
  const t3 = result.tests.test3_eventsList;

  if (t1.ok && t1Found?.ok && t2.ok && t3.ok) {
    result.diagnosis = "✅ Everything works. Your /api/delivery-slots should function now. If it still 404s, restart npm run dev to clear any cached errors.";
  } else if (t1.ok && !t1Found?.ok) {
    result.diagnosis = `❌ The calendar ID in .env.local is NOT one of the calendars shared with the service account.\n\nYour service account currently has access to ${t1.calendarsAccessibleToServiceAccount} calendar(s) — see the list in test1.\n\nFix: Either (a) update GOOGLE_CALENDAR_ID in .env.local to match an accessible calendar, OR (b) go to Google Calendar and share the target calendar with ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL} with "Make changes to events" permission.`;
  } else if (t1.ok && t1Found?.ok && !t2.ok) {
    result.diagnosis = "❌ Calendar IS shared but calendars.get() fails. This usually means scopes are wrong. Check lib/google/calendar.ts has both 'calendar.events' and 'calendar.readonly' scopes, then restart npm run dev.";
  } else {
    result.diagnosis = "❌ See test results above for details.";
  }

  return NextResponse.json(result);
}