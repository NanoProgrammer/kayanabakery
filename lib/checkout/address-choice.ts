/**
 * Which address a delivery order is actually sent to.
 *
 * A customer ordered twice and both orders went to an address he had moved
 * away from. He was right: the checkout decided this in three places that
 * disagreed with each other.
 *
 *  - The form pre-selected his default saved address on load.
 *  - Typing a new address into the "add address" form only filled a separate
 *    `guestAddress` draft, and the payload used it ONLY when no saved address
 *    was selected — one always was, so the draft was dropped on the floor.
 *  - Saving the new address did select it, and then called
 *    window.location.reload(), which threw that selection away. The page came
 *    back with the old default selected again, because a newly added address
 *    is not the default.
 *
 * Three ways to end up delivering to the old address, and nothing on screen
 * said which one the order would use. So the decision lives here now, in one
 * function, with the rule stated once: what the customer last typed wins over
 * what was pre-selected for them.
 */
export type AddressDraft = {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  buzzer?: string;
  notes?: string;
};

export type StoredAddress = AddressDraft & {
  id: string;
  isDefault?: boolean;
};

/**
 * Enough of an address to deliver to. Deliberately loose — the server
 * validates properly; this only decides whether a half-typed draft should
 * outrank a saved address, and a draft with no street certainly should not.
 */
export function isUsableDraft(draft: AddressDraft | null | undefined): draft is AddressDraft {
  if (!draft) return false;
  const postal = (draft.postalCode ?? "").replace(/\s+/g, "");
  return (draft.street ?? "").trim().length >= 3 && postal.length >= 6;
}

/**
 * What the form starts with. The default address, failing that the most
 * recently added one (the API returns them default-first, newest-first), and
 * nothing at all when there is nothing saved.
 */
export function chooseInitialAddress(addresses: readonly StoredAddress[]): string | null {
  return addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null;
}

export type OrderAddress =
  | { kind: "saved"; addressId: string; address: StoredAddress }
  | { kind: "new"; address: AddressDraft }
  | { kind: "none" };

/**
 * The single answer to "where is this order going?", used both for the
 * payload and for the line shown above the Pay button. One function, so what
 * the customer is told and what is sent cannot drift apart.
 *
 * `isAddingNew` is whether the new-address form is open. While it is open and
 * holds a usable address, that is the customer's current intent — whether or
 * not they got around to pressing Save.
 */
export function resolveOrderAddress({
  addresses,
  selectedId,
  draft,
  isAddingNew,
}: {
  addresses: readonly StoredAddress[];
  selectedId: string | null;
  draft: AddressDraft | null;
  isAddingNew: boolean;
}): OrderAddress {
  if (isAddingNew && isUsableDraft(draft)) {
    return { kind: "new", address: draft };
  }
  if (selectedId) {
    const found = addresses.find((a) => a.id === selectedId);
    // A selected id with no matching address means the list and the selection
    // have gone out of step. Falling back to another address would deliver
    // somewhere nobody chose, so this is "none": the form blocks payment.
    if (found) return { kind: "saved", addressId: selectedId, address: found };
    return { kind: "none" };
  }
  if (isUsableDraft(draft)) return { kind: "new", address: draft };
  return { kind: "none" };
}

/** The fields to send to /api/checkout for a resolved address. */
export function addressPayload(
  chosen: OrderAddress
): { addressId: string } | { guestAddress: AddressDraft } | null {
  if (chosen.kind === "saved") return { addressId: chosen.addressId };
  if (chosen.kind === "new") return { guestAddress: chosen.address };
  return null;
}

/**
 * One line naming where the order is going, to be shown next to the Pay
 * button. The customer who was billed twice for deliveries to his old address
 * had no way to see, at the moment of paying, which address the order carried.
 */
export function describeOrderAddress(chosen: OrderAddress): string | null {
  if (chosen.kind === "none") return null;
  const a = chosen.address;
  const unit = a.buzzer?.trim() ? ` (${a.buzzer.trim()})` : "";
  const postal = (a.postalCode ?? "").trim().toUpperCase();
  return `${a.street}${unit}, ${a.city}, ${a.province} ${postal}`.replace(/\s+/g, " ").trim();
}

/**
 * Inserting a newly saved address into the list without a page reload. The
 * reload was what discarded the customer's choice; this replaces it.
 */
export function withSavedAddress(
  addresses: readonly StoredAddress[],
  saved: StoredAddress
): StoredAddress[] {
  const without = addresses.filter((a) => a.id !== saved.id);
  // A new default demotes the others, mirroring what the API just did, so the
  // list on screen matches the database.
  const rest = saved.isDefault ? without.map((a) => ({ ...a, isDefault: false })) : without;
  return saved.isDefault ? [saved, ...rest] : [...rest, saved];
}
