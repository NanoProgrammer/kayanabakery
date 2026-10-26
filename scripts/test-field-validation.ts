/**
 * The rules for anything the public types in.
 *
 * Every endpoint used to carry its own idea of a field — `z.string().min(2)`
 * in one place, nothing at all in another — so "db drop table" was accepted as
 * a street name and "T3M4TB" as a postal code. Neither can touch the database
 * (Prisma parameterises everything and no raw SQL is built anywhere), but a
 * postal code that isn't one cannot be checked against a delivery zone.
 *
 * Half of this file is names that must keep working. A bakery in Calgary
 * serves people with accents, apostrophes and hyphens, and a validator that
 * rejects "O'Brien" or "Ngô" is a worse bug than the one it was added for.
 *
 *   npm run test:fields
 */
import * as f from "../lib/validation/fields";

let passed = 0;
let failed = 0;

function ok(label: string, schema: { safeParse: (v: unknown) => any }, input: unknown, expected?: unknown) {
  const r = schema.safeParse(input);
  if (!r.success) {
    failed++;
    console.log(`  ✗ ${label} — rejected: ${r.error.issues[0]?.message}`);
    return;
  }
  if (expected !== undefined && JSON.stringify(r.data) !== JSON.stringify(expected)) {
    failed++;
    console.log(`  ✗ ${label}`);
    console.log(`      expected: ${JSON.stringify(expected)}`);
    console.log(`      got:      ${JSON.stringify(r.data)}`);
    return;
  }
  passed++;
  console.log(`  ✓ ${label}${expected !== undefined ? ` → ${JSON.stringify(r.data)}` : ""}`);
}

function rejects(label: string, schema: { safeParse: (v: unknown) => any }, input: unknown) {
  const r = schema.safeParse(input);
  if (r.success) {
    failed++;
    console.log(`  ✗ ${label} — was accepted as ${JSON.stringify(r.data)}`);
    return;
  }
  passed++;
  console.log(`  ✓ ${label}`);
}

console.log("\nField validation\n");

console.log("1. Postal codes — the one in the screenshot\n");

rejects("T3M4TB is not a postal code", f.postalCode, "T3M4TB");
ok("T3M 4T5 is", f.postalCode, "T3M 4T5", "T3M 4T5");
ok("t3m4t5 is normalised", f.postalCode, "t3m4t5", "T3M 4T5");
ok("spaces and dashes are cleaned up", f.postalCode, " t3m - 4t5 ", "T3M 4T5");
rejects("D is never used", f.postalCode, "D3M 4T5");
rejects("nor O", f.postalCode, "T3O 4T5");
rejects("Z never starts one", f.postalCode, "Z3M 4T5");
rejects("a US zip", f.postalCode, "90210");
rejects("empty", f.postalCode, "");

console.log("\n2. Real names must keep working\n");

for (const name of [
  "Karyana Ruiz",
  "O'Brien",
  "Jean-Luc",
  "Ngô Bảo Châu",
  "José Ángel Peña",
  "Ña Luz",
  "Иван Петров",
  "李 明",
  "van der Berg",
]) {
  ok(name, f.personName, name);
}

console.log("\n3. Names that aren't\n");

rejects("a single letter", f.personName, "A");
rejects("only punctuation", f.personName, "---");
rejects("a link", f.personName, "buy now http://spam.example");
rejects("markup", f.personName, "<script>alert(1)</script>");
rejects("nothing", f.personName, "   ");
rejects("a wall of text", f.personName, "a".repeat(200));

console.log("\n4. Text is cleaned, not mangled\n");

ok("extra spaces collapse", f.street, "1817   16  st sw", "1817 16 st sw");
ok("a tab and a newline go", f.street, "1817 16\tst\nsw", "1817 16 st sw");
ok(
  "invisible direction overrides are stripped",
  f.street,
  "1817 ‮16 st sw",
  "1817 16 st sw"
);
ok("an apostrophe survives — it is not an attack", f.street, "O'Connor Ave", "O'Connor Ave");
ok("so does a quote", f.street, 'The "Old" Mill Rd', 'The "Old" Mill Rd');
ok(
  "and so does the string from the screenshot — it is just a bad street",
  f.street,
  "db drop table",
  "db drop table"
);

console.log("\n5. Provinces\n");

ok("a code", f.province, "AB", "AB");
ok("lower case", f.province, "ab", "AB");
ok("a full name", f.province, "Alberta", "AB");
ok("with an accent", f.province, "Québec", "QC");
rejects("a US state", f.province, "CA");
rejects("nonsense", f.province, "XX");

console.log("\n6. Phone numbers\n");

ok("ten digits", f.phone, "4037101161", "+14037101161");
ok("the way people write them", f.phone, "(403) 710-1161", "+14037101161");
ok("with a country code", f.phone, "1 403 710 1161", "+14037101161");
ok("already E.164", f.phone, "+14037101161", "+14037101161");
rejects("too few digits", f.phone, "40371011");
rejects("letters", f.phone, "call me");
rejects("empty", f.phone, "");

console.log("\n7. Emails\n");

ok("normalised", f.email, "  Someone@Example.COM ", "someone@example.com");
rejects("no domain", f.email, "someone@");
rejects("a sentence", f.email, "email me at someone@example.com please");

console.log("\n8. Optional fields\n");

ok("an empty buzzer is simply absent", f.buzzer, "", undefined);
ok("whitespace too", f.buzzer, "   ", undefined);
ok("a real one is kept", f.buzzer, "1203", "1203");
ok("notes keep their line breaks", f.notes, "No nuts.\n\nLeave at the door.", "No nuts.\n\nLeave at the door.");
ok("but not a hundred blank lines", f.notes, "a\n\n\n\n\n\nb", "a\n\nb");
rejects("notes have a limit", f.notes, "x".repeat(600));

console.log("\n9. Codes\n");

ok("a coupon", f.code, "welcome10", "WELCOME10");
ok("with a dash", f.code, "pan-dulce", "PAN-DULCE");
rejects("with a space", f.code, "pan dulce");
rejects("with markup", f.code, "<b>x</b>");

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
