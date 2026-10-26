/**
 * One definition per kind of field the public can type into.
 *
 * Every endpoint had its own idea of what a street or a postal code was —
 * `z.string().min(2)` in one place, nothing at all in another — so "db drop
 * table" was a street name and "T3M4TB" was a postal code. Neither can harm
 * the database (Prisma parameterises every query and no raw SQL is built
 * anywhere), but both are wrong on a delivery label, and a postal code that
 * isn't one cannot be checked against a delivery zone.
 *
 * The rules here are deliberately about shape, not taste: they reject what is
 * provably not a name, an address or a phone number, normalise what is, and
 * otherwise leave people's own words alone. A bakery in Calgary serves people
 * with accents, apostrophes and hyphens in their names, and a validator that
 * refuses "Ña" or "O'Brien" is a worse bug than the one it was added for.
 */
import { z } from "zod";

// Removed outright: they are not separators, so deleting one must not open a
// gap. Zero-width characters, word joiners, and the bidirectional overrides
// that let text render in an order it is not stored in — a real way to make an
// address on a printed slip read as something other than what is stored.
const ZERO_WIDTH = /[​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;

// Replaced with a space: these DO separate words. Deleting them outright
// turned "16\tst\nsw" into "16stsw", so an address pasted from anywhere with a
// line break in it came out as one glued-together word.
const CONTROL = /[\u0000-\u001F\u007F-\u009F]/g;
const CONTROL_KEEPING_NEWLINES = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g;

/** Trim, drop invisibles, collapse runs of whitespace. */
export function cleanText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(ZERO_WIDTH, "")
    .replace(CONTROL, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The same, but newlines survive — for notes and messages. */
export function cleanMultiline(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/\r\n?/g, "\n")
    .replace(ZERO_WIDTH, "")
    .replace(CONTROL_KEEPING_NEWLINES, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** A single-line field of bounded length. */
export const text = (min: number, max: number, label: string) =>
  z.preprocess(cleanText, z.string().min(min, `${label} is too short`).max(max, `${label} is too long`));

/** An optional single-line field; "" and whitespace become undefined. */
export const optionalText = (max: number, label: string) =>
  z.preprocess(
    (v) => {
      const cleaned = cleanText(v);
      return cleaned === "" ? undefined : cleaned;
    },
    z.string().max(max, `${label} is too long`).optional()
  );

export const optionalMultiline = (max: number, label: string) =>
  z.preprocess(
    (v) => {
      const cleaned = cleanMultiline(v);
      return cleaned === "" ? undefined : cleaned;
    },
    z.string().max(max, `${label} is too long`).optional()
  );

/**
 * A person's name. Letters from any alphabet, plus the punctuation that
 * genuinely appears in names — not a Latin-only whitelist.
 */
export const personName = z.preprocess(
  cleanText,
  z
    .string()
    .min(2, "Name is too short")
    .max(80, "Name is too long")
    .refine((v) => /\p{L}/u.test(v), "Name needs at least one letter")
    .refine(
      (v) => !/[<>{}\\]|https?:\/\//i.test(v),
      "That doesn't look like a name"
    )
);

export const email = z.preprocess(
  (v) => cleanText(v).toLowerCase(),
  z.string().email("That email doesn't look right").max(254)
);

/** Street, city — free-form enough to hold a real address, bounded. */
export const street = text(3, 120, "Street");
export const city = text(2, 60, "City");

const PROVINCES: Record<string, string> = {
  ab: "AB", alberta: "AB",
  bc: "BC", "british columbia": "BC",
  mb: "MB", manitoba: "MB",
  nb: "NB", "new brunswick": "NB",
  nl: "NL", "newfoundland and labrador": "NL",
  ns: "NS", "nova scotia": "NS",
  nt: "NT", "northwest territories": "NT",
  nu: "NU", nunavut: "NU",
  on: "ON", ontario: "ON",
  pe: "PE", "prince edward island": "PE",
  qc: "QC", quebec: "QC", québec: "QC",
  sk: "SK", saskatchewan: "SK",
  yt: "YT", yukon: "YT",
};

/** Normalised to the two-letter code, from either a code or a full name. */
export const province = z.preprocess(
  (v) => PROVINCES[cleanText(v).toLowerCase()] ?? cleanText(v).toUpperCase(),
  z.string().refine((v) => Object.values(PROVINCES).includes(v), "Not a Canadian province")
);

/**
 * A Canadian postal code, normalised to "T3M 4TB" shape — except that isn't
 * one: Canada Post alternates letter and digit, so the accepted form is
 * A1A 1A1. D, F, I, O, Q and U never appear, and W and Z never start one.
 */
const FORBIDDEN_LETTERS = /[DFIOQU]/;
export const postalCode = z.preprocess(
  (v) => cleanText(v).toUpperCase().replace(/\s|-/g, ""),
  z
    .string()
    .regex(/^[A-Z]\d[A-Z]\d[A-Z]\d$/, "That isn't a Canadian postal code")
    .refine((v) => !FORBIDDEN_LETTERS.test(v), "That isn't a Canadian postal code")
    .refine((v) => !/^[WZ]/.test(v), "That isn't a Canadian postal code")
    // Stored with the space, the way everyone writes it.
    .transform((v) => `${v.slice(0, 3)} ${v.slice(3)}`)
);

/**
 * A phone number, normalised to E.164 so one customer is one number however
 * they typed it. Ten digits are assumed Canadian, which is what the bakery's
 * customers have.
 */
export const phone = z.preprocess(
  (v) => {
    const digits = cleanText(v).replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    if (typeof v === "string" && v.trim().startsWith("+")) return `+${digits}`;
    return digits;
  },
  z.string().regex(/^\+[1-9]\d{7,14}$/, "That doesn't look like a phone number")
);

export const optionalPhone = z.union([phone, z.preprocess(
  (v) => (cleanText(v) === "" ? undefined : v),
  z.undefined()
)]);

/** A buzzer or unit number: short, and not a sentence. */
export const buzzer = optionalText(20, "Buzzer");

/** Delivery or order notes — the one place people write freely. */
export const notes = optionalMultiline(500, "Notes");

/** A coupon or referral code: the characters codes are actually made of. */
export const code = z.preprocess(
  (v) => cleanText(v).toUpperCase(),
  z.string().regex(/^[A-Z0-9][A-Z0-9-]{1,31}$/, "That isn't a valid code")
);
