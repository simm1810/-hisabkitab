import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Users2, TrendingUp, TrendingDown, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTripSummary, formatINR } from '../../utils/settlement';
import { useTripStore } from '../../store/useTripStore';
import { useAuthStore } from '../../store/useAuthStore';
import Avatar from '../Avatar';

export default function BalancesTab({ tripId, expenses, members }) {
  const { user } = useAuthStore();
  const { recordSettlement } = useTripStore();
  const [settling, setSettling] = useState(null); // txn key currently being settled

  const { totalSpent, perPersonShare, balances, settlementPlan } = useMemo(
    () => getTripSummary(expenses, members),
    [expenses, members]
  );

  const myBalance = user ? balances[user.id] : null;

  const handleSettle = async (txn, key) => {
    setSettling(key);
    try {
      await recordSettlement({
        tripId,
        fromUserId: txn.from,
        toUserId: txn.to,
        amount: txn.amount,
        note: `${txn.fromName} paid ${txn.toName}`,
      });
      toast.success(`Marked: ${txn.fromName} → ${txn.toName}`);
    } catch (err) {
      toast.error(err.message || 'Could not record settlement');
    } finally {
      setSettling(null);
    }
  };

  return (
    <div className="px-5 pb-28 pt-4">
      {/* Top summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="card !bg-teal-600 text-white">
          <Wallet className="w-5 h-5 text-teal-200 mb-2" />
          <p className="text-teal-100 text-xs">Total Trip Spent</p>
          <p className="text-xl font-bold mt-0.5">{formatINR(totalSpent)}</p>
        </div>
        <div className="card !bg-saffron-500 text-white">
          <Users2 className="w-5 h-5 text-orange-100 mb-2" />
          <p className="text-orange-50 text-xs">Per Person Share</p>
          <p className="text-xl font-bold mt-0.5">{formatINR(perPersonShare)}</p>
        </div>
      </div>

      {/* My balance highlight */}
      {myBalance && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card mb-5 flex items-center gap-3 border-2 ${
            myBalance.balance >= 0 ? 'border-teal-200 bg-teal-50/50' : 'border-saffron-200 bg-orange-50/50'
          }`}
        >
          {myBalance.balance >= 0 ? (
            <TrendingUp className="w-8 h-8 text-teal-600 shrink-0" />
          ) : (
            <TrendingDown className="w-8 h-8 text-saffron-600 shrink-0" />
          )}
          <div>
            <p className="text-xs text-teal-500 font-medium">Your Balance</p>
            <p className={`text-lg font-bold ${myBalance.balance >= 0 ? 'text-teal-700' : 'text-saffron-600'}`}>
              {myBalance.balance >= 0
                ? `You'll get back ${formatINR(myBalance.balance)}`
                : `You owe ${formatINR(Math.abs(myBalance.balance))}`}
            </p>
          </div>
        </motion.div>
      )}

      {/* Per-member balance list */}
      <h3 className="font-bold text-teal-900 mb-3">Everyone's Balance</h3>
      <div className="space-y-2 mb-6">
        {Object.values(balances).map((b) => (
          <div key={b.id} className="card !p-3 flex items-center gap-3">
            <Avatar name={b.name} url={b.avatar_url} size={36} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-teal-900 text-sm truncate">{b.name}</p>
              <p className="text-xs text-teal-400">Paid {formatINR(b.paid)} · Share {formatINR(b.share)}</p>
            </div>
            <span
              className={`text-sm font-bold shrink-0 ${
                b.balance > 0.5 ? 'text-teal-600' : b.balance < -0.5 ? 'text-saffron-600' : 'text-teal-300'
              }`}
            >
              {b.balance > 0.5 ? `+${formatINR(b.balance)}` : b.balance < -0.5 ? `-${formatINR(Math.abs(b.balance))}` : 'Settled'}
            </span>
          </div>
        ))}
      </div>

      {/* Smart settlement plan */}
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles className="w-4 h-4 text-saffron-500" />
        <h3 className="font-bold text-teal-900">Smart Settlement</h3>
      </div>
      <p className="text-xs text-teal-400 mb-3">Minimum transactions to clear all dues, calculated automatically.</p>

      {settlementPlan.length === 0 ? (
        <div className="card text-center py-8">
          <CheckCircle2 className="w-8 h-8 text-teal-400 mx-auto mb-2" />
          <p className="text-teal-600 font-semibold text-sm">All settled up! 🎉</p>
        </div>
      ) : (
        <div className="space-y-2">
          {settlementPlan.map((txn, idx) => {
            const key = `${txn.from}-${txn.to}-${idx}`;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card !p-3 flex items-center gap-2"
              >
                <Avatar name={txn.fromName} size={32} />
                <div className="flex-1 min-w-0 flex items-center gap-1.5 text-sm">
                  <span className="font-semibold text-teal-900 truncate">{txn.fromName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                  <span className="font-semibold text-teal-900 truncate">{txn.toName}</span>
                </div>
                <span className="font-bold text-saffron-600 text-sm shrink-0">{formatINR(txn.amount)}</span>
                <button
                  onClick={() => handleSettle(txn, key)}
                  disabled={settling === key}
                  className="ml-1 text-[11px] font-bold bg-teal-600 text-white px-2.5 py-1.5 rounded-lg active:scale-95 transition disabled:opacity-50 shrink-0"
                >
                  {settling === key ? '...' : 'Settle Up'}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
