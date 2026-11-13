/**
 * How many people a cake feeds, by size.
 *
 * Karyana's numbers. They were briefly baked into the size labels, which was
 * wrong twice over: the labels in Studio are plain ("6\"", "8\"", "10\""), and
 * a serving count stuck inside a label cannot change when the customer picks
 * a different size — the page kept showing one fixed range like "Serves
 * approximately 8–18 people" whichever button was pressed.
 *
 * So the count lives here and is read from the chosen size, on the product
 * page and again at the checkout, where it is the last chance to notice the
 * cake is too small for the party.
 */
export type ServingRange = { min: number; max: number };

export const SERVINGS_BY_INCHES: Record<number, ServingRange> = {
  6: { min: 6, max: 8 },
  8: { min: 10, max: 12 },
  10: { min: 14, max: 18 },
};

/**
 * The size in inches named by a label, however it is written: `8"`, `8 inch`,
 * `8 in`, `8" (Serves 10-12)`. Returns null for a label that names no size,
 * such as a flavour.
 */
export function inchesFromLabel(label: string | null | undefined): number | null {
  if (!label) return null;
  const match = /(\d+(?:\.\d+)?)\s*(?:"|''|in\b|inch|inches|pulgadas?)/i.exec(label);
  if (match) return Number(match[1]);
  // A bare number is a size too — "10" on its own is a 10 inch cake — but
  // only when that is all the label is, so a flavour called "Dulce 3" is not
  // read as a 3 inch cake.
  const bare = /^\s*(\d+(?:\.\d+)?)\s*$/.exec(label);
  return bare ? Number(bare[1]) : null;
}

export function servingsForInches(inches: number | null | undefined): ServingRange | null {
  if (inches == null) return null;
  return SERVINGS_BY_INCHES[inches] ?? null;
}

export function servingsForLabel(label: string | null | undefined): ServingRange | null {
  return servingsForInches(inchesFromLabel(label));
}

/** "Serves 10–12 people" / "Rinde 10–12 porciones". */
export function describeServings(
  range: ServingRange | null,
  locale: string
): string | null {
  if (!range) return null;
  const span = range.min === range.max ? `${range.min}` : `${range.min}–${range.max}`;
  return locale === "es" ? `Rinde ${span} porciones` : `Serves ${span} people`;
}

/**
 * The serving range for a set of chosen options, e.g. { size: '8"' }. Used at
 * the checkout, where the choice is already made and only its labels remain.
 */
export function servingsForOptions(
  options: Record<string, string> | null | undefined
): ServingRange | null {
  if (!options) return null;
  const direct = options.size ?? options.tamaño ?? options.tamano;
  if (direct) {
    const found = servingsForLabel(direct);
    if (found) return found;
  }
  for (const value of Object.values(options)) {
    const found = servingsForLabel(value);
    if (found) return found;
  }
  return null;
}
