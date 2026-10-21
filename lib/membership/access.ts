/**
 * The single answer to "is this person a member right now".
 *
 * There were four places deciding this and three different rules. The checkout
 * page granted benefits only while the status was ACTIVE; the checkout API
 * ignored status altogether; the account page showed the tier no matter what.
 * A Selecto member was told on one page that they were Selecto and on the next
 * that members-only bread required Artesano.
 *
 * The rule is the one the account page already promises out loud when a
 * membership is cancelled — "benefits active until <date>". Someone who has
 * paid through a date keeps what they paid for until that date, whatever
 * happened to the subscription since. A membership awaiting approval was never
 * paid for and grants nothing.
 */
import type { MembershipTier } from "./tiers";

export type MembershipLike = {
  tier: MembershipTier | string;
  status: string;
  endsAt?: Date | string | null;
} | null | undefined;

export function membershipGrantsBenefits(
  membership: MembershipLike,
  now: Date = new Date()
): boolean {
  if (!membership) return false;

  // An Embajador application that nobody has approved yet.
  if (membership.status === "PENDING_APPROVAL") return false;

  if (membership.status === "ACTIVE") return true;

  // Cancelled, past due, paused — paid through a date is paid through a date.
  if (!membership.endsAt) return false;
  const endsAt =
    membership.endsAt instanceof Date ? membership.endsAt : new Date(membership.endsAt);
  if (Number.isNaN(endsAt.getTime())) return false;

  return endsAt.getTime() > now.getTime();
}

/**
 * The tier to treat someone as having. BASICO is the floor, so every caller can
 * use the result without checking anything else first.
 */
export function effectiveTier(
  membership: MembershipLike,
  now: Date = new Date()
): MembershipTier {
  return membershipGrantsBenefits(membership, now)
    ? (membership!.tier as MembershipTier)
    : "BASICO";
}

/**
 * Why someone is or isn't getting their benefits, in words — for the account
 * page, for support, and for the membership:check script. A member who has been
 * told "no" deserves a reason better than a locked button.
 */
export function membershipAccessReason(
  membership: MembershipLike,
  now: Date = new Date()
): string {
  if (!membership) return "No membership on file.";
  if (membership.status === "PENDING_APPROVAL") return "Waiting for approval.";
  if (membership.status === "ACTIVE") return "Active.";

  if (!membership.endsAt) {
    return `Status is ${membership.status} and there is no end date, so benefits stopped immediately.`;
  }
  const endsAt =
    membership.endsAt instanceof Date ? membership.endsAt : new Date(membership.endsAt);
  if (Number.isNaN(endsAt.getTime())) {
    return `Status is ${membership.status} and the end date is unreadable.`;
  }
  const day = endsAt.toISOString().slice(0, 10);
  return endsAt.getTime() > now.getTime()
    ? `Status is ${membership.status}, but paid through ${day} — benefits continue until then.`
    : `Status is ${membership.status} and benefits ended on ${day}.`;
}
