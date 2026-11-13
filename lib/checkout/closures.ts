/** One-off closures, as Calgary calendar dates. Applies to pickup and delivery. */
export const CLOSED_DATES: readonly string[] = [
  "2026-11-07",
  "2026-11-08",
  "2026-11-28",
  "2026-11-29",
];

export function isClosedDate(date: string): boolean {
  return CLOSED_DATES.includes(date);
}

/** Date-specific bilingual message for a closed pickup/delivery day. */
export function closedDateLabel(date: string, locale: string): string {
  if (date === "2026-11-28" || date === "2026-11-29") {
    return locale === "es" ? "Cerrado por el fin de semana" : "Closed for the weekend";
  }
  return locale === "es" ? "Cerrado por el día" : "Closed for the day";
}
