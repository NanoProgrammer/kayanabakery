/**
 * Fills in missing customer phone numbers from a Google Contacts export.
 *
 *   npx tsx scripts/import-contact-phones.ts <contacts.csv>            dry run
 *   npx tsx scripts/import-contact-phones.ts <contacts.csv> --apply    write them
 *   ... --overwrite    also replace phones already on file
 *
 * Matches on email only. A phone book has the bakery's whole life in it —
 * suppliers, family, people who were never customers — and two different
 * people share a name far more often than they share an email address. A
 * wrong match here means order texts going to a stranger.
 *
 * Existing phone numbers are left alone unless --overwrite is passed: what is
 * already on an account was typed by the customer, which beats a contact card
 * of unknown age.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import { readFileSync } from "node:fs";

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
  const [csvPath, ...flags] = process.argv.slice(2);
  if (!csvPath) {
    console.error("Usage: npx tsx scripts/import-contact-phones.ts <contacts.csv> [--apply] [--overwrite]");
    process.exit(1);
  }
  const apply = flags.includes("--apply");
  const overwrite = flags.includes("--overwrite");

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

  // email -> first usable phone. Google exports both "E-mail 1" and "E-mail 2";
  // a customer may have signed up with either.
  const byEmail = new Map<string, { phone: string; name: string }>();
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
  }

  console.log(`\nContacts file: ${csvPath}`);
  console.log(`  ${contacts.length} contacts, ${byEmail.size} with an email and a usable phone`);
  if (unusablePhones) {
    console.log(`  ${unusablePhones} had a phone that isn't a 10-digit number — skipped`);
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, phone: true },
  });

  const toFill: { id: string; email: string; name: string | null; from: string | null; to: string }[] = [];
  const alreadyHave: string[] = [];
  let matched = 0;

  for (const u of users) {
    const hit = byEmail.get(u.email.toLowerCase());
    if (!hit) continue;
    matched++;

    if (u.phone && !overwrite) {
      alreadyHave.push(`${u.name ?? u.email} (${u.phone})`);
      continue;
    }
    if (u.phone === hit.phone) continue;

    toFill.push({ id: u.id, email: u.email, name: u.name, from: u.phone, to: hit.phone });
  }

  console.log(`\n${users.length} customers in the database`);
  console.log(`  ${matched} matched a contact by email`);
  console.log(`  ${alreadyHave.length} already have a phone — left alone${overwrite ? " (but --overwrite is on)" : ""}`);
  console.log(`  ${toFill.length} would be updated\n`);

  if (toFill.length === 0) {
    console.log("Nothing to do.\n");
    await prisma.$disconnect();
    return;
  }

  console.log("=".repeat(66));
  for (const u of toFill) {
    console.log(`  ${(u.name ?? u.email).padEnd(28)} ${u.from ?? "(none)"} → ${u.to}`);
  }
  console.log("=".repeat(66));

  if (!apply) {
    console.log("\nDry run — nothing was written.");
    console.log("Run it again with --apply to save these.\n");
    await prisma.$disconnect();
    return;
  }

  const { syncCustomerToSanity } = await import("../lib/sanity/sync-customers");
  let saved = 0;
  let syncFailed = 0;

  for (const u of toFill) {
    await prisma.user.update({ where: { id: u.id }, data: { phone: u.to } });
    saved++;
    // Studio reads its own copy, so a number saved here is invisible there
    // until the customer document is rewritten.
    const ok = await syncCustomerToSanity(u.id);
    if (!ok) syncFailed++;
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
