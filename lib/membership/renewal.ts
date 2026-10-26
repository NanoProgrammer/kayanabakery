/**
 * What to do with a membership whose renewal is due or has just failed.
 *
 * The cron used to do this inline, and it had no middle: one declined card and
 * the member was set PAST_DUE with endsAt = now, so their benefits stopped the
 * same second. Nothing ever retried — the query only looked at ACTIVE
 * memberships, so a PAST_DUE one was never seen again, even if the card worked
 * the next morning. A bank's routine decline permanently ended a paid
 * membership, silently, and the member found out by losing access.
 *
 * So a failure opens a grace window instead. Benefits continue through it (the
 * access rule already grants them while endsAt is in the future), the card is
 * tried again every day, and only when the window closes does the membership
 * actually end.
 */
export const GRACE_DAYS = 7;

export type RenewalCandidate = {
  tier: string;
  status: string;
  renewsAt: Date | null;
  endsAt: Date | null;
  hasCard: boolean;
};

export type RenewalDecision =
  | { action: "skip"; reason: string }
  | { action: "charge"; attempt: "first" | "retry" }
  | { action: "expire"; reason: string };

const PAID_TIERS = ["ARTESANO", "SELECTO", "LEGENDARIO"];

/** Statuses a failed renewal can leave behind, and that it should pick back up. */
const IN_GRACE = ["PAST_DUE"];

export function renewalDecision(
  m: RenewalCandidate,
  now: Date = new Date()
): RenewalDecision {
  if (!PAID_TIERS.includes(m.tier)) {
    return { action: "skip", reason: `${m.tier} is not a paid tier` };
  }

  const graceOpen = Boolean(m.endsAt && m.endsAt.getTime() > now.getTime());

  if (IN_GRACE.includes(m.status)) {
    // The window has run out: this is where a membership really ends.
    if (!graceOpen) {
      return { action: "expire", reason: "the grace period ran out" };
    }
    if (!m.hasCard) {
      return { action: "skip", reason: "no card on file to retry" };
    }
    return { action: "charge", attempt: "retry" };
  }

  if (m.status !== "ACTIVE") {
    return { action: "skip", reason: `status is ${m.status}` };
  }

  if (!m.renewsAt || m.renewsAt.getTime() > now.getTime()) {
    return { action: "skip", reason: "not due yet" };
  }

  if (!m.hasCard) {
    // Nothing to charge, so there is nothing to retry either — but it is not
    // this cron's place to end a membership that was never chargeable.
    return { action: "skip", reason: "no card on file" };
  }

  return { action: "charge", attempt: "first" };
}

/** When benefits should run to after a charge fails for the first time. */
export function graceEndsAt(now: Date = new Date()): Date {
  const end = new Date(now);
  end.setDate(end.getDate() + GRACE_DAYS);
  return end;
}

/** Whole days of grace left, for the message the member is sent. */
export function graceDaysLeft(endsAt: Date | null, now: Date = new Date()): number {
  if (!endsAt) return 0;
  const ms = endsAt.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}
