/**
 * Telling prepaid money apart from points earned by buying.
 *
 * This is the blocker for the Loyalty Club migration (spec F.2). Today both
 * live in one column, `User.pointsBalance`: a membership fee is converted to
 * points at face value and dropped in next to the points a customer earned
 * at the till. Nothing records which is which, so "do not erase obligations
 * already paid for" cannot be honoured — there is nothing to look at.
 *
 * It can be reconstructed, because every movement is written to
 * PointsTransaction. This does that, read-only, and it does not change what
 * anyone is charged or shown.
 *
 *   PREPAID — BONUS. Money a customer handed over: a membership fee or a
 *             card charge converted to points at face value. An obligation.
 *   EARNED  — everything else positive: EARNED at the till, REFERRAL,
 *             BIRTHDAY, ADJUSTMENT. A marketing cost, not a debt.
 *
 * A redemption consumes the OLDEST credits first, which is how a balance
 * actually behaves and is the only split that does not need a policy
 * decision nobody has made. The two extremes are reported alongside so the
 * range is visible rather than assumed.
 */
export type LedgerEntry = {
  type: string;
  amount: number;
  createdAt: Date;
};

export type BalanceSplit = {
  /** Still unspent, from money the customer paid. The obligation. */
  prepaid: number;
  /** Still unspent, from points given for buying, referring or a birthday. */
  earned: number;
  /** prepaid + earned. Should equal the stored pointsBalance. */
  total: number;

  prepaidIn: number;
  earnedIn: number;
  redeemed: number;

  /** If every redemption had come out of prepaid first. */
  prepaidIfSpentFirst: number;
  /** If every redemption had come out of earned first. */
  prepaidIfSpentLast: number;
};

/** The ledger types that represent money a customer actually paid. */
export const PREPAID_TYPES = ["BONUS"];

export function isPrepaid(entry: { type: string }): boolean {
  return PREPAID_TYPES.includes(entry.type);
}

export function splitBalance(entries: readonly LedgerEntry[]): BalanceSplit {
  const ordered = [...entries].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // Oldest credits first. Each positive entry is a lot that can be drawn
  // down; each negative entry draws from the front of the queue.
  const lots: { kind: "prepaid" | "earned"; left: number }[] = [];
  let prepaidIn = 0;
  let earnedIn = 0;
  let redeemed = 0;

  for (const entry of ordered) {
    if (entry.amount > 0) {
      const kind = isPrepaid(entry) ? "prepaid" : "earned";
      if (kind === "prepaid") prepaidIn += entry.amount;
      else earnedIn += entry.amount;
      lots.push({ kind, left: entry.amount });
      continue;
    }
    // A redemption, or a negative adjustment clawing points back.
    let toSpend = -entry.amount;
    redeemed += toSpend;
    while (toSpend > 0 && lots.length) {
      const lot = lots[0];
      const take = Math.min(lot.left, toSpend);
      lot.left -= take;
      toSpend -= take;
      if (lot.left === 0) lots.shift();
    }
    // Anything left over is spending a balance the ledger does not account
    // for. It is not invented here; the drift check below reports it.
  }

  const prepaid = lots.filter((l) => l.kind === "prepaid").reduce((s, l) => s + l.left, 0);
  const earned = lots.filter((l) => l.kind === "earned").reduce((s, l) => s + l.left, 0);

  return {
    prepaid,
    earned,
    total: prepaid + earned,
    prepaidIn,
    earnedIn,
    redeemed,
    prepaidIfSpentFirst: Math.max(0, prepaidIn - redeemed),
    prepaidIfSpentLast: Math.max(0, Math.min(prepaidIn, prepaidIn + earnedIn - redeemed)),
  };
}

export type BalanceCheck = {
  split: BalanceSplit;
  /** The stored balance minus what the ledger reconstructs to. */
  drift: number;
  /** True when the ledger does not explain the stored balance. */
  driftsFromLedger: boolean;
};

/**
 * Reconstructs and compares against the stored balance.
 *
 * A difference means points moved without a ledger row, and the migration
 * must not run over accounts like that: the reconstruction would hand
 * someone a smaller obligation than they actually paid for.
 */
export function checkBalance(
  storedPointsBalance: number,
  entries: readonly LedgerEntry[]
): BalanceCheck {
  const split = splitBalance(entries);
  const drift = storedPointsBalance - split.total;
  return { split, drift, driftsFromLedger: drift !== 0 };
}
