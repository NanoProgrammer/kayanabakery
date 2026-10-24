/**
 * Proves the kitchen slip really prints the customer's plan.
 *
 * Karyana asked for it so a stack of slips shows priority at a glance, and so
 * that a Selecto order visibly coming out of the system is proof the weekly
 * automation ran. A typecheck only proves the component compiles, so this
 * renders a real PDF and reads the text back out of it.
 *
 *   npm run test:slip
 */
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { inflateSync } from "node:zlib";
import { PackingSlipPDF, type PackingSlipData } from "../lib/pdf/packing-slip-pdf";

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail?: string) {
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

/**
 * The visible text of a PDF, pulled out of its content streams.
 *
 * react-pdf flate-compresses the streams and writes the text as hex strings
 * inside TJ arrays — <53><45><4c> rather than (SEL) — so each stream is
 * inflated and every <…> run decoded. Literal (…) strings are collected too,
 * since a different font path can produce them.
 */
function pdfText(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  let out = "";
  const re = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const start = m.index + m[0].length;
    const end = raw.indexOf("endstream", start);
    if (end < 0) continue;
    const chunk = Buffer.from(raw.slice(start, end), "latin1");
    let text: string;
    try {
      text = inflateSync(chunk).toString("latin1");
    } catch {
      continue;
    }
    if (!/T[jJ]/.test(text)) continue;

    for (const t of text.matchAll(/<([0-9a-fA-F]+)>/g)) {
      const hex = t[1];
      if (hex.length % 2) continue;
      // Each pair is one character; the glyph codes here are plain ASCII.
      for (let i = 0; i < hex.length; i += 2) {
        out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
      }
    }
    for (const t of text.matchAll(/\(((?:[^()\\]|\\.)*)\)/g)) {
      out += t[1].replace(/\\([()\\])/g, "$1");
    }
    out += " ";
  }
  return out;
}

/** The badges are uppercased by the stylesheet, so compare case-blind. */
function has(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

const base: PackingSlipData = {
  orderNumber: "KAR-202610-00042",
  date: "2026/10/24",
  fulfillmentType: "PICKUP",
  customerName: "Karla Salazar",
  customerPhone: "+14033718966",
  shippingAddress: "Karyana Ruiz Bakery, Calgary",
  items: [
    { name: "Concha de chocolate", quantity: 3 },
    { name: "Pan tradicional", quantity: 4 },
  ],
  note: null,
  logoUrl: "public/logo-print.jpg",
};

async function textFor(data: PackingSlipData): Promise<string> {
  const buffer = await renderToBuffer(<PackingSlipPDF data={data} />);
  return pdfText(buffer);
}

async function main() {
  console.log("\nPacking slip — the membership badge\n");

  console.log("1. Each plan prints its own name\n");

  for (const [tier, label] of [
    ["SELECTO", "Selecto"],
    ["LEGENDARIO", "Legendario"],
    ["ARTESANO", "Artesano"],
    ["EMBAJADOR", "Embajador"],
    ["BASICO", "Basico"],
  ] as const) {
    const text = await textFor({ ...base, customerTier: tier });
    check(`${tier} prints "${label}"`, has(text, label), text.slice(0, 120));
  }

  console.log("\n2. The rest of the slip is untouched\n");

  const selecto = await textFor({ ...base, customerTier: "SELECTO" });
  check("the order number is still there", has(selecto, "KAR-202610-00042"));
  check("the customer's name is still there", has(selecto, "Karla Salazar"));
  check("the items are still there", has(selecto, "Concha de chocolate"));
  check("pickup is still marked", has(selecto, "Pickup"));

  console.log("\n3. An order with no plan recorded\n");

  const none = await textFor({ ...base, customerTier: null });
  check("falls back to Basico rather than printing nothing", has(none, "Basico"));

  const missing = await textFor({ ...base });
  check("and so does one with no field at all", has(missing, "Basico"));

  console.log("\n4. Delivery slips too\n");

  const delivery = await textFor({
    ...base,
    customerTier: "LEGENDARIO",
    fulfillmentType: "DELIVERY",
    shippingAddress: "123 Main St SE, Calgary",
  });
  check("the badge survives a delivery slip", has(delivery, "Legendario"));
  check("alongside the delivery marking", has(delivery, "Delivery"));

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
