/**
 * Karyana — Google Calendar one-way integration
 *
 * When a delivery is booked through the website, an event is created
 * in the OWNER's calendar so they see it natively. We use a Google
 * service account so end-users never authenticate against Google.
 *
 * Setup (env):
 *   GOOGLE_CALENDAR_ID            — owner's calendar id (e.g. karyana@gmail.com)
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  — from Google Cloud Console
 *   GOOGLE_SERVICE_ACCOUNT_KEY    — private key, with \n preserved
 *
 * The owner must SHARE their Google Calendar with the service account email
 * (give it "Make changes to events" permission).
 */

import { google } from "googleapis";

let calendarClient: ReturnType<typeof google.calendar> | null = null;

function getClient() {
  if (calendarClient) return calendarClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!email || !rawKey) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_KEY"
    );
  }

  // Private keys often arrive with literal \n; normalize.
  const key = rawKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/calendar.events"],
  });

  calendarClient = google.calendar({ version: "v3", auth });
  return calendarClient;
}

export interface DeliveryEventInput {
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  address: {
    line1: string;
    line2?: string | null;
    city: string;
    province: string;
    postalCode: string;
  };
  itemsSummary: string;
  notes?: string | null;
  totalDollars: number;
  timeZone?: string;  // default America/Edmonton
}

/**
 * Create an event in the owner's Google Calendar.
 * Returns { eventId } or throws on failure (caller should NOT fail the order
 * if this errors — log and proceed).
 */
export async function createDeliveryEvent(
  input: DeliveryEventInput
): Promise<{ eventId: string }> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error("Missing GOOGLE_CALENDAR_ID");

  const tz = input.timeZone || "America/Edmonton";
  const start = `${input.date}T${input.startTime}:00`;
  const end = `${input.date}T${input.endTime}:00`;

  const addrLine = [
    input.address.line1,
    input.address.line2,
    `${input.address.city}, ${input.address.province} ${input.address.postalCode}`,
  ]
    .filter(Boolean)
    .join(", ");

  const description = [
    `Order: ${input.orderNumber}`,
    `Customer: ${input.customerName}`,
    `Email: ${input.customerEmail}`,
    input.customerPhone ? `Phone: ${input.customerPhone}` : null,
    `Total: $${input.totalDollars.toFixed(2)}`,
    "",
    "Items:",
    input.itemsSummary,
    input.notes ? `\nNotes: ${input.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const cal = getClient();

  const res = await cal.events.insert({
    calendarId,
    requestBody: {
      summary: `🚚 ${input.orderNumber} — ${input.customerName}`,
      description,
      location: addrLine,
      start: { dateTime: start, timeZone: tz },
      end: { dateTime: end, timeZone: tz },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    },
  });

  if (!res.data.id) throw new Error("GCal event creation returned no id");
  return { eventId: res.data.id };
}

/** Best-effort delete (used if order is cancelled). */
export async function deleteDeliveryEvent(eventId: string): Promise<void> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) return;
  try {
    const cal = getClient();
    await cal.events.delete({ calendarId, eventId });
  } catch (err) {
    console.warn("[gcal] delete failed:", err);
  }
}
