import { timingSafeEqual } from "crypto";

/**
 * Guards the print endpoints, which hand out customer names, phone numbers and
 * addresses to whoever asks.
 *
 * Closed when PRINTER_TOKEN is unset. The Sanity webhooks skip verification
 * without a secret as a dev convenience; that would be the wrong trade here,
 * because forgetting to set this in production would quietly publish the
 * kitchen queue instead of quietly failing.
 */
export function printerAuthorized(req: Request): boolean {
  const expected = process.env.PRINTER_TOKEN;
  if (!expected) return false;

  const header = req.headers.get("authorization") ?? "";
  const provided = header.replace(/^Bearer\s+/i, "").trim();
  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The same refusal for every print route, so none of them invents its own. */
export function printerUnauthorized(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}
