/**
 * Which language each customer is written to in.
 *
 * Two bugs lived here. preferredLang defaults to "en" for every account, and
 * the code read that as a choice — so customers who never opened their
 * preferences were all written to in English. And the name guess matched on
 * first names alone, which called "Andrea Martens" Spanish while missing
 * "Ruben Perez", because Pérez wasn't in the surname list at all.
 *
 *   npm run test:language
 */
import { resolveCustomerLocale } from "../lib/notifications/order-messages";
import { guessLanguageFromName } from "../lib/i18n/guess-language";

let passed = 0;
let failed = 0;

function check(label: string, actual: string, expected: string) {
  if (actual === expected) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.log(`  ✗ ${label} — expected ${expected}, got ${actual}`); }
}

console.log("\nCustomer language");
console.log("=".repeat(64));

console.log("\nA stated preference settles it, either way:\n");
check("chose Spanish", resolveCustomerLocale({ preferredLang: "es", langChosenByUser: true, name: "John Smith" }), "es");
check("chose English, Spanish name", resolveCustomerLocale({ preferredLang: "en", langChosenByUser: true, name: "Ruben Perez" }), "en");

console.log("\nThe database default is not a choice:\n");
check(
  "never chose, Spanish surname → Spanish",
  resolveCustomerLocale({ preferredLang: "en", langChosenByUser: false, name: "Ruben Perez" }),
  "es"
);
check(
  "never chose, English name → English",
  resolveCustomerLocale({ preferredLang: "en", langChosenByUser: false, name: "Andrea Martens" }),
  "en"
);
check(
  "'es' without the flag is still trusted — nobody lands there by accident",
  resolveCustomerLocale({ preferredLang: "es", langChosenByUser: false, name: "John Smith" }),
  "es"
);

console.log("\nReal customers:\n");
const real: [string, "es" | "en"][] = [
  ["Ruben Perez", "es"],
  ["Sergio De la cruz", "es"],
  ["Lisa Cuellar", "es"],
  ["Carlos Corona", "es"],
  ["Santiago Gonzalez", "es"],
  ["Andrea Martens", "en"],
  ["Bukola Morolari", "en"],
  ["Harsarwan Mann", "en"],
  ["Karen Matharu", "en"],
  ["Jennel Duluguin", "en"],
];
for (const [name, expected] of real) check(name, guessLanguageFromName(name), expected);

console.log("\nA first name alone is weak evidence:\n");
check("Andrea Martens — Andrea is ordinary in English too", guessLanguageFromName("Andrea Martens"), "en");
check("Kevin Walsh", guessLanguageFromName("Kevin Walsh"), "en");
check("Andrea Gutierrez — the surname decides", guessLanguageFromName("Andrea Gutierrez"), "es");

console.log("\nEdge cases:\n");
check("an accent is never accidental", guessLanguageFromName("Jose Muñoz"), "es");
check("two surnames", guessLanguageFromName("Ana Maria Lopez Vargas"), "es");
check("no name at all", guessLanguageFromName(null), "en");
check("one word only", guessLanguageFromName("Guadalupe"), "es");

console.log("\n" + "=".repeat(64));
console.log(`${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
