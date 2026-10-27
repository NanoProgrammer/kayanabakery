/** One-off closures, as Calgary calendar dates. Applies to pickup and delivery. */
export const CLOSED_DATES: readonly string[] = ["2026-11-07"];

export function isClosedDate(date: string): boolean {
  return CLOSED_DATES.includes(date);
}
