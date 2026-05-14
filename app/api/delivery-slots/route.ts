import { NextResponse } from "next/server";
import { getCalendar, KARYANA_CALENDAR_ID } from "@/lib/google/calendar";
import {
  getUpcomingWindows,
  SLOT_DURATION_MIN,
} from "@/lib/google/delivery-windows";

/**
 * Returns delivery windows (full days) with availability info.
 * The frontend shows the user a day to pick; we assign the exact
 * 12-min sub-slot at checkout time.
 */
export async function GET() {
  try {
    const windows = getUpcomingWindows();

    if (windows.length === 0) {
      return NextResponse.json({ slots: [] });
    }

    // Query Google Calendar once for the entire date range
    const minTime = windows[0].windowStart;
    const maxTime = windows[windows.length - 1].windowEnd;

    const calendar = getCalendar();
    const eventsRes = await calendar.events.list({
      calendarId: KARYANA_CALENDAR_ID,
      timeMin: minTime,
      timeMax: maxTime,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    const events = eventsRes.data.items || [];

    // For each window, count how many of its 12-min sub-slots are taken
    const slots = windows.map((w) => {
      const wStart = new Date(w.windowStart).getTime();
      const wEnd = new Date(w.windowEnd).getTime();

      // Count events that overlap this window
      const overlapping = events.filter((ev) => {
        const evStart = ev.start?.dateTime || ev.start?.date;
        const evEnd = ev.end?.dateTime || ev.end?.date;
        if (!evStart || !evEnd) return false;
        const s = new Date(evStart).getTime();
        const e = new Date(evEnd).getTime();
        return s < wEnd && e > wStart;
      });

      // Each event = 1 occupied 12-min slot
      const reserved = overlapping.length;
      const remaining = Math.max(0, w.capacity - reserved);

      return {
        id: w.id,
        startTime: w.windowStart,
        endTime: w.windowEnd,
        label: w.label,
        capacity: w.capacity,
        reserved,
        remaining,
        membersOnly: false,
      };
    });

    // Filter out fully booked windows
    const available = slots.filter((s) => s.remaining > 0);

    return NextResponse.json({ slots: available });
  } catch (err: any) {
    console.error("[delivery-slots] error:", err.message);
    return NextResponse.json(
      { slots: [], error: err.message },
      { status: 500 }
    );
  }
}