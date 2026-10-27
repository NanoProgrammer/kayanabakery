/**
 * Resolving the choices a customer made about a cake.
 *
 * Products used to be sold one way only, so a tres leches in three sizes was
 * three products with three prices that drifted apart. Now one product carries
 * its options, and each choice adds to the product's price rather than
 * replacing it.
 *
 * Everything here runs on the server against the catalog, never on what the
 * browser sent. The browser sends which choice was picked — a key and a label
 * — and the price comes from Sanity. A price that arrives from the client is
 * a price the customer can edit.
 */
export type OptionChoice = {
  label: string;
  labelEs?: string | null;
  priceDelta?: number | null;
  soldOut?: boolean | null;
};

export type ProductOption = {
  name: string;
  nameEs?: string | null;
  key?: { current?: string | null } | string | null;
  required?: boolean | null;
  choices?: OptionChoice[] | null;
};

/** What the browser sends: which choice, by option key and choice label. */
export type OptionSelection = Record<string, string>;

export type ResolvedChoice = {
  /** The option's stable key, e.g. "size". */
  key: string;
  /** What the option is called, for the slip and the order. */
  name: string;
  /** The chosen label, e.g. "10 inch". */
  label: string;
  priceDeltaCents: number;
};

export type OptionResolution =
  | { ok: true; choices: ResolvedChoice[]; priceDeltaCents: number }
  | { ok: false; error: string };

export function optionKey(option: ProductOption): string {
  const raw = typeof option.key === "string" ? option.key : option.key?.current;
  // Falls back to the name so an option saved before keys existed still works.
  return (raw ?? option.name ?? "").trim().toLowerCase().replace(/\s+/g, "-");
}

function toCents(dollars: number | null | undefined): number {
  return Math.round((dollars ?? 0) * 100);
}

/**
 * Checks a selection against the product's own options and prices it.
 *
 * Refuses anything it cannot account for: a required option left out, a label
 * that isn't one of the choices, a choice marked sold out, or a key the
 * product doesn't have. The last one matters — silently ignoring an unknown
 * key is how a customer orders a size that quietly isn't priced.
 */
export function resolveOptions(
  options: ProductOption[] | null | undefined,
  selection: OptionSelection | null | undefined,
  productName = "This item"
): OptionResolution {
  const defined = options ?? [];
  const picked = selection ?? {};

  const known = new Set(defined.map(optionKey));
  for (const key of Object.keys(picked)) {
    if (!known.has(key)) {
      return { ok: false, error: `${productName} has no option called "${key}"` };
    }
  }

  const choices: ResolvedChoice[] = [];
  let priceDeltaCents = 0;

  for (const option of defined) {
    const key = optionKey(option);
    const chosenLabel = picked[key];
    const required = option.required !== false;

    if (!chosenLabel) {
      if (required) {
        return { ok: false, error: `Choose a ${option.name.toLowerCase()} for ${productName}` };
      }
      continue;
    }

    const match = (option.choices ?? []).find((c) => c.label === chosenLabel);
    if (!match) {
      return {
        ok: false,
        error: `"${chosenLabel}" isn't a ${option.name.toLowerCase()} we make for ${productName}`,
      };
    }
    if (match.soldOut) {
      return { ok: false, error: `${productName} — ${match.label} is sold out` };
    }

    const delta = toCents(match.priceDelta);
    priceDeltaCents += delta;
    choices.push({ key, name: option.name, label: match.label, priceDeltaCents: delta });
  }

  return { ok: true, choices, priceDeltaCents };
}

/** "Size: 10 inch · Flavour: Strawberry" — for the slip and the order line. */
export function describeChoices(choices: ResolvedChoice[]): string {
  return choices.map((c) => `${c.name}: ${c.label}`).join(" · ");
}

/**
 * The price shown for a product before anything is chosen: its own price plus
 * the cheapest required choice, so the shelf price is one a customer can
 * actually pay rather than one no combination reaches.
 */
export function startingPriceCents(
  basePriceCents: number,
  options: ProductOption[] | null | undefined
): number {
  let total = basePriceCents;
  for (const option of options ?? []) {
    if (option.required === false) continue;
    const available = (option.choices ?? []).filter((c) => !c.soldOut);
    if (!available.length) continue;
    total += Math.min(...available.map((c) => toCents(c.priceDelta)));
  }
  return total;
}

/**
 * What makes a cart line its own line.
 *
 * The cart used to key everything by product id, which is right until the same
 * cake can be ordered in two sizes: adding a 10" after a 6" would have bumped
 * the 6" to quantity two and charged the wrong price for both.
 *
 * A product with no choices keeps its plain id, so every existing cart, every
 * saved line and every caller that passes a product id still works.
 */
export function cartLineId(
  productId: string,
  selection?: OptionSelection | null
): string {
  const entries = Object.entries(selection ?? {}).filter(([, v]) => v);
  if (!entries.length) return productId;
  // Sorted, so the same two choices made in either order are one line.
  const parts = entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`);
  return `${productId}|${parts.join("|")}`;
}
