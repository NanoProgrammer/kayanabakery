/**
 * Determine if a postal code falls within Southeast Calgary
 * for the "first delivery free" benefit.
 *
 * Calgary postal codes start with T1, T2, T3.
 * SE Calgary specifically: T2A, T2B, T2C, T2H, T2J, T2X, T2Y, T2Z, T3M, T3N, T3S
 * (rough approximation — owner can refine the list later)
 */

const SE_CALGARY_PREFIXES = new Set([
  "T2A", "T2B", "T2C", "T2H", "T2J", "T2X", "T2Y", "T2Z",
  "T3M", "T3N", "T3S",
]);

export function isSECalgary(postalCode: string | null | undefined): boolean {
  if (!postalCode) return false;
  const cleaned = postalCode.replace(/\s/g, "").toUpperCase();
  if (cleaned.length < 3) return false;
  const prefix = cleaned.slice(0, 3);
  return SE_CALGARY_PREFIXES.has(prefix);
}

export function isCalgary(postalCode: string | null | undefined): boolean {
  if (!postalCode) return false;
  const cleaned = postalCode.replace(/\s/g, "").toUpperCase();
  return cleaned.startsWith("T1") ||
         cleaned.startsWith("T2") ||
         cleaned.startsWith("T3");
}
