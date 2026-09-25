/**
 * What happens to a week nobody answered.
 *
 * Pulled out of the cron so it can be tested: this is the code that decides
 * whether a customer's card gets charged when they said nothing, and that is
 * not a decision to leave only exercised by a Thursday in production.
 *
 * The rule is opt-out. The weekly box is a subscription — someone who doesn't
 * open their email still expects bread on Friday, so silence means send.
 * Declining takes an action: clicking skip, choosing MANUAL mode, or turning
 * auto-delivery off.
 */
export type WeeklyDecisionInput = {
  /** The mode as it was when the reminder went out, not as it is now. */
  modeSnapshot: "REPEAT_LAST" | "CURATED" | "MANUAL";
  autoDeliveryEnabled: boolean;
  hasCardOnFile: boolean;
};

export type WeeklyDecision =
  | { action: "skip"; reason: string }
  | { action: "send" }
  | { action: "queue-for-staff"; reason: string }
  | { action: "fail"; reason: string };

export function weeklyDecision(input: WeeklyDecisionInput): WeeklyDecision {
  // MANUAL exists precisely so nothing is charged without a yes.
  if (input.modeSnapshot === "MANUAL") {
    return { action: "skip", reason: "manual mode — needs an explicit yes" };
  }

  // A deliberate opt-out by the member.
  if (!input.autoDeliveryEnabled) {
    return { action: "skip", reason: "auto-delivery turned off by the member" };
  }

  // Curated boxes have no fixed contents, so a person has to pick them and
  // charge by hand. Auto-charging an undefined cart would be guessing.
  if (input.modeSnapshot === "CURATED") {
    return { action: "queue-for-staff", reason: "curated box needs a human to fill it" };
  }

  // Checked before charging so the failure is recorded against the week with a
  // reason the bakery can act on, rather than surfacing as a payment error.
  if (!input.hasCardOnFile) {
    return { action: "fail", reason: "No card on file" };
  }

  return { action: "send" };
}
