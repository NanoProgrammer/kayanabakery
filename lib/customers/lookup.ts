/**
 * Finding a customer we already have, from the order form. Situación 7.
 *
 * Staff take a cake order over the phone and type the customer's details
 * in by hand, every time, for someone who has ordered eleven times
 * before. The dropdown they thought was doing this was Chrome's own
 * autofill — which is why it offers the staff member's address, and why
 * it never links anything to a Karyana account.
 *
 * The matching rules are here rather than in the Studio component because
 * they are the part that has to be right. A phone search that fails on a
 * number written "(403) 383-3681" instead of "4033833681" is a search
 * that staff stop trusting after the second try.
 */

/** Lower-case, accent-free. Nobody types "Muñoz" into a hurry. */
export function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Just the digits, with a leading country code dropped.
 *
 * Numbers reach us as "(403) 383-3681", "403-383-3681", "+1 403 383 3681"
 * and "4033833681", and all four are the same person.
 */
export function phoneDigits(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

export type CustomerRecord = {
  /** The Sanity document id, which carries the account id. */
  _id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  tier?: string | null;
  /** "es" or "en" — which language to write their invoice in. */
  language?: string | null;
  totalOrders?: number | null;
  lastOrderAt?: string | null;
};

/**
 * The Karyana account id behind a customer document.
 *
 * Sanity mirrors each account at `customer-<prisma id>` (see
 * lib/sanity/sync-customers.ts). Linking the order to the account is the
 * whole point of the search, so this must not guess: anything that is not
 * that shape returns null rather than half an id.
 */
export function accountIdFrom(docId: string | null | undefined): string | null {
  const id = (docId ?? "").replace(/^drafts\./, "");
  if (!id.startsWith("customer-")) return null;
  const rest = id.slice("customer-".length);
  return rest.length > 0 ? rest : null;
}

/**
 * How well a customer answers a query, or null for no match.
 *
 * Lower is better, so the obvious match sorts first: an exact phone or
 * email beats a name that merely starts with what was typed, which beats
 * a word found in the middle.
 */
export function matchScore(c: CustomerRecord, query: string): number | null {
  const q = normalize(query);
  if (q.length < 2) return null;

  const qDigits = phoneDigits(query);
  // Three digits is enough to be searching by phone and not by accident.
  if (qDigits.length >= 3) {
    const digits = phoneDigits(c.phone);
    if (digits && digits === qDigits) return 0;
    if (digits && digits.endsWith(qDigits)) return 1;
    if (digits && digits.includes(qDigits)) return 2;
  }

  const email = normalize(c.email);
  if (email) {
    if (email === q) return 0;
    if (email.startsWith(q)) return 3;
    if (email.includes(q)) return 5;
  }

  const name = normalize(c.name);
  if (name) {
    if (name === q) return 0;
    if (name.startsWith(q)) return 3;
    // Every word typed has to appear, so "ana lopez" does not match
    // everyone called Ana.
    const words = q.split(/\s+/).filter(Boolean);
    if (words.length > 1 && words.every((w) => name.includes(w))) return 4;
    if (name.includes(q)) return 6;
  }

  return null;
}

export type RankedCustomer = CustomerRecord & { score: number };

/**
 * The best matches, best first.
 *
 * Ties break on who orders most, then on the name, so the list is stable:
 * a dropdown whose order changes between two identical searches is a
 * dropdown staff click wrongly.
 */
export function rankCustomers(
  customers: readonly CustomerRecord[],
  query: string,
  limit = 8
): RankedCustomer[] {
  const scored: RankedCustomer[] = [];
  for (const c of customers) {
    const score = matchScore(c, query);
    if (score === null) continue;
    scored.push({ ...c, score });
  }
  scored.sort(
    (a, b) =>
      a.score - b.score ||
      (b.totalOrders ?? 0) - (a.totalOrders ?? 0) ||
      normalize(a.name).localeCompare(normalize(b.name)) ||
      a._id.localeCompare(b._id)
  );
  return scored.slice(0, limit);
}

/** What one line of the dropdown says, under the name. */
export function describeCustomer(c: CustomerRecord): string {
  const bits: string[] = [];
  if (c.phone) bits.push(c.phone);
  if (c.email) bits.push(c.email);
  const orders = c.totalOrders ?? 0;
  if (orders > 0) bits.push(orders === 1 ? "1 order" : `${orders} orders`);
  return bits.join(" · ");
}

/**
 * The locale to write their invoice in.
 *
 * The customer sync writes this field as "Español" / "English" (see
 * lib/sanity/sync-customers.ts), while the order stores "es" / "en".
 * Reading only the short codes here silently sent every customer an
 * English invoice, because no synced record ever matched.
 *
 * Anything unrecognised returns null rather than a guess: no language is
 * better than the wrong one, and the order's own default takes over.
 */
export function localeFrom(value: string | null | undefined): "es" | "en" | null {
  const v = normalize(value);
  if (!v) return null;
  if (v === "es" || v.startsWith("espanol") || v.startsWith("spanish")) return "es";
  if (v === "en" || v.startsWith("english") || v.startsWith("ingles")) return "en";
  return null;
}

export type OrderPatch = {
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerTier: string | null;
  customerLanguage: string | null;
  customerId: string | null;
};

/**
 * The fields to write onto the order when a customer is chosen.
 *
 * Empty values are returned as null rather than "", so choosing a
 * customer with no email on file CLEARS a stale email from the form
 * instead of leaving the previous customer's address sitting there — the
 * kind of mistake that sends one person's invoice to another.
 */
export function fillFromCustomer(c: CustomerRecord): OrderPatch {
  const trim = (v: string | null | undefined) => {
    const s = (v ?? "").trim();
    return s.length ? s : null;
  };
  return {
    customerName: trim(c.name) ?? "",
    customerEmail: trim(c.email),
    customerPhone: trim(c.phone),
    customerTier: trim(c.tier),
    customerLanguage: localeFrom(c.language),
    customerId: accountIdFrom(c._id),
  };
}

/**
 * The GROQ behind the dropdown.
 *
 * Deliberately not filtered server-side: the catalogue of customers is
 * small, the ranking above is better than GROQ's `match`, and one fetch
 * that is then filtered in memory means typing does not fire a request
 * per keystroke.
 */
export const CUSTOMER_SEARCH_QUERY = `
  *[_type == "customer"] | order(coalesce(totalOrders, 0) desc) [0...500] {
    _id, name, email, phone, tier, language, totalOrders, lastOrderAt
  }
`;
