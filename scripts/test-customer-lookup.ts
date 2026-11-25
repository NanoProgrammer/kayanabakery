/**
 * Finding an existing customer from the order form — Situación 7.
 *
 *   npm run test:customer-lookup
 *
 * These guard the matching, because that is the part staff either trust
 * or stop using. A phone search that misses because the number on file
 * is written "(403) 383-3681" and they typed "4033833681" is a search
 * nobody tries a third time.
 */
import {
  normalize,
  phoneDigits,
  accountIdFrom,
  matchScore,
  rankCustomers,
  describeCustomer,
  fillFromCustomer,
  CUSTOMER_SEARCH_QUERY,
  type CustomerRecord,
} from "../lib/customers/lookup";

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

const ana: CustomerRecord = {
  _id: "customer-clx001",
  name: "Ana Muñoz",
  email: "ana@example.com",
  phone: "(403) 383-3681",
  tier: "SELECTO",
  language: "es",
  totalOrders: 11,
};
const anaB: CustomerRecord = {
  _id: "customer-clx002",
  name: "Ana Beltrán",
  email: "anab@example.com",
  phone: "587-111-2222",
  tier: "BASICO",
  totalOrders: 2,
};
const carlos: CustomerRecord = {
  _id: "customer-clx003",
  name: "Carlos Corona",
  email: "carlos@example.com",
  phone: "+1 403 555 0100",
  tier: "BASICO",
  totalOrders: 4,
};
const noEmail: CustomerRecord = {
  _id: "customer-clx004",
  name: "Walk In",
  email: null,
  phone: "4035550199",
  tier: null,
  totalOrders: 1,
};
const everyone = [ana, anaB, carlos, noEmail];

console.log("\nCustomer lookup\n");

console.log("  reading what was typed");
check("accents are ignored", normalize("Muñoz"), "munoz");
check("case is ignored", normalize("  ANA  "), "ana");
check("a phone loses its punctuation", phoneDigits("(403) 383-3681"), "4033833681");
check("...and its country code", phoneDigits("+1 403 383 3681"), "4033833681");
check("a bare number is already fine", phoneDigits("4033833681"), "4033833681");
check("nothing in, nothing out", phoneDigits(null), "");

console.log("\n  the account behind a customer");
// This is what links the order to their Club standing. It must never guess.
check("the account id comes out of the document id", accountIdFrom("customer-clx001"), "clx001");
check("a draft is the same customer", accountIdFrom("drafts.customer-clx001"), "clx001");
check("anything else is no account, not half an id", accountIdFrom("product-abc"), null);
check("an empty id is no account", accountIdFrom(""), null);
check("a bare prefix is no account", accountIdFrom("customer-"), null);

console.log("\n  searching");
check("one letter is not a search", matchScore(ana, "a"), null);
check("a name found", matchScore(ana, "ana") !== null, true);
check("...despite the accent", matchScore(ana, "munoz") !== null, true);
check("...and with the accent typed", matchScore(ana, "Muñoz") !== null, true);
check("an email found", matchScore(ana, "ana@example.com"), 0);
check("part of an email found", matchScore(carlos, "carlos@") !== null, true);
check("a phone found however it was typed", matchScore(ana, "4033833681"), 0);
check("...with punctuation", matchScore(ana, "(403) 383-3681"), 0);
check("...by its last digits, which is what people remember", matchScore(ana, "3681"), 1);
check("...and with a country code on file", matchScore(carlos, "4035550100"), 0);
check("somebody else's number does not match", matchScore(ana, "5871112222"), null);
check("a name that is not there does not match", matchScore(ana, "pedro"), null);

console.log("\n  two words narrow it");
// "ana" finds both; "ana beltran" must find one.
check("one word finds both Anas", rankCustomers(everyone, "ana").length >= 2, true);
check(
  "both words find one",
  rankCustomers(everyone, "ana beltran").map((c) => c._id),
  ["customer-clx002"]
);

console.log("\n  the order of the list");
// The obvious match first, and the same order every time: a dropdown
// that reshuffles between identical searches is one staff misclick.
check(
  "an exact phone beats a name",
  rankCustomers(everyone, "4033833681")[0]._id,
  "customer-clx001"
);
check(
  "between two equal names, the regular comes first",
  rankCustomers(everyone, "ana")[0]._id,
  "customer-clx001"
);
check(
  "the same search gives the same order",
  rankCustomers(everyone, "ana").map((c) => c._id),
  rankCustomers([...everyone].reverse(), "ana").map((c) => c._id)
);
check("nothing matches, nothing is offered", rankCustomers(everyone, "zzzz"), []);
check("the list is capped", rankCustomers(Array(50).fill(ana), "ana").length, 8);

console.log("\n  what the line says");
check("phone, email and how often they order", describeCustomer(ana), "(403) 383-3681 · ana@example.com · 11 orders");
check("one order is not '1 orders'", describeCustomer({ ...noEmail, totalOrders: 1 }), "4035550199 · 1 order");
check("a first-time customer says nothing extra", describeCustomer({ _id: "x", name: "New", totalOrders: 0 }), "");

console.log("\n  filling the order in");
check("every field the form needs", fillFromCustomer(ana), {
  customerName: "Ana Muñoz",
  customerEmail: "ana@example.com",
  customerPhone: "(403) 383-3681",
  customerTier: "SELECTO",
  customerLanguage: "es",
  customerId: "clx001",
});
// The language decides which language the invoice is WRITTEN in, so only
// the two we actually write may reach the order.
check("English comes through", fillFromCustomer({ _id: "customer-a", name: "A", language: "en" }).customerLanguage, "en");
// The customer sync writes this field as "Español" / "English", not as a
// two-letter code. Reading only the codes sent every synced customer an
// English invoice, because none of them ever matched.
check("the word the sync actually writes is understood", fillFromCustomer({ _id: "customer-a", name: "A", language: "Español" }).customerLanguage, "es");
check("...and the English one", fillFromCustomer({ _id: "customer-a", name: "A", language: "English" }).customerLanguage, "en");
check("...accent or no accent", fillFromCustomer({ _id: "customer-a", name: "A", language: "espanol" }).customerLanguage, "es");
check("anything else is no language, not a guess", fillFromCustomer({ _id: "customer-a", name: "A", language: "fr" }).customerLanguage, null);
check("...and none at all is none", fillFromCustomer(carlos).customerLanguage, null);
// The one that matters: a customer with no email must CLEAR the field,
// not leave the previous customer's address to be invoiced.
check("a missing email comes back as null, so the old one is cleared", fillFromCustomer(noEmail).customerEmail, null);
check("...and a missing tier too", fillFromCustomer(noEmail).customerTier, null);
check("whitespace is not a value", fillFromCustomer({ _id: "customer-z", name: "Z", email: "   " }).customerEmail, null);

console.log("\n  the query behind it");
check("it asks for customers", CUSTOMER_SEARCH_QUERY.includes('_type == "customer"'), true);
check("it brings the fields the dropdown shows", ["name", "email", "phone", "tier", "totalOrders"].every((f) => CUSTOMER_SEARCH_QUERY.includes(f)), true);
check("it is bounded, so the Studio cannot pull the whole dataset", CUSTOMER_SEARCH_QUERY.includes("[0...500]"), true);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
