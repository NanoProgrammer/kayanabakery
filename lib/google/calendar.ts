import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !key) {
    throw new Error(
      "Missing Google Service Account credentials in environment variables"
    );
  }

  const privateKey = key.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: SCOPES,
  });
}

export function getCalendar() {
  const auth = getAuth();
  return google.calendar({ version: "v3", auth });
}

export const KARYANA_CALENDAR_ID =
  process.env.GOOGLE_CALENDAR_ID || "primary";

export const TIMEZONE = "America/Edmonton";