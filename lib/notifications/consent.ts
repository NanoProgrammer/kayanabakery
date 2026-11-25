/**
 * Who may be texted, and who already has been. Situación 10.
 *
 * Two separate problems that both end with a customer annoyed:
 *
 *   CONSENT. Canadian rules say a person who replies STOP must stop
 *   receiving messages, and Twilio only enforces that for its own
 *   keywords in English. A customer who writes "BAJA" has said the same
 *   thing in the language most of this customer base actually uses.
 *
 *   DUPLICATES. The status messages fire from a Sanity webhook. Saving
 *   an order twice, a retried webhook delivery, or a status nudged back
 *   and forth all send the same text again. Square sends its own
 *   receipts too, so the bar is not "did we already send it this run"
 *   but "has this order ever been notified of this status".
 *
 * Kept away from the webhook because both rules are easy to get subtly
 * wrong and the cost of being wrong is a customer who stops reading
 * anything we send.
 */

import { NEW_ORDER_STATUS_MESSAGES } from "@/lib/feature-flags";

/** Every status a customer can be told about, in the order they happen. */
export type NotifiableStatus =
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED";

/** All four states the meeting named, plus READY. The finished set. */
export const ALL_NOTIFIABLE_STATUSES: NotifiableStatus[] = [
  "CONFIRMED",
  "IN_PROGRESS",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
];

/** The three that were already going out before the meeting. */
export const EXISTING_NOTIFIABLE_STATUSES: NotifiableStatus[] = [
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
];

/**
 * What actually goes out today.
 *
 * "Confirmado" and "en preparación" are built and tested but wait on
 * NEW_ORDER_STATUS_MESSAGES: they are two more texts arriving on a real
 * customer's phone for every order, which Karyana announces rather than
 * discovers. The consent and duplicate rules below stay on either way —
 * those only ever remove unwanted messages.
 */
export const NOTIFIABLE_STATUSES: NotifiableStatus[] = NEW_ORDER_STATUS_MESSAGES
  ? ALL_NOTIFIABLE_STATUSES
  : EXISTING_NOTIFIABLE_STATUSES;

/**
 * A phone number reduced to what identifies it.
 *
 * The same person reaches us as "(403) 383-3681" from the Studio,
 * "+14033833681" from Twilio and "4033833681" from the checkout. An
 * opt-out stored under one spelling has to block all three.
 */
export function phoneKey(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

/** Whether a number is complete enough to message or to store. */
export function isUsablePhone(value: string | null | undefined): boolean {
  return phoneKey(value).length === 10;
}

/**
 * The words that mean "stop", in both languages.
 *
 * Twilio handles the English ones itself for SMS, but not for WhatsApp
 * and not for the Spanish ones — and a customer who writes BAJA and
 * keeps receiving messages has been ignored, whatever the carrier did.
 */
const STOP_WORDS = [
  "stop",
  "stopall",
  "unsubscribe",
  "cancel",
  "end",
  "quit",
  "baja",
  "parar",
  "alto",
  "cancelar",
  "detener",
  "no",
];

/** The words that ask to start again. */
const START_WORDS = ["start", "yes", "unstop", "alta", "si", "sí", "reanudar"];

function firstWord(body: string | null | undefined): string {
  return (body ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .trim()
    .split(/\s+/)[0] ?? "";
}

export type InboundIntent = "STOP" | "START" | "OTHER";

/**
 * What an inbound message is asking for.
 *
 * Only the FIRST word counts, and only when it is the whole message or
 * starts it. "Stop sending so early, I'm asleep" is a complaint about
 * timing, not an opt-out — but it starts with "stop", so a naive
 * `includes` would silently unsubscribe someone who wanted to keep
 * hearing from us. Requiring a short message avoids that.
 */
export function inboundIntent(body: string | null | undefined): InboundIntent {
  const text = (body ?? "").trim();
  if (!text) return "OTHER";
  // A keyword is a keyword; a sentence is a sentence.
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 2) return "OTHER";
  const word = firstWord(text);
  if (!word) return "OTHER";
  if (STOP_WORDS.includes(word)) return "STOP";
  if (START_WORDS.includes(word)) return "START";
  return "OTHER";
}

/** What we reply, so the customer knows it worked. */
export function confirmationFor(intent: InboundIntent, locale: string): string | null {
  const es = locale === "es";
  if (intent === "STOP") {
    return es
      ? "Listo, no te enviaremos más mensajes sobre tus pedidos. Responde ALTA si quieres volver a recibirlos."
      : "Done — we won't text you about your orders any more. Reply START to turn them back on.";
  }
  if (intent === "START") {
    return es
      ? "Listo, volverás a recibir mensajes sobre tus pedidos."
      : "Done — you'll get order updates again.";
  }
  return null;
}

/**
 * Whether this order has already been told about this status.
 *
 * `already` is whatever is stored on the order, which may be null, a
 * string, or an array with junk in it — it is a Sanity field that has
 * been edited by hand. Anything unrecognised counts as "not yet", on
 * the grounds that a missing message is better than a duplicate only
 * when we are sure, and we are not.
 */
export function alreadyNotified(already: unknown, status: NotifiableStatus): boolean {
  if (!Array.isArray(already)) return false;
  return already.some((s) => typeof s === "string" && s === status);
}

export type SendDecision =
  | { send: true }
  | { send: false; reason: "no-phone" | "opted-out" | "duplicate" | "not-notifiable" };

/**
 * The one place that decides whether a status message goes out.
 *
 * Every reason to stay quiet is named, so a customer who did not get a
 * message can be explained rather than guessed about.
 */
export function shouldNotify(input: {
  status: string;
  phone: string | null | undefined;
  optedOut: boolean;
  alreadySent: unknown;
}): SendDecision {
  if (!NOTIFIABLE_STATUSES.includes(input.status as NotifiableStatus)) {
    return { send: false, reason: "not-notifiable" };
  }
  if (!isUsablePhone(input.phone)) return { send: false, reason: "no-phone" };
  if (input.optedOut) return { send: false, reason: "opted-out" };
  if (alreadyNotified(input.alreadySent, input.status as NotifiableStatus)) {
    return { send: false, reason: "duplicate" };
  }
  return { send: true };
}

/** The opt-out document's id, so a number can only ever have one. */
export function optOutDocId(phone: string | null | undefined): string | null {
  const key = phoneKey(phone);
  return key.length === 10 ? `sms-opt-out-${key}` : null;
}
