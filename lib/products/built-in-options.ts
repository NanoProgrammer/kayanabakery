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
 * What an option IS, for deciding whether the catalogue already has one.
 *
 * Not the key alone. An option in Studio can be named "Size" with the key
 * field left empty, and matching on the key then saw no size option and
 * added a built-in one on top — so the product page showed SIZE twice, the
 * real one with its prices and a second with none. The name is the fallback,
 * in both languages.
 */
const NAME_TO_KEY: Record<string, string> = {
  size: "size",
  tamano: "size",
  tamaño: "size",
  flavour: "flavour",
  flavor: "flavour",
  sabor: "flavour",
};

export function optionIdentity(option: ProductOption): string {
  const key = keyOf(option).trim().toLowerCase();
  if (key) return key;
  const name = (option.name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  return NAME_TO_KEY[name] ?? name;
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

  // Identified by key, or by name when the key was never filled in.
  // Dropping the empty keys here is what produced two SIZE blocks.
  const present = new Set(fromSanity.map(optionIdentity).filter(Boolean));
  const missing = builtIn.filter((o) => !present.has(o.key)).map(toProductOption);
  return [...fromSanity, ...missing];
}
