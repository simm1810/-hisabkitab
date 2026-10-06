import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCategoryMeta } from '../../utils/categories';
import { formatINR } from '../../utils/settlement';
import { useTripStore } from '../../store/useTripStore';
import { useAuthStore } from '../../store/useAuthStore';
import Avatar from '../Avatar';
import AddExpenseModal from '../AddExpenseModal';

function memberName(members, id) {
  return members.find((m) => m.id === id)?.name || 'Someone';
}
function memberAvatar(members, id) {
  return members.find((m) => m.id === id)?.avatar_url || null;
}

export default function ExpensesTab({ tripId, expenses, members }) {
  const [showAdd, setShowAdd] = useState(false);
  const { user } = useAuthStore();
  const { deleteExpense } = useTripStore();
  const isAdmin = members.some((member) => member.id === user?.id && member.role === 'admin');

  const handleDelete = async (id) => {
    try {
      await deleteExpense(id);
      toast.success('Expense removed');
    } catch (err) {
      toast.error(err.message || 'Could not delete');
    }
  };

  const canDelete = (expense) =>
    expense.added_by_user_id === user?.id || isAdmin;

  return (
    <div className="px-5 pb-28">
      <button
        onClick={() => setShowAdd(true)}
        className="w-full btn-accent flex items-center justify-center gap-2 mt-4 mb-5"
      >
        <Plus className="w-5 h-5" />
        Add Expense
      </button>

      {expenses.length === 0 && (
        <div className="text-center py-16">
          <Receipt className="w-10 h-10 text-teal-200 mx-auto mb-3" />
          <p className="text-teal-500 text-sm">No expenses yet. Add the first one!</p>
        </div>
      )}

      <div className="space-y-3">
        {expenses.map((exp, idx) => {
          const meta = getCategoryMeta(exp.category);
          const Icon = meta.icon;
          return (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.3) }}
              className="card flex items-center gap-3"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: meta.bg }}
              >
                <Icon className="w-5 h-5" style={{ color: meta.color }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-teal-900 truncate">{exp.description}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Avatar name={memberName(members, exp.paid_by_user_id)} url={memberAvatar(members, exp.paid_by_user_id)} size={16} />
                  <p className="text-xs text-teal-500 truncate">
                    Paid by {memberName(members, exp.paid_by_user_id)} ·{' '}
                    {new Date(exp.expense_date || exp.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-teal-900">{formatINR(exp.amount)}</p>
                {canDelete(exp) && (
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="text-red-400 mt-1 active:scale-95 transition"
                    aria-label="Delete expense"
                  >
                    <Trash2 className="w-3.5 h-3.5 inline" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {showAdd && <AddExpenseModal tripId={tripId} members={members} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
