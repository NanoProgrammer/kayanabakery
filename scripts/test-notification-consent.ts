/**
 * Who may be texted, and who already has been — Situación 10.
 *
 *   npm run test:notification-consent
 *
 * Two failures these exist to prevent, both of which end with a customer
 * who stops reading anything we send: messaging someone who told us to
 * stop, and messaging someone twice.
 */
import {
  phoneKey,
  isUsablePhone,
  inboundIntent,
  confirmationFor,
  alreadyNotified,
  shouldNotify,
  optOutDocId,
  NOTIFIABLE_STATUSES,
} from "../lib/notifications/consent";
import { orderStatusMessage } from "../lib/notifications/order-messages";

let passed = 0;
let failed = 0;
function check(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
    console.log(`      expected: ${JSON.stringify(expected)}`);
    console.log(`      got:      ${JSON.stringify(actual)}`);
  }
}

console.log("\nMessage consent and duplicates\n");

console.log("  one number, however it is written");
// The same person reaches us three ways. An opt-out stored under one
// spelling has to block all three.
check("from the Studio", phoneKey("(403) 383-3681"), "4033833681");
check("from Twilio", phoneKey("+14033833681"), "4033833681");
check("from WhatsApp", phoneKey("whatsapp:+14033833681"), "4033833681");
check("from the checkout", phoneKey("4033833681"), "4033833681");
check("a short number is not usable", isUsablePhone("403383"), false);
check("a full one is", isUsablePhone("+1 403 383 3681"), true);
check("nothing is not", isUsablePhone(null), false);

console.log("\n  what a reply means");
check("STOP stops", inboundIntent("STOP"), "STOP");
check("...in lower case", inboundIntent("stop"), "STOP");
check("...with punctuation", inboundIntent("Stop."), "STOP");
// Twilio handles the English words itself; these are the ones it does
// not, and they are the ones this customer base actually writes.
check("BAJA stops", inboundIntent("BAJA"), "STOP");
check("CANCELAR stops", inboundIntent("cancelar"), "STOP");
check("PARAR stops", inboundIntent("parar"), "STOP");
check("START starts", inboundIntent("START"), "START");
check("ALTA starts", inboundIntent("alta"), "START");
check("SÍ starts, accent and all", inboundIntent("sí"), "START");
// The one that matters most: a complaint about timing is not an
// opt-out, and a naive `includes` would have unsubscribed this person.
check(
  "a sentence that happens to start with stop is not an opt-out",
  inboundIntent("stop sending so early, I'm asleep"),
  "OTHER"
);
check("a question is left for a human", inboundIntent("is my cake ready?"), "OTHER");
check("nothing said is nothing meant", inboundIntent(""), "OTHER");
check("whitespace is nothing", inboundIntent("   "), "OTHER");

console.log("\n  what we reply");
check("a stop is confirmed in Spanish", confirmationFor("STOP", "es")?.includes("ALTA"), true);
check("...and in English", confirmationFor("STOP", "en")?.includes("START"), true);
check("a start is confirmed", confirmationFor("START", "es") !== null, true);
check("an ordinary message gets no auto-reply", confirmationFor("OTHER", "es"), null);

console.log("\n  the opt-out record");
check("one document per number", optOutDocId("(403) 383-3681"), "sms-opt-out-4033833681");
check("...the same one however it was written", optOutDocId("+14033833681"), "sms-opt-out-4033833681");
check("a half number gets no record", optOutDocId("4033"), null);

console.log("\n  has this already gone out");
check("yes", alreadyNotified(["READY"], "READY"), true);
check("no", alreadyNotified(["READY"], "COMPLETED"), false);
check("nothing recorded is nothing sent", alreadyNotified(null, "READY"), false);
// The field is editable in Studio and has held whatever anyone typed.
check("junk in the field is not a false positive", alreadyNotified([42, null, {}], "READY"), false);
check("a string instead of an array is not either", alreadyNotified("READY", "READY"), false);

console.log("\n  the decision");
const ok = { status: "READY", phone: "4033833681", optedOut: false, alreadySent: [] };
check("a normal order is messaged", shouldNotify(ok), { send: true });
check("...for every one of the four states", NOTIFIABLE_STATUSES.length, 5);
check(
  "every notifiable status is allowed through",
  NOTIFIABLE_STATUSES.every((s) => shouldNotify({ ...ok, status: s }).send),
  true
);
// Each silence is named, so a customer who got nothing can be explained
// rather than guessed about.
check("no phone, no message", shouldNotify({ ...ok, phone: null }), { send: false, reason: "no-phone" });
check("half a phone, no message", shouldNotify({ ...ok, phone: "403" }), { send: false, reason: "no-phone" });
check("opted out, no message", shouldNotify({ ...ok, optedOut: true }), { send: false, reason: "opted-out" });
check("already sent, no message", shouldNotify({ ...ok, alreadySent: ["READY"] }), { send: false, reason: "duplicate" });
check("cancelled is not a notifiable status", shouldNotify({ ...ok, status: "CANCELLED" }), { send: false, reason: "not-notifiable" });
check("nor is a status nobody defined", shouldNotify({ ...ok, status: "BANANA" }), { send: false, reason: "not-notifiable" });
// Opting out beats everything: it is the customer's decision, not a
// tie-break.
check(
  "an opt-out wins over a never-sent status",
  shouldNotify({ ...ok, optedOut: true, alreadySent: [] }),
  { send: false, reason: "opted-out" }
);

console.log("\n  the messages themselves");
// The two the meeting asked for and the site did not have.
for (const locale of ["es", "en"] as const) {
  for (const status of NOTIFIABLE_STATUSES) {
    const msg = orderStatusMessage(status, locale, { orderNumber: "KAR-1", isPickup: true });
    check(`${status} has a ${locale} message`, msg.length > 0, true);
    check(`...naming the order`, msg.includes("KAR-1"), true);
  }
}
check(
  "confirmed says we have it",
  orderStatusMessage("CONFIRMED", "es", { orderNumber: "KAR-1", isPickup: true }).includes("Recibimos"),
  true
);
check(
  "in preparation says we started",
  orderStatusMessage("IN_PROGRESS", "es", { orderNumber: "KAR-1", isPickup: true }).includes("preparando"),
  true
);
// Square already sends its own receipt. Ours says we have the order,
// it does not repeat the money.
check(
  "the confirmation does not repeat Square's receipt",
  /\$|total|importe/i.test(orderStatusMessage("CONFIRMED", "es", { orderNumber: "KAR-1", isPickup: true })),
  false
);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
