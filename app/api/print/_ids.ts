/**
 * The queue holds two kinds of order, and the agent shouldn't have to care.
 *
 * Orders from checkout live in the database and are addressed by their Prisma
 * id. Orders typed into Studio by hand never reach the database at all, so they
 * are addressed by their Sanity document id behind a "sanity:" prefix. The
 * agent takes whatever /pending gave it and hands it straight back.
 */
const SANITY_PREFIX = "sanity:";

export type PrintTarget =
  | { kind: "checkout"; prismaId: string }
  | { kind: "studio"; sanityId: string };

export function parsePrintId(raw: string): PrintTarget {
  const id = decodeURIComponent(raw);
  return id.startsWith(SANITY_PREFIX)
    ? { kind: "studio", sanityId: id.slice(SANITY_PREFIX.length) }
    : { kind: "checkout", prismaId: id };
}

/**
 * Sanity keeps unpublished work under a prefixed id: `drafts.<id>` while it is
 * being typed, `versions.<release>.<id>` when it belongs to a content release.
 *
 * Nothing with such an id may be printed or stamped. Printing one puts a
 * half-finished ticket in the kitchen, and stamping one is worse: the draft
 * carries printedAt with it when the order is finally published, so the real
 * order silently never prints.
 */
export function isUnpublishedId(sanityId: string): boolean {
  return sanityId.startsWith("drafts.") || sanityId.startsWith("versions.");
}
