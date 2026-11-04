/**
 * The cake menu: which subcategories exist and what each product can be
 * ordered as.
 *
 * Kept here, apart from the script that writes it to Sanity, for two reasons.
 * The first is that it is a statement of the menu and gets read and corrected
 * as one. The second is the merge: these rules are applied to products that
 * already exist, and some of them already carry prices Karyana typed into
 * Studio. A script that just overwrote the options would zero every price
 * difference she had set, silently, and a 10" cake would go out priced like a
 * 6" one. So replacing an option keeps the money that is already on the
 * choices it has in common.
 */
export type MenuChoice = { label: string; labelEs: string };

export type MenuOption = {
  key: string;
  name: string;
  nameEs: string;
  choices: MenuChoice[];
};

/**
 * How many people a cake feeds, shown on the button the way the customer
 * actually decides — nobody knows what 8" means, everybody knows whether
 * they are feeding twelve people.
 */
const SERVES: Record<number, string> = {
  4: "4-6",
  6: "8-12",
  8: "12-20",
  10: "20-30",
};

const SIZE = (...inches: number[]): MenuOption => ({
  key: "size",
  name: "Size",
  nameEs: "Tamaño",
  choices: inches.map((n) => ({
    label: SERVES[n] ? `${n}" (Serves ${SERVES[n]})` : `${n}"`,
    labelEs: SERVES[n] ? `${n}" (${SERVES[n]} porciones)` : `${n}"`,
  })),
});

const FLAVOURS = (...pairs: [string, string][]): MenuOption => ({
  key: "flavour",
  name: "Flavour",
  nameEs: "Sabor",
  choices: pairs.map(([label, labelEs]) => ({ label, labelEs })),
});

export const VANILLA: [string, string] = ["Vanilla", "Vainilla"];
export const CHOCOLATE: [string, string] = ["Chocolate", "Chocolate"];
export const STRAWBERRY: [string, string] = ["Strawberry", "Fresa"];

export type MenuSubcategory = {
  slug: string;
  name: string;
  nameEs: string;
  tagline?: string;
  taglineEs?: string;
  /** Applied to products filed here that have no rule of their own. */
  defaultOptions: MenuOption[];
};

export const SUBCATEGORIES: MenuSubcategory[] = [
  {
    slug: "tres-leches",
    name: "Tres Leches",
    nameEs: "Tres Leches",
    // Three sizes, and the flavours are set per product below, because the
    // seven of them have not been named yet.
    defaultOptions: [SIZE(6, 8, 10)],
  },
  {
    slug: "gourmet",
    name: "Gourmet",
    nameEs: "Gourmet",
    defaultOptions: [SIZE(6, 8)],
  },
  {
    slug: "clasicos",
    name: "Clásicos",
    nameEs: "Clásicos",
    // Only a default. Every clásico so far overrides it: the bundt is one
    // size, the pineapple upside down has no choices at all, and the
    // chocoflán is two flavours rather than three.
    defaultOptions: [FLAVOURS(VANILLA, CHOCOLATE, STRAWBERRY)],
  },
  {
    slug: "gelatinas-y-flanes",
    name: "Gelatinas & Flanes",
    nameEs: "Gelatinas y Flanes",
    tagline: "Gluten free",
    taglineEs: "Sin gluten",
    defaultOptions: [],
  },
];

/**
 * Cake toppers and decorations.
 *
 * Deliberately NOT one of the four subcategories under Cakes: those are kinds
 * of cake, and the Cakes page and the header submenu are meant to show four
 * things to choose between. A topper is something you add to a cake, so it
 * sits on its own at the top level and is offered at the moment a tres leches
 * goes into the cart.
 */
export const TOPPER_CATEGORY = {
  slug: "decoraciones",
  name: "Cake Toppers",
  nameEs: "Decoraciones",
  tagline: "Finish your cake",
  taglineEs: "Dale el toque final",
};

/**
 * Products that are not what their subcategory's default says.
 *
 * Matched on the product's name, loosely: accents, case, punctuation and
 * extra words are ignored, so "Chocoflán (6 in)" and "chocoflan" both match
 * the chocoflán rule. An empty `options` means the product is sold exactly
 * one way — no size, no flavour.
 */
export type ProductRule = {
  /** Lower-case, accent-free words that must all appear in the name. */
  match: string[];
  label: string;
  options: MenuOption[];
};

export const PRODUCT_RULES: ProductRule[] = [
  {
    // Strawberry and vanilla only, and it does not come in 10".
    match: ["chocoflan"],
    label: "Chocoflán",
    options: [SIZE(6, 8), FLAVOURS(VANILLA, STRAWBERRY)],
  },
  {
    // 6" or 8", and no flavour choice. Same as the Gourmet default, but
    // written down so it stays true if that default ever moves.
    match: ["flan", "leches"],
    label: "Flan Tres Leches (Gourmet)",
    options: [SIZE(6, 8)],
  },
  {
    // One size, no flavour choice.
    match: ["pineapple"],
    label: "Pineapple Upside Down",
    options: [],
  },
  {
    // 4 inch only. A single choice is not a choice, so it is not offered as
    // one; the size belongs in the product's name and description.
    match: ["bundt"],
    label: "Bundt Cake",
    options: [],
  },
];

/**
 * What makes two choices "the same choice" when merging.
 *
 * Labels get rewritten — `6 inch` became `6" (Serves 8-12)` when the serving
 * counts went on the buttons. Matching on the whole label would have treated
 * that as deleting one size and adding another, losing the price difference
 * Karyana had set on it. A size is identified by its number of inches
 * instead, so renaming the label keeps the money attached to it.
 */
export function choiceIdentity(label: string): string {
  const normalized = normalizeName(label);
  const inches = /^(\d+)(?:\s*(?:inch|inches|in|"|''))?\b/.exec(label.trim());
  if (inches) return `size:${inches[1]}`;
  return normalized;
}

/** Case-, accent- and punctuation-insensitive, for matching product names. */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function ruleForProduct(name: string): ProductRule | null {
  const normalized = normalizeName(name);
  return (
    PRODUCT_RULES.find((rule) =>
      rule.match.every((word) => normalized.includes(word))
    ) ?? null
  );
}

/** What a given product should end up with. */
export function optionsForProduct(
  name: string,
  subcategory: MenuSubcategory
): MenuOption[] {
  const rule = ruleForProduct(name);
  return rule ? rule.options : subcategory.defaultOptions;
}

/* ------------------------------------------------------------------ */
/* Merging into what Sanity already holds                              */
/* ------------------------------------------------------------------ */

export type ExistingChoice = {
  label?: string | null;
  labelEs?: string | null;
  priceDelta?: number | null;
  soldOut?: boolean | null;
  _key?: string;
};

export type ExistingOption = {
  key?: { current?: string | null } | string | null;
  name?: string | null;
  choices?: ExistingChoice[] | null;
  _key?: string;
};

export function optionKey(option: ExistingOption): string {
  const k = option.key;
  if (typeof k === "string") return k;
  return k?.current ?? "";
}

export type MergedOption = {
  key: string;
  name: string;
  nameEs: string;
  choices: {
    label: string;
    labelEs: string;
    /** Carried over from Studio when the same choice already existed. */
    priceDelta: number;
    soldOut: boolean;
  }[];
};

export type MergeResult = {
  options: MergedOption[];
  /** Human-readable, for the dry run: what this actually changes. */
  changes: string[];
  /** True when nothing about the product's options would change. */
  unchanged: boolean;
};

/**
 * The product's options as they should be, built from the menu but keeping
 * every price difference and sold-out flag already set on a choice that
 * survives. Choices that are being removed are named in `changes`, because
 * removing a size people have been ordering is not something to do quietly.
 */
export function mergeProductOptions(
  existing: readonly ExistingOption[] | null | undefined,
  desired: readonly MenuOption[]
): MergeResult {
  const current = existing ?? [];
  const changes: string[] = [];

  const options: MergedOption[] = desired.map((want) => {
    const had = current.find((o) => optionKey(o) === want.key);
    const hadChoices = had?.choices ?? [];

    const choices = want.choices.map((choice) => {
      const previous = hadChoices.find(
        (c) => choiceIdentity(c?.label ?? "") === choiceIdentity(choice.label)
      );
      if (!previous) {
        changes.push(`+ ${want.name}: ${choice.label}`);
      }
      return {
        label: choice.label,
        labelEs: choice.labelEs,
        // Money already set in Studio is kept. This is the whole reason the
        // merge exists rather than a plain overwrite.
        priceDelta: previous?.priceDelta ?? 0,
        soldOut: previous?.soldOut ?? false,
      };
    });

    for (const old of hadChoices) {
      const stillThere = want.choices.some(
        (c) => choiceIdentity(c.label) === choiceIdentity(old?.label ?? "")
      );
      if (!stillThere && old?.label) {
        changes.push(`- ${want.name}: ${old.label} (removed)`);
      }
    }

    if (!had) changes.push(`+ option "${want.name}"`);
    return { key: want.key, name: want.name, nameEs: want.nameEs, choices };
  });

  for (const old of current) {
    const key = optionKey(old);
    if (!desired.some((d) => d.key === key)) {
      changes.push(`- option "${old.name ?? key}" (removed)`);
    }
  }

  return { options, changes, unchanged: changes.length === 0 };
}
