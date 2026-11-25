/**
 * The Karyana Club is a game of levels. It is not for sale.
 *
 *   npm run test:club-not-for-sale
 *
 * This reads the source of the Club page and the components it renders and
 * refuses anything that would make a level look purchasable: a monthly
 * price, a Subscribe button, a card on file, a plan to cancel.
 *
 * It exists because the page said the opposite twice. A roadmap explaining
 * that levels are earned, sitting underneath a table of "$30/month ·
 * Subscribe", does not teach anyone the rules — it just contradicts
 * itself, and the version a customer believes is the one with the button.
 * No unit test on the loyalty maths would ever have caught that, because
 * nothing was broken except what the page said.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

const root = join(__dirname, "..");

/** The files a visitor to /memberships actually sees. */
const PAGE = "app/(pages)/memberships/page.tsx";
const RENDERED = [
  PAGE,
  "components/membership/MembershipsHero.tsx",
  "components/membership/ClubRoadmap.tsx",
  "components/membership/ClubTiers.tsx",
  "components/membership/MembershipBenefitsGrid.tsx",
  "components/membership/MembershipFAQ.tsx",
];

/**
 * Comments are where we explain what was removed and why, so they are not
 * evidence of a price. Only what ships to the screen counts.
 */
function visibleSource(file: string): string {
  return readFileSync(join(root, file), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
}

const all = RENDERED.map((f) => ({ file: f, src: visibleSource(f) }));

console.log("\nThe Club is not for sale\n");

console.log("  every file it renders exists");
check(
  "all of them read",
  all.every((f) => f.src.length > 0),
  true
);

console.log("\n  nothing on the page asks for money");
// Each of these shipped on the live page at some point. Named one by one
// so a failure says exactly which came back.
const FORBIDDEN: { needle: RegExp; what: string }[] = [
  { needle: /\/month\b/, what: "a monthly price" },
  { needle: /\/mes\b/, what: "a monthly price in Spanish" },
  { needle: /\bperMonth\b/, what: "the per-month label" },
  { needle: /\bperYear\b/, what: "the per-year label" },
  { needle: /membership\.subscribe/, what: "the Subscribe button" },
  { needle: /\bpriceCents\b/, what: "a price read from the tier data" },
  { needle: /card on file/i, what: "a card on file" },
  { needle: /tarjeta en file|tarjeta requerida/i, what: "a card requirement in Spanish" },
  { needle: /membership\/checkout/, what: "a link to the membership checkout" },
  { needle: /currentPlan|Current plan|plan actual/i, what: "the words 'current plan'" },
];
for (const { needle, what } of FORBIDDEN) {
  const offenders = all.filter((f) => needle.test(f.src)).map((f) => f.file);
  check(`no ${what}`, offenders, []);
}

console.log("\n  the page says how a level IS reached");
const tiers = all.find((f) => f.file === "components/membership/ClubTiers.tsx")!.src;
// KLC, not dollars, is what a column leads with.
check("the level table talks in KLC", tiers.includes("KLC"), true);
check("...and reads the real thresholds rather than hard-coding them", tiers.includes("TIER_THRESHOLDS"), true);
check(
  "...including the purchases Legendario needs",
  tiers.includes("LEGENDARIO_MIN_PERSONAL_PURCHASES"),
  true
);
check("it says the levels are earned", /gana|earned/i.test(tiers), true);
// Embajador is the one level KLC cannot buy, and it is still not for sale:
// it is applied for.
check("Embajador points at the application, not a checkout", tiers.includes("/ambassador"), true);

console.log("\n  the climb is on the page, above the detail");
const page = all.find((f) => f.file === PAGE)!.src;
check("the roadmap is rendered", page.includes("<ClubRoadmap"), true);
check("the level table is rendered", page.includes("<ClubTiers"), true);
check("the old pricing table is gone", page.includes("MembershipPricingTable"), false);
check(
  "the roadmap comes first",
  page.indexOf("<ClubRoadmap") < page.indexOf("<ClubTiers"),
  true
);

console.log("\n  and KLC is not described as money");
const faq = all.find((f) => f.file === "components/membership/MembershipFAQ.tsx")!.src;
check("the FAQ says KLC are not money", /no son dinero/.test(faq), true);
check("...in English too", /not money/.test(faq), true);
check("the level table says it as well", /no son dinero|not money/.test(tiers), true);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
