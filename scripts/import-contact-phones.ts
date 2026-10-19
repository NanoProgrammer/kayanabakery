/**
 * Fills in missing customer phone numbers from a Google Contacts export.
 *
 *   npx tsx scripts/import-contact-phones.ts <contacts.csv>            dry run
 *   npx tsx scripts/import-contact-phones.ts --apply <contacts.csv>    write them
 *   ... --overwrite    also replace phones already on file
 *
 * Matches on email first. Then on full name, but only where the name is
 * unique on BOTH sides: one customer with it, one contact with it. A phone
 * book has the bakery's whole life in it — suppliers, family, people who were
 * never customers — and a wrong match means order texts going to a stranger.
 * Two Maria Garcias and the number could belong to either, so neither gets it.
 *
 * Existing phone numbers are left alone unless --overwrite is passed: what is
 * already on an account was typed by the customer, which beats a contact card
 * of unknown age.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import { existsSync, readFileSync } from "node:fs";

/** Minimal CSV reader: Google's export quotes fields and embeds newlines. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else quoted = false;
      } else cell += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }

  const [header = [], ...body] = rows;
  return body
    .filter((r) => r.some((v) => v.trim()))
    .map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

async function main() {
  const argv = process.argv.slice(2);
  const flags = argv.filter((a) => a.startsWith("--"));
  const words = argv.filter((a) => !a.startsWith("--"));

  // The flags are read from anywhere in the line, and from the environment,
  // because npm on Windows eats an unknown --flag that follows `--` instead of
  // forwarding it. The npm scripts (import:phones:apply) pass --apply ahead of
  // the path for that reason, so position cannot be relied on either.
  const apply = flags.includes("--apply") || process.env.APPLY === "1";
  const overwrite = flags.includes("--overwrite") || process.env.OVERWRITE === "1";

  // A path like `contacts (3).csv` arrives split in two when the quotes are
  // lost on the way through npm, so the pieces are joined back up.
  const csvPath = words.length > 1 && !existsSync(words[0]) ? words.join(" ") : words[0];
  if (!csvPath) {
    console.error("Usage: npx tsx scripts/import-contact-phones.ts <contacts.csv> [--apply] [--overwrite]");
    process.exit(1);
  }
  if (!existsSync(csvPath)) {
    console.error(`\nNo file at ${csvPath}`);
    console.error("Put the path in quotes if it has spaces in it.\n");
    process.exit(1);
  }

  const { PrismaClient } = await import("@prisma/client");
  const { toE164 } = await import("../lib/sms/twilio");
  const prisma = new PrismaClient();

  // Strip the BOM Google puts on the file, or the first header is unreadable.
  const raw = readFileSync(csvPath, "utf8").replace(/^﻿/, "");
  const contacts = parseCsv(raw);

  /** 10 or 11 digits only — a typo must not become someone's phone number. */
  function normalize(value: string): string | null {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 10) return toE164(digits);
    if (digits.length === 11 && digits.startsWith("1")) return toE164(`+${digits}`);
    return null;
  }

  /** Case, accents and spacing differ between a contact card and a signup. */
  function normalizeName(raw: string | null | undefined): string {
    return (raw ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // email -> first usable phone. Google exports both "E-mail 1" and "E-mail 2";
  // a customer may have signed up with either.
  const byEmail = new Map<string, { phone: string; name: string }>();

  // name -> every contact carrying it, so a repeated name can be recognised
  // as ambiguous rather than resolved by whichever row came first.
  const byName = new Map<string, { phone: string; name: string }[]>();

  let unusablePhones = 0;

  for (const c of contacts) {
    const phone =
      normalize(c["Phone 1 - Value"] ?? "") ?? normalize(c["Phone 2 - Value"] ?? "");
    const emails = [c["E-mail 1 - Value"], c["E-mail 2 - Value"]]
      .filter(Boolean)
      .map((e) => e!.toLowerCase().trim());

    if (!phone) {
      if ((c["Phone 1 - Value"] ?? "").trim()) unusablePhones++;
      continue;
    }
    const name = [c["First Name"], c["Last Name"]].filter(Boolean).join(" ").trim();
    for (const email of emails) {
      if (!byEmail.has(email)) byEmail.set(email, { phone, name });
    }

    const key = normalizeName(name);
    if (key) {
      const list = byName.get(key) ?? [];
      // The same person exported twice with the same number isn't ambiguous.
      if (!list.some((e) => e.phone === phone)) list.push({ phone, name });
      byName.set(key, list);
    }
  }

  console.log(`\nContacts file: ${csvPath}`);
  console.log(`  ${contacts.length} contacts, ${byEmail.size} with an email and a usable phone`);
  if (unusablePhones) {
    console.log(`  ${unusablePhones} had a phone that isn't a 10-digit number — skipped`);
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, phone: true },
  });

  type Fill = {
    id: string;
    email: string;
    name: string | null;
    from: string | null;
    to: string;
    how: "email" | "name";
  };

  const toFill: Fill[] = [];
  const alreadyHave: string[] = [];
  const ambiguous: string[] = [];
  let matchedByEmail = 0;
  let matchedByName = 0;

  // How many customers answer to each name. A name shared by two customers
  // can't identify either of them, whatever the contacts file says.
  const customersPerName = new Map<string, number>();
  for (const u of users) {
    const key = normalizeName(u.name);
    if (key) customersPerName.set(key, (customersPerName.get(key) ?? 0) + 1);
  }

  for (const u of users) {
    let hit = byEmail.get(u.email.toLowerCase());
    let how: "email" | "name" = "email";

    if (hit) {
      matchedByEmail++;
    } else {
      // No email match — fall back to the name, but only when it points at
      // exactly one person on each side.
      const key = normalizeName(u.name);
      if (!key) continue;

      const contacts = byName.get(key);
      if (!contacts) continue;

      if (contacts.length > 1) {
        ambiguous.push(`${u.name} — ${contacts.length} contacts share this name`);
        continue;
      }
      if ((customersPerName.get(key) ?? 0) > 1) {
        ambiguous.push(`${u.name} — ${customersPerName.get(key)} customers share this name`);
        continue;
      }

      hit = contacts[0];
      how = "name";
      matchedByName++;
    }

    if (u.phone && !overwrite) {
      alreadyHave.push(`${u.name ?? u.email} (${u.phone})`);
      continue;
    }
    if (u.phone === hit.phone) continue;

    toFill.push({ id: u.id, email: u.email, name: u.name, from: u.phone, to: hit.phone, how });
  }

  console.log(`\n${users.length} customers in the database`);
  console.log(`  ${matchedByEmail} matched by email`);
  console.log(`  ${matchedByName} matched by full name (unique on both sides)`);
  if (ambiguous.length) {
    console.log(`  ${ambiguous.length} skipped — the name doesn't identify one person:`);
    // Both halves of a duplicated pair report the same reason; say it once.
    for (const a of [...new Set(ambiguous)]) console.log(`      ${a}`);
  }
  console.log(`  ${alreadyHave.length} already have a phone — left alone${overwrite ? " (but --overwrite is on)" : ""}`);
  console.log(`  ${toFill.length} would be updated\n`);

  if (toFill.length === 0) {
    console.log("Nothing to do.\n");
    await prisma.$disconnect();
    return;
  }

  console.log("=".repeat(66));
  for (const u of toFill) {
    const via = u.how === "name" ? "  [matched by name]" : "";
    console.log(`  ${(u.name ?? u.email).padEnd(26)} ${(u.from ?? "(none)").padEnd(14)} → ${u.to}${via}`);
  }
  console.log("=".repeat(66));

  if (!apply) {
    console.log("\nDry run — nothing was written.");
    console.log('To save these:  npm run import:phones:apply -- "<ruta del csv>"\n');
    await prisma.$disconnect();
    return;
  }

  // Loaded separately from the writing below, and allowed to fail. Studio is
  // a mirror; the phone numbers are the point. Letting a Sanity problem throw
  // here once aborted the whole run and saved nothing at all.
  let syncCustomerToSanity: ((id: string) => Promise<boolean>) | null = null;
  try {
    ({ syncCustomerToSanity } = await import("../lib/sanity/sync-customers"));
  } catch (err: any) {
    console.warn(`\nStudio unavailable (${err?.message ?? err}) — saving anyway.`);
  }

  let saved = 0;
  let syncFailed = 0;

  for (const u of toFill) {
    await prisma.user.update({ where: { id: u.id }, data: { phone: u.to } });
    saved++;

    // Studio reads its own copy, so a number saved here is invisible there
    // until the customer document is rewritten.
    if (!syncCustomerToSanity) { syncFailed++; continue; }
    try {
      const ok = await syncCustomerToSanity(u.id);
      if (!ok) syncFailed++;
    } catch {
      syncFailed++;
    }
  }

  console.log(`\n${saved} phone number(s) saved.`);
  if (syncFailed > 0) {
    console.log(`${syncFailed} could not be refreshed in Studio — run: npm run sync:customers`);
  } else {
    console.log("Studio updated too.");
  }
  console.log("");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Failed:", err?.message ?? err);
  process.exitCode = 1;
});
