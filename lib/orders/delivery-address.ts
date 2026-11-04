/**
 * The address an order was actually delivered to.
 *
 * An order used to hold nothing but a foreign key to the customer's saved
 * address, which has two consequences nobody wants:
 *
 *   - Editing a saved address rewrites the address on every past order that
 *     used it. The receipt, the invoice and the kitchen slip for an order
 *     delivered in March now name an address the customer moved to in
 *     November.
 *   - Deleting one blanks it on those orders entirely — the relation is
 *     optional, so Prisma's default is SetNull. The record of where a
 *     delivery went just disappears.
 *
 * Which also meant customers could not be allowed to tidy up their old
 * addresses without destroying the bakery's own history.
 *
 * So an order now carries a copy of the address as it stood when the order
 * was placed, in `Order.deliveryAddress`. The relation stays, for orders
 * placed before the copy existed and for linking back to the saved address;
 * the copy wins whenever it is there.
 */
export type AddressFields = {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  buzzer?: string | null;
  notes?: string | null;
};

export type OrderWithAddress = {
  deliveryAddress?: unknown;
  address?: Partial<AddressFields> | null;
};

/** The copy to store on the order. Only the fields a driver needs. */
export function snapshotAddress(address: Partial<AddressFields> | null | undefined): AddressFields | null {
  if (!address?.street) return null;
  return {
    street: address.street,
    city: address.city ?? "",
    province: address.province ?? "",
    postalCode: address.postalCode ?? "",
    buzzer: address.buzzer ?? null,
    notes: address.notes ?? null,
  };
}

/**
 * Reads it back. The stored copy is JSON, which means it is whatever was
 * written — possibly from an older version of this code, possibly null — so
 * it is checked rather than trusted, and anything unusable falls through to
 * the relation.
 */
export function orderDeliveryAddress(order: OrderWithAddress | null | undefined): AddressFields | null {
  if (!order) return null;
  const stored = order.deliveryAddress;
  if (stored && typeof stored === "object" && !Array.isArray(stored)) {
    const snapshot = snapshotAddress(stored as Partial<AddressFields>);
    if (snapshot) return snapshot;
  }
  return snapshotAddress(order.address);
}

/**
 * One line, for a receipt or an order list. Empty parts are dropped rather
 * than printed as gaps — an address written as "438 24 Ave NE, , AB" reads
 * as a bug to whoever is holding the slip.
 */
export function formatDeliveryAddress(address: AddressFields | null): string {
  if (!address) return "";
  const cityLine = [address.city, address.province].filter(Boolean).join(", ");
  const tail = [cityLine, address.postalCode].filter(Boolean).join(" ");
  return [address.street, tail].filter(Boolean).join(", ").trim();
}

/** The same, over several lines, for an envelope or a kitchen slip. */
export function formatDeliveryAddressLines(address: AddressFields | null): string[] {
  if (!address) return [];
  const lines = [address.street];
  const cityLine = [[address.city, address.province].filter(Boolean).join(", "), address.postalCode]
    .filter(Boolean)
    .join(" ");
  if (cityLine) lines.push(cityLine);
  if (address.buzzer) lines.push(`Buzzer: ${address.buzzer}`);
  if (address.notes) lines.push(address.notes);
  return lines.filter(Boolean);
}
