/**
 * HisabKitab Settlement Engine
 * ------------------------------------------------------------
 * Pure functions, no side effects — fully unit-testable.
 *
 * Rounding strategy: all money is handled in PAISE (integer) internally
 * to avoid floating point drift, then converted back to rupees (2dp)
 * for display. The single rupee of rounding remainder (if total
 * doesn't divide evenly) is distributed to the first N payers so that
 * sum(shares) === totalSpent exactly (paisa-perfect split).
 */

const toPaise = (rupees) => Math.round(Number(rupees) * 100);
const toRupees = (paise) => Math.round(paise) / 100;

/**
 * Compute each member's fair share of the total trip spend.
 * Splits the amount as evenly as possible in whole paise, giving
 * the leftover paise (a few rounding units) to the earliest members
 * so the shares always sum EXACTLY to totalSpent.
 */
export function computeEqualShares(totalSpentRupees, memberIds) {
  const n = memberIds.length;
  if (n === 0) return {};
  const totalPaise = toPaise(totalSpentRupees);
  const basePaise = Math.floor(totalPaise / n);
  const remainder = totalPaise - basePaise * n;

  const shares = {};
  memberIds.forEach((id, idx) => {
    const extra = idx < remainder ? 1 : 0;
    shares[id] = toRupees(basePaise + extra);
  });
  return shares;
}

/**
 * Given a list of expenses [{ paid_by_user_id, amount }] and the full
 * member list [{ id, name }], compute:
 *  - totalSpent
 *  - perPersonShare (average, for display card)
 *  - paidByUser: { userId: totalPaid }
 *  - balances: { userId: { paid, share, balance, name } }
 *      balance > 0  => this person is owed money (net creditor)
 *      balance < 0  => this person owes money   (net debtor)
 */
export function computeBalances(expenses, members) {
  const memberIds = members.map((m) => m.id);
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const perPersonShare = memberIds.length ? totalSpent / memberIds.length : 0;

  const paidByUser = {};
  memberIds.forEach((id) => (paidByUser[id] = 0));
  expenses.forEach((e) => {
    if (paidByUser[e.paid_by_user_id] === undefined) paidByUser[e.paid_by_user_id] = 0;
    paidByUser[e.paid_by_user_id] += Number(e.amount);
  });

  const shares = computeEqualShares(totalSpent, memberIds);

  const balances = {};
  members.forEach((m) => {
    const paid = toRupees(toPaise(paidByUser[m.id] || 0));
    const share = shares[m.id] || 0;
    const balance = toRupees(toPaise(paid) - toPaise(share));
    balances[m.id] = {
      id: m.id,
      name: m.name,
      avatar_url: m.avatar_url,
      paid,
      share,
      balance, // + means "gets back", - means "owes"
    };
  });

  return {
    totalSpent: toRupees(toPaise(totalSpent)),
    perPersonShare: toRupees(toPaise(perPersonShare)),
    paidByUser,
    balances,
  };
}

/**
 * Greedy minimal-transaction debt settlement.
 * Classic algorithm: repeatedly match the biggest creditor with the
 * biggest debtor, settle the smaller of the two amounts, repeat.
 * This provably minimizes the number of transactions in the common
 * case and is the standard approach used by Splitwise-style apps.
 *
 * Input: balances map from computeBalances()
 * Output: [{ from: userId, fromName, to: userId, toName, amount }]
 */
export function computeSettlementPlan(balances) {
  const PAISE_EPSILON = 1; // ignore differences smaller than 1 paisa

  const creditors = [];
  const debtors = [];

  Object.values(balances).forEach((b) => {
    const paise = toPaise(b.balance);
    if (paise > PAISE_EPSILON) {
      creditors.push({ id: b.id, name: b.name, amountPaise: paise });
    } else if (paise < -PAISE_EPSILON) {
      debtors.push({ id: b.id, name: b.name, amountPaise: -paise });
    }
  });

  // Sort descending so we always match the largest amounts first —
  // this is what keeps the transaction count minimal.
  creditors.sort((a, b) => b.amountPaise - a.amountPaise);
  debtors.sort((a, b) => b.amountPaise - a.amountPaise);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settledPaise = Math.min(debtor.amountPaise, creditor.amountPaise);

    if (settledPaise > PAISE_EPSILON) {
      transactions.push({
        from: debtor.id,
        fromName: debtor.name,
        to: creditor.id,
        toName: creditor.name,
        amount: toRupees(settledPaise),
      });
    }

    debtor.amountPaise -= settledPaise;
    creditor.amountPaise -= settledPaise;

    if (debtor.amountPaise <= PAISE_EPSILON) i += 1;
    if (creditor.amountPaise <= PAISE_EPSILON) j += 1;
  }

  return transactions;
}

/**
 * Convenience: run the full pipeline in one call.
 */
export function getTripSummary(expenses, members) {
  const { totalSpent, perPersonShare, balances } = computeBalances(expenses, members);
  const settlementPlan = computeSettlementPlan(balances);
  return { totalSpent, perPersonShare, balances, settlementPlan };
}

export function formatINR(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

export function generateJoinCode(destination = '') {
  const prefix = (destination || 'TRP')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, 'X');
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}${num}`;
}
