/**
 * Splitting an order into parts that are ready at different times.
 *
 * A cart with a tres leches and a bag of conchas used to take ONE date, and
 * that date was the slowest item's: the conchas sat waiting for the cake. On
 * Amazon the same cart arrives in two shipments with two dates, and nothing
 * fast is held back by something slow.
 *
 * So the cart is split by how much notice each item needs. Items that need
 * the same notice travel together; a cake that needs 48 hours gets its own
 * date, and everything ready today gets today's.
 *
 * This only decides the grouping. Where the groups appear in the checkout,
 * and whether they become one order or two, is still open.
 */
export type GroupableItem = {
  productId: string;
  name: string;
  quantity: number;
  /** Hours of notice this item needs. Missing or negative counts as none. */
  leadTime?: number | null;
  options?: Record<string, string>;
  optionsLabel?: string;
};

export type DeliveryGroup<T extends GroupableItem = GroupableItem> = {
  /** Hours of notice everything in this group needs. */
  leadTimeHours: number;
  items: T[];
};

function notice(item: GroupableItem): number {
  const hours = item.leadTime ?? 0;
  return Number.isFinite(hours) && hours > 0 ? Math.ceil(hours) : 0;
}

/**
 * The cart, split into parts, soonest first.
 *
 * Grouped by the notice needed rather than by category: two cakes that both
 * need 24 hours are one delivery, not two, and a cake that needs 2 hours
 * travels with the conchas because it is ready at the same time. Grouping by
 * "cake or not" would promise two deliveries where one is enough.
 */
export function groupByLeadTime<T extends GroupableItem>(items: readonly T[]): DeliveryGroup<T>[] {
  const buckets = new Map<number, T[]>();
  for (const item of items) {
    const hours = notice(item);
    if (!buckets.has(hours)) buckets.set(hours, []);
    buckets.get(hours)!.push(item);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([leadTimeHours, groupItems]) => ({ leadTimeHours, items: groupItems }));
}

/** Whether the customer should be shown more than one date at all. */
export function needsSplitDelivery(items: readonly GroupableItem[]): boolean {
  return groupByLeadTime(items).length > 1;
}

/**
 * "Delivery 1 of 2" — and the reason, so the split does not read as a
 * mistake. A customer who sees two dates with no explanation assumes the
 * site has double-charged them.
 */
export function describeGroup(
  group: DeliveryGroup,
  index: number,
  total: number,
  locale: string
): { title: string; reason: string } {
  const es = locale === "es";
  const title = es
    ? `Entrega ${index + 1} de ${total}`
    : `Delivery ${index + 1} of ${total}`;

  if (group.leadTimeHours <= 0) {
    return {
      title,
      reason: es ? "Listo para la fecha más próxima" : "Ready on the earliest date",
    };
  }
  const hours = group.leadTimeHours;
  const asDays = hours % 24 === 0 ? hours / 24 : null;
  const span = asDays
    ? es
      ? `${asDays} día${asDays === 1 ? "" : "s"}`
      : `${asDays} day${asDays === 1 ? "" : "s"}`
    : es
    ? `${hours} horas`
    : `${hours} hours`;

  return {
    title,
    reason: es
      ? `Necesita ${span} de preparación`
      : `Needs ${span} to prepare`,
  };
}

/**
 * The notice the whole order needs if it is NOT split — the old behaviour,
 * kept because a cart with one group is still one delivery and nothing
 * should change for it.
 */
export function slowestLeadTime(items: readonly GroupableItem[]): number {
  return items.reduce((max, item) => Math.max(max, notice(item)), 0);
}
