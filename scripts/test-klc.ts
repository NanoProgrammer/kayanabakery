/**
 * Karyana Loyalty Credits — the proposed scoring, tested before anyone
 * decides to switch tiers from paid to earned.
 *
 *   npm run test:klc
 *
 * NOT LIVE. None of this is wired into the checkout or the tier a customer
 * actually holds. These tests exist so the rules can be argued about against
 * real numbers, which is what the spec asks for.
 *
 * The rules under test come from the documents of 12 Nov 2026 and the two
 * addenda, including the clarification that the five pillars are ALTERNATIVE
 * ways to accumulate credits, not five requirements.
 */
import {
  TIER_THRESHOLDS,
  LEGENDARIO_MIN_PERSONAL_PURCHASES,
  KLC_PER_CONVERTED_REFERRAL,
  KLC_PER_NEW_FAMILY,
  BONUS_KLC_CAP_PER_YEAR,
  familyForCategories,
  dedupeEvents,
  applyBonusCap,
  countPersonalPurchases,
  earnedTier,
  totalCredits,
  describeProgress,
  isCreditableReferral,
  auditRowsFor,
  type KlcEvent,
} from "../lib/loyalty/klc";

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

const D = (iso: string) => new Date(iso);
const now = D("2026-11-13T12:00:00Z");

const ev = (
  kind: KlcEvent["kind"],
  credits: number,
  at: string,
  key: string
): KlcEvent => ({ kind, credits, at: D(at), idempotencyKey: key, reference: key });

const buy = (day: string, valid = true) => ({ day, valid });

console.log("\nKaryana Loyalty Credits (proposal)\n");

console.log("  the proposed thresholds");
check("Artesano at 4", TIER_THRESHOLDS.ARTESANO, 4);
check("Selecto at 10", TIER_THRESHOLDS.SELECTO, 10);
check("Legendario at 18", TIER_THRESHOLDS.LEGENDARIO, 18);
check("a converted referral is worth 2", KLC_PER_CONVERTED_REFERRAL, 2);
check("a new family is worth 1", KLC_PER_NEW_FAMILY, 1);
check("the yearly bonus cap is 6", BONUS_KLC_CAP_PER_YEAR, 6);

console.log("\n  the tier earned");
const fourBuys = [buy("2026-01-02"), buy("2026-03-04"), buy("2026-06-05"), buy("2026-09-06")];
check("nothing earns Básico", earnedTier(0, []).tier, "BASICO");
check("3 credits is still Básico", earnedTier(3, fourBuys).tier, "BASICO");
check("4 earns Artesano", earnedTier(4, fourBuys).tier, "ARTESANO");
check("10 earns Selecto", earnedTier(10, fourBuys).tier, "SELECTO");
check("18 with four purchases earns Legendario", earnedTier(18, fourBuys).tier, "LEGENDARIO");

console.log("\n  Legendario needs both conditions");
// Referrals and exploration must not substitute for personal purchases.
const threeBuys = fourBuys.slice(0, 3);
check("18 credits but three purchases is held at Selecto", earnedTier(18, threeBuys).tier, "SELECTO");
check("...and says why", earnedTier(18, threeBuys).heldBack, "NEEDS_PERSONAL_PURCHASES");
check("18 credits and no purchases at all is held too", earnedTier(18, []).heldBack, "NEEDS_PERSONAL_PURCHASES");
check("four purchases alone do not earn Legendario", earnedTier(5, fourBuys).tier, "ARTESANO");
check("the minimum is four", LEGENDARIO_MIN_PERSONAL_PURCHASES, 4);
// The pillars are alternative: a brand-new customer with no tenure can reach
// Legendario if both conditions are met. (Email, 12 Nov 2026, 9:01 PM.)
check(
  "a new customer with no tenure credits can still be Legendario",
  earnedTier(18, [buy("2026-11-01"), buy("2026-11-05"), buy("2026-11-08"), buy("2026-11-12")]).tier,
  "LEGENDARIO"
);

console.log("\n  purchases on distinct dates");
check("two orders the same day count once", countPersonalPurchases([buy("2026-11-01"), buy("2026-11-01")]), 1);
check("four days count four", countPersonalPurchases(fourBuys), 4);
check("an invalid order does not count", countPersonalPurchases([buy("2026-11-01", false)]), 0);
check(
  "four orders on one day do not reach Legendario",
  earnedTier(18, [buy("2026-11-01"), buy("2026-11-01"), buy("2026-11-01"), buy("2026-11-01")]).tier,
  "SELECTO"
);

console.log("\n  product families, for exploration");
check("conchas", familyForCategories(["conchas"]), "CONCHAS_PAN_DULCE");
check("pan dulce", familyForCategories(["pan-dulce"]), "CONCHAS_PAN_DULCE");
check("a tres leches is a cake", familyForCategories(["cakes", "tres-leches"]), "PASTELES");
check("gelatinas are desserts", familyForCategories(["gelatinas-y-flanes"]), "POSTRES");
// A product in no family earns nothing rather than being guessed into one.
check("an unmapped category earns no family", familyForCategories(["decoraciones"]), null);
check("no categories, no family", familyForCategories([]), null);
check("missing categories, no family", familyForCategories(null), null);

console.log("\n  nothing is credited twice");
const twice = [
  ev("REFERRAL", 2, "2026-03-01T00:00:00Z", "ref:carla"),
  ev("REFERRAL", 2, "2026-03-01T00:00:00Z", "ref:carla"),
];
check("the same referral once", dedupeEvents(twice).length, 1);
check("...worth 2, not 4", totalCredits(twice, now), 2);
const sameFamilyTwice = [
  ev("EXPLORATION", 1, "2026-04-01T00:00:00Z", "fam:PASTELES"),
  ev("EXPLORATION", 1, "2026-05-01T00:00:00Z", "fam:PASTELES"),
];
check("a family is recognised once, however many flavours", totalCredits(sameFamilyTwice, now), 1);
check(
  "four different families earn four",
  totalCredits(
    (["CONCHAS_PAN_DULCE", "PAN_TRADICIONAL", "PASTELES", "POSTRES"] as const).map((f, i) =>
      ev("EXPLORATION", 1, `2026-0${i + 1}-01T00:00:00Z`, `fam:${f}`)
    ),
    now
  ),
  4
);

console.log("\n  the 6-per-365-days ceiling");
const sevenReferrals = Array.from({ length: 4 }, (_, i) =>
  ev("REFERRAL", 2, `2026-0${i + 1}-01T00:00:00Z`, `ref:${i}`)
);
check("four referrals would be 8, capped to 6", applyBonusCap(sevenReferrals, now).totals.granted, 6);
// Refused, not deferred: the addendum says a credit over the ceiling is not
// granted, so it must not reappear later.
check("the fourth is refused outright", applyBonusCap(sevenReferrals, now).totals.refused, 2);
check(
  "purchases and spend are NOT capped",
  totalCredits(
    [
      ...sevenReferrals,
      ev("PURCHASE", 10, "2026-05-01T00:00:00Z", "buy:1"),
      ev("SPEND", 5, "2026-06-01T00:00:00Z", "spend:1"),
    ],
    now
  ),
  21
);
check(
  "the window rolls: a referral 400 days earlier does not count against it",
  applyBonusCap(
    [
      ev("REFERRAL", 2, "2025-01-01T00:00:00Z", "ref:old1"),
      ev("REFERRAL", 2, "2025-01-02T00:00:00Z", "ref:old2"),
      ev("REFERRAL", 2, "2025-01-03T00:00:00Z", "ref:old3"),
      ev("REFERRAL", 2, "2026-06-01T00:00:00Z", "ref:new"),
    ],
    now
  ).totals.granted,
  8
);
check(
  "a credit that would only partly fit is refused whole",
  applyBonusCap(
    [
      ev("EXPLORATION", 1, "2026-01-01T00:00:00Z", "f1"),
      ev("EXPLORATION", 1, "2026-01-02T00:00:00Z", "f2"),
      ev("EXPLORATION", 1, "2026-01-03T00:00:00Z", "f3"),
      ev("EXPLORATION", 1, "2026-01-04T00:00:00Z", "f4"),
      ev("EXPLORATION", 1, "2026-01-05T00:00:00Z", "f5"),
      ev("REFERRAL", 2, "2026-01-06T00:00:00Z", "r1"),
    ],
    now
  ).totals,
  { granted: 5, refused: 2 }
);

console.log("\n  integrity");
const ok = {
  referrerId: "a",
  referredUserId: "b",
  hasFirstValidPurchase: true,
  suspectedSameParty: false,
  orderIsTest: false,
};
check("a real converted referral is creditable", isCreditableReferral(ok), { creditable: true });
// Registering alone earns no KLC — the Karyana Points reward for registering
// is a separate system and is untouched.
check(
  "registering without buying is not",
  isCreditableReferral({ ...ok, hasFirstValidPurchase: false }),
  { creditable: false, reason: "no_purchase_yet" }
);
check(
  "referring yourself is not",
  isCreditableReferral({ ...ok, referredUserId: "a" }),
  { creditable: false, reason: "self_referral" }
);
check(
  "the same person behind two accounts is not",
  isCreditableReferral({ ...ok, suspectedSameParty: true }),
  { creditable: false, reason: "same_party" }
);
check(
  "a test order is not",
  isCreditableReferral({ ...ok, orderIsTest: true }),
  { creditable: false, reason: "test_order" }
);

console.log("\n  the audit trail");
const rows = auditRowsFor([...twice, ...sevenReferrals], now);
check("every event gets a row, granted or not", rows.length, 6);
check("the duplicate is recorded as refused", rows.filter((r) => r.refusedReason === "duplicate").length, 1);
check("the capped one says so", rows.some((r) => r.refusedReason === "yearly_cap"), true);
check("each row carries its reference", rows.every((r) => r.reference !== undefined), true);
check("...and its kind and credits", rows.every((r) => !!r.kind && typeof r.credits === "number"), true);

console.log("\n  what the member is shown");
check(
  "no formula, just the next step",
  describeProgress(earnedTier(2, []), "en"),
  "Every purchase, recommendation and new experience brings you closer to Artesano — 2 to go"
);
check(
  "in Spanish",
  describeProgress(earnedTier(8, fourBuys), "es"),
  "Cada compra, recomendación y nueva experiencia te acerca a Selecto — te faltan 2"
);
check(
  "held back says what is actually missing",
  describeProgress(earnedTier(18, threeBuys), "en"),
  "1 more purchase to reach Legendario"
);
check("...and not in the plural", describeProgress(earnedTier(18, threeBuys), "es"), "Te falta 1 compra para Legendario");
check("Legendario is told so", describeProgress(earnedTier(18, fourBuys), "en"), "You are Legendario");

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
