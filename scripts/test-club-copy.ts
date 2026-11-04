/**
 * What the Karyana Club page promises about money.
 *
 *   npm run test:club
 *
 * These are not style checks. The page now states that every dollar comes
 * back as points, and that claim has to match lib/membership/benefit.ts,
 * which is the code that actually converts the fee. A wording change that
 * drifts from the conversion is a false promise about someone's money.
 */
import { CLUB_COPY, CLUB_NAME, clubCopy, autoReorderLabel, AUTO_REORDER } from "../lib/membership/club-copy";
import { pointsForFee, POINT_CENTS } from "../lib/membership/benefit";

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

console.log("\nThe Karyana Club copy\n");

console.log("  the promise matches what the code does");
// "100% of what you pay comes back as points" is only true while the fee
// converts at face value. $30 must become 3000 points, not 2900.
check("a $30 fee becomes 3000 points", pointsForFee(3000), 3000);
check("a $50 fee becomes 5000 points", pointsForFee(5000), 5000);
check("nothing is withheld at any amount", pointsForFee(1234), 1234);
check("1 point is 1 cent, as the copy says", POINT_CENTS, 1);
check("a free tier promises nothing it cannot pay", pointsForFee(0), 0);

console.log("\n  it says what it is");
for (const locale of ["en", "es"] as const) {
  const c = CLUB_COPY[locale];
  check(`${locale}: it is called the Karyana Club`, c.name, CLUB_NAME);
  check(
    `${locale}: the word prepayment/precompra is there`,
    /prepayment|precompra/i.test(`${c.eyebrow} ${c.whatItIs} ${c.reassurance}`),
    true
  );
  check(`${locale}: it says 100%`, c.money.includes("100%"), true);
  check(`${locale}: it says points/puntos`, /points|puntos/i.test(c.money), true);
  check(
    `${locale}: it mentions priority/prioridad`,
    /priority|prioridad/i.test(c.extras),
    true
  );
  check(
    `${locale}: it does not call itself a subscription`,
    /\bsubscription\b|suscripción/i.test(`${c.whatItIs} ${c.money} ${c.reassurance}`),
    false
  );
  // The free monthly loaf was removed from every tier; the copy must not
  // bring it back in prose.
  check(
    `${locale}: it promises no free bread`,
    /free bread|pan gratis|panes gratis/i.test(Object.values(c).join(" ")),
    false
  );
}

console.log("\n  the automatic order has one name");
check("English", autoReorderLabel("en"), "Bread auto reorder");
check("Spanish", autoReorderLabel("es"), "Pedido automático de pan");
check("an unknown locale falls back to English", autoReorderLabel("fr"), AUTO_REORDER.en);
check("clubCopy falls back to English too", clubCopy("fr").name, CLUB_NAME);
check("clubCopy('es') is Spanish", clubCopy("es"), CLUB_COPY.es);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
