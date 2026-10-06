import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, IndianRupee, Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { CATEGORIES } from '../utils/categories';
import { useTripStore } from '../store/useTripStore';
import { useAuthStore } from '../store/useAuthStore';
import Avatar from './Avatar';

export default function AddExpenseModal({ tripId, members, onClose }) {
  const { user } = useAuthStore();
  const { addExpense } = useTripStore();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(user?.id || '');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!description.trim()) return toast.error('Add a description');
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    if (!paidBy) return toast.error('Select who paid');

    setSubmitting(true);
    try {
      await addExpense({
        tripId,
        paidByUserId: paidBy,
        addedByUserId: user.id,
        amount: amt,
        description: description.trim(),
        category,
        date,
        receiptFile,
      });
      toast.success('Expense added!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Could not add expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-40 flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-cream-50 w-full max-w-lg rounded-t-[1.75rem] max-h-[92vh] overflow-y-auto pb-8"
        >
          <div className="sticky top-0 bg-cream-50 px-5 pt-5 pb-3 flex items-center justify-between border-b border-teal-100/60 z-10">
            <h2 className="font-bold text-teal-900 text-lg">Add Expense</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center active:scale-95">
              <X className="w-4 h-4 text-teal-600" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 mt-4 space-y-5">
            <div>
              <label className="label-text">Description</label>
              <input
                className="input-field"
                placeholder="Hotel, Petrol, Food..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label-text">Amount Paid</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3.5 w-4 h-4 text-teal-400" />
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  className="input-field pl-9"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-text">Paid By</label>
              <div className="grid grid-cols-4 gap-2">
                {members.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPaidBy(m.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition ${
                      paidBy === m.id ? 'border-teal-600 bg-teal-50' : 'border-transparent bg-white'
                    }`}
                  >
                    <Avatar name={m.name} url={m.avatar_url} size={36} />
                    <span className="text-[10px] font-medium text-teal-700 truncate w-full text-center">
                      {m.name?.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label-text">Category</label>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const active = category === c.value;
                  return (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      style={active ? { backgroundColor: c.color } : { backgroundColor: c.bg, color: c.color }}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                        active ? 'text-white shadow-sm' : ''
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="label-text">Date</label>
              <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div>
              <label className="label-text">Attach Bill Photo (optional)</label>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-teal-200 rounded-xl py-4 text-teal-500 text-sm cursor-pointer active:bg-teal-50 transition">
                <Camera className="w-4 h-4" />
                {receiptFile ? receiptFile.name : 'Upload photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Expense'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
