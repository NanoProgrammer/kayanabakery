/**
 * The four cake subcategories, built into the code.
 *
 * They are supposed to be categories in Sanity, created by
 * `npm run cakes:setup:apply`. That has never been run, so /category/cakes
 * finds no children and falls back to listing every cake in one grid —
 * which is the thing Karyana has now asked to change five times. Handing
 * over a command again is not a fix.
 *
 * So the four live here as a fallback. A cake is sorted into one by its
 * name, using the names from Karyana's own lead-time table. When the real
 * Sanity categories do get created they take precedence and nothing here is
 * used — this only fills the hole.
 */
export type CakeFamilySlug = "tres-leches" | "gourmet" | "clasicos" | "gelatinas-y-flanes";

export type CakeFamily = {
  slug: CakeFamilySlug;
  name: string;
  nameEs: string;
  tagline: string;
  taglineEs: string;
  /**
   * Lower-case, accent-free phrases. A product whose name contains one
   * belongs to this family. Longer phrases are matched first, so
   * "flan napolitano" is not caught by a bare "flan".
   */
  match: string[];
};

export const CAKE_FAMILIES: CakeFamily[] = [
  {
    slug: "tres-leches",
    name: "Tres Leches",
    nameEs: "Tres Leches",
    tagline: "Eight flavours, three sizes",
    taglineEs: "Ocho sabores, tres tamaños",
    match: [
      "3 leches tiramisu",
      "tres leches tiramisu",
      "3 leches mango",
      "tres leches mango",
      "3 leches pistacho",
      "tres leches pistachio",
      "3 leches pina colada",
      "tres leches pina colada",
      "3 leches dulce de leche",
      "tres leches dulce de leche",
      "3 leches chocolate",
      "tres leches chocolate",
      "3 leches eggnog",
      "tres leches eggnog",
      "3 leches rompope",
      "tres leches rompope",
      "3 leches clasico",
      "classic 3 leches",
      "classic tres leches",
      "tres leches clasico",
    ],
  },
  {
    slug: "gourmet",
    name: "Gourmet",
    nameEs: "Gourmet",
    tagline: "Flan and tres leches, together",
    taglineEs: "Flan y tres leches, juntos",
    // "Neapolitan Flan Tres Leches" lands here rather than with the flanes:
    // its name says tres leches, and Karyana described Gourmet as the flan
    // tres leches. FLAGGED — if it is meant to be the flan napolitano from
    // the table, move it.
    match: ["flan 3 leches", "flan tres leches", "neapolitan flan"],
  },
  {
    slug: "clasicos",
    name: "Clásicos",
    nameEs: "Clásicos",
    tagline: "The ones everyone knows",
    taglineEs: "Los de siempre",
    // Lemon Loaf is here because it is not a tres leches, a flan or a
    // gelatina. Karyana never said where it goes. FLAGGED.
    match: [
      "chocoflan",
      "choco flan",
      "pineapple upside",
      "pina volteada",
      "bloom cake",
      "lemon loaf",
      "panque de limon",
    ],
  },
  {
    slug: "gelatinas-y-flanes",
    name: "Gelatinas & Flanes",
    nameEs: "Gelatinas y Flanes",
    tagline: "Gluten free",
    taglineEs: "Sin gluten",
    match: [
      "gelatina de mosaico",
      "gelaflan",
      "gela flan",
      "flan napolitano",
      "carlota",
      "gelatina",
    ],
  },
];

export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * The family a cake belongs to, or null when its name matches none.
 *
 * Longest phrase wins, so "flan napolitano" is not taken by "flan", and
 * "3 leches chocolate" is not taken by a shorter rule. A cake that matches
 * nothing is NOT guessed into a family — it still appears on the Cakes page
 * under "Everything else", where Karyana can see it needs filing.
 */
export function familyForProductName(name: string): CakeFamily | null {
  const target = normalizeName(name);
  let best: { family: CakeFamily; length: number } | null = null;
  for (const family of CAKE_FAMILIES) {
    for (const phrase of family.match) {
      const needle = normalizeName(phrase);
      if (!target.includes(needle)) continue;
      if (!best || needle.length > best.length) {
        best = { family, length: needle.length };
      }
    }
  }
  return best?.family ?? null;
}

export function familyBySlug(slug: string): CakeFamily | null {
  return CAKE_FAMILIES.find((f) => f.slug === slug) ?? null;
}

/** Splits a list of cakes into the four families, keeping the leftovers. */
export function groupIntoFamilies<T extends { name: string }>(
  products: readonly T[]
): { family: CakeFamily; products: T[] }[] {
  return CAKE_FAMILIES.map((family) => ({
    family,
    products: products.filter((p) => familyForProductName(p.name)?.slug === family.slug),
  }));
}

export function unfiled<T extends { name: string }>(products: readonly T[]): T[] {
  return products.filter((p) => !familyForProductName(p.name));
}
