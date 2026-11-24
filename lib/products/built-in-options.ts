/**
 * Cake options (size, flavour) built into the code.
 *
 * Same story as the subcategories: these were meant to be written into
 * Sanity by `npm run cakes:setup:apply`, which has never run, so the
 * flavours Karyana asked for are not on the products.
 *
 * The merge rule is the important part. Sanity ALWAYS wins per option key:
 * if a product already has a `size` option, its choices and their price
 * differences are left exactly as they are, and only a missing option is
 * filled in. Every built-in choice is +$0, so nothing here can change what a
 * customer is charged for something that already had a price.
 *
 * Used by the product page AND by the checkout, from this one function,
 * because the checkout validates and prices options from the same list. If
 * the two ever disagreed the customer would pick a flavour and be told it
 * was invalid.
 */
import type { ProductOption } from "./options";
import { inchesFromLabel } from "./servings";

type BuiltInChoice = { label: string; labelEs: string };
type BuiltInOption = {
  key: string;
  name: string;
  nameEs: string;
  choices: BuiltInChoice[];
};

const VANILLA: BuiltInChoice = { label: "Vanilla", labelEs: "Vainilla" };
const CHOCOLATE: BuiltInChoice = { label: "Chocolate", labelEs: "Chocolate" };
const STRAWBERRY: BuiltInChoice = { label: "Strawberry", labelEs: "Fresa" };

const flavour = (...choices: BuiltInChoice[]): BuiltInOption => ({
  key: "flavour",
  name: "Flavour",
  nameEs: "Sabor",
  choices,
});

const size = (...inches: number[]): BuiltInOption => ({
  key: "size",
  name: "Size",
  nameEs: "Tamaño",
  choices: inches.map((n) => ({ label: `${n}"`, labelEs: `${n}"` })),
});

/**
 * What each cake should be orderable as, by slug.
 *
 * A product listed with an empty array is sold exactly one way on purpose —
 * it is a decision, not an omission. A product not listed at all keeps
 * whatever Sanity gives it.
 */
export const BUILT_IN_OPTIONS: Record<string, BuiltInOption[]> = {
  // Chocoflán is ONE size — the product text says 10 x 4 inches, serves
  // 12-15 — and comes in vanilla or strawberry. ("no cambia de tamaño, de
  // 10in"; I first read that as "no 10 inch" and had it backwards.)
  chocoflan: [flavour(VANILLA, STRAWBERRY)],

  // Gourmet: 6" or 8", no flavour choice.
  "flan-tres-leches": [size(6, 8)],

  // Sold one way, both by instruction.
  "pineapple-upside-down": [],
  "bloom-cake": [],

  // Tres leches: three sizes. Sanity already carries these with real price
  // differences on the live site, so this only matters for one that does not.
  "classic-3-leches": [size(6, 8, 10)],
  "tres-leches-tiramisu": [size(6, 8, 10)],
  "3-leches-mango": [size(6, 8, 10)],
  "pistachio-raspberry-tres-leches-cake": [size(6, 8, 10)],
  "piña-colada": [size(6, 8, 10)],
  "pina-colada": [size(6, 8, 10)],
  "dulce-de-leche": [size(6, 8, 10)],
  "double-chocolate-tres-leches-cake": [size(6, 8, 10)],
  "eggnog-tres-leches-cake": [size(6, 8, 10)],
};

function keyOf(option: ProductOption): string {
  const k = option.key;
  if (typeof k === "string") return k;
  return k?.current ?? "";
}

/**
 * What an option answers to, for deciding whether the catalogue already has
 * one of its own.
 *
 * BOTH the key and the name, canonicalised. The first version of this only
 * looked at the name when the key was EMPTY — and the live cakes have a key
 * that simply is not the word "size", so a built-in size was still appended
 * and the product page still showed TAMAÑO twice: the real one with its
 * prices, and a second without. Either signal saying "size" is enough.
 */
const CANONICAL: Record<string, string> = {
  size: "size",
  sizes: "size",
  tamano: "size",
  tamanos: "size",
  "cake size": "size",
  inches: "size",
  pulgadas: "size",
  flavour: "flavour",
  flavours: "flavour",
  flavor: "flavour",
  flavors: "flavour",
  sabor: "flavour",
  sabores: "flavour",
  "cake flavour": "flavour",
  "cake flavor": "flavour",
};

function normalizeLabel(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function canonical(value: string | null | undefined): string {
  const n = normalizeLabel(value);
  return CANONICAL[n] ?? n;
}

export function optionIdentities(option: ProductOption): string[] {
  const named = [canonical(keyOf(option)), canonical(option.name)].filter(Boolean);
  // Last line of defence, independent of what anyone called it: an option
  // whose choices are inch measurements IS a size option. Naming is the
  // part that keeps surprising us — this does not depend on it.
  if (looksLikeSizes(option)) named.push("size");
  return named;
}

function looksLikeSizes(option: ProductOption): boolean {
  const choices = option.choices ?? [];
  if (!choices.length) return false;
  const sized = choices.filter((c) => inchesFromLabel(c?.label ?? "") !== null);
  // Most of them, not all: a "custom" choice among real sizes is common.
  return sized.length >= Math.ceil(choices.length / 2);
}

/** The single best name for an option, for logs and tests. */
export function optionIdentity(option: ProductOption): string {
  return optionIdentities(option)[0] ?? "";
}

function toProductOption(option: BuiltInOption): ProductOption {
  return {
    name: option.name,
    nameEs: option.nameEs,
    key: { current: option.key },
    required: true,
    choices: option.choices.map((c) => ({
      label: c.label,
      labelEs: c.labelEs,
      // Always zero. A built-in option must never change a price; anything
      // that costs more is Karyana's to set in Studio.
      priceDelta: 0,
      soldOut: false,
    })),
  };
}

/**
 * The options a product should actually offer: what Sanity holds, plus any
 * built-in option Sanity is missing.
 *
 * Sanity wins per key, always. A product whose built-in entry is an empty
 * array keeps its Sanity options too — the empty array says "we add
 * nothing", not "remove what is there", because removing a real option with
 * real prices from code nobody is looking at is how a 10" cake starts
 * selling at a 6" price.
 */
export function withBuiltInOptions(product: {
  slug?: string | null;
  options?: ProductOption[] | null;
}): ProductOption[] {
  const fromSanity = product.options ?? [];
  const slug = (product.slug ?? "").trim().toLowerCase();
  const builtIn = BUILT_IN_OPTIONS[slug];
  if (!builtIn?.length) return fromSanity;

  // Every name an existing option answers to, from its key AND its name.
  // Looking at only one of them is what left TAMAÑO showing twice.
  const present = new Set(fromSanity.flatMap(optionIdentities));
  const missing = builtIn.filter((o) => !present.has(o.key)).map(toProductOption);
  return [...fromSanity, ...missing];
}
