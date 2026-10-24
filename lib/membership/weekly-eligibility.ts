/**
 * Who gets a weekly box this week, and what goes in it.
 *
 * The whole weekly pipeline hangs off the Tuesday reminder: it writes the
 * WeeklyOrderLog, and Thursday's run only finalizes logs that already exist.
 * So anyone the Tuesday query leaves out gets no log, no email and no order —
 * silently, week after week, which reads as the automation being broken.
 *
 * Two filters were doing exactly that:
 *
 *   status: "ACTIVE"        — a member whose card failed goes PAST_DUE and
 *                             dropped out of the box entirely, even while
 *                             still paid through the end of their period.
 *   weeklyMode: { not: null } — a brand-new Selecto member has no mode until
 *                             they finish onboarding, so the member who just
 *                             paid for weekly bread was the one guaranteed
 *                             not to get it.
 *
 * Both are decided here instead, as one function, so the reason a member is in
 * or out can be tested and printed rather than inferred from an empty table.
 */
import { membershipGrantsBenefits, type MembershipLike } from "./access";
import { isDueThisWeek } from "./weekly";

export type WeeklyBoxMode = "REPEAT_LAST" | "CURATED" | "MANUAL";

export type WeeklyCandidate = {
  tier: string;
  status: string;
  endsAt?: Date | string | null;
  weeklyMode: WeeklyBoxMode | null;
  weeklyFrequency: "WEEKLY" | "EVERY_4_WEEKS" | null;
  weeklyAnchorAt: Date | null;
  /** Whether there is an order to repeat — decides the default mode. */
  hasPreviousOrder: boolean;
};

export type WeeklyBoxPlan =
  | { include: false; reason: string }
  | { include: true; mode: WeeklyBoxMode; defaulted: boolean };

/** The tiers the weekly box belongs to. */
export const WEEKLY_TIERS = ["SELECTO", "LEGENDARIO"];

/**
 * The mode to use for a member who never picked one.
 *
 * The box is sold as a subscription, so "hasn't finished onboarding" cannot
 * mean "gets nothing". Repeating their last order is the closest thing to what
 * they chose; with no order to repeat there is nothing to copy, so it goes to
 * the bakery as a curated box for a person to fill rather than guessing a cart
 * and charging a card for it.
 */
export function defaultWeeklyMode(hasPreviousOrder: boolean): WeeklyBoxMode {
  return hasPreviousOrder ? "REPEAT_LAST" : "CURATED";
}

export function weeklyBoxPlan(
  member: WeeklyCandidate,
  weekStart: Date
): WeeklyBoxPlan {
  if (!WEEKLY_TIERS.includes(member.tier)) {
    return { include: false, reason: `${member.tier} has no weekly box` };
  }

  const asMembership: MembershipLike = {
    tier: member.tier,
    status: member.status,
    endsAt: member.endsAt ?? null,
  };
  if (!membershipGrantsBenefits(asMembership)) {
    return { include: false, reason: `membership is ${member.status}` };
  }

  if (
    !isDueThisWeek({
      // The column is non-null in the schema; the fallback is for a row
      // written before it existed, where weekly is the sold default.
      frequency: member.weeklyFrequency ?? "WEEKLY",
      anchorAt: member.weeklyAnchorAt,
      weekStart,
    })
  ) {
    return { include: false, reason: "not due this week" };
  }

  if (member.weeklyMode) {
    return { include: true, mode: member.weeklyMode, defaulted: false };
  }

  return {
    include: true,
    mode: defaultWeeklyMode(member.hasPreviousOrder),
    defaulted: true,
  };
}
