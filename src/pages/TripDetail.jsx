import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Receipt, Scale, Users, Sparkles, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useTripStore } from '../store/useTripStore';
import ExpensesTab from '../components/tabs/ExpensesTab';
import BalancesTab from '../components/tabs/BalancesTab';
import MembersTab from '../components/tabs/MembersTab';
import NearbyExplorerModal from '../components/NearbyExplorerModal';

const TABS = [
  { key: 'expenses', label: 'Expenses', icon: Receipt },
  { key: 'balances', label: 'Balances', icon: Scale },
  { key: 'members', label: 'Members', icon: Users },
];

export default function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTrip, members, expenses, loading, loadTripDetail, subscribeToTrip, unsubscribeFromTrip, reset } =
    useTripStore();

  const [tab, setTab] = useState('expenses');
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    loadTripDetail(tripId);
    subscribeToTrip(tripId);
    return () => {
      unsubscribeFromTrip();
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  if (loading && !currentTrip) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (!currentTrip) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-teal-700 font-semibold">Trip not found</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-4">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isMember = members.some((m) => m.id === user?.id);

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-teal-600 px-5 pt-6 pb-5 rounded-b-[1.75rem] sticky top-0 z-20 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-full bg-teal-500/40 flex items-center justify-center text-white active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAI(true)}
            className="flex items-center gap-1.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold px-3 py-2 rounded-full active:scale-95 transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Suggest Near Me
          </button>
        </div>

        <h1 className="text-white text-xl font-bold truncate">{currentTrip.name}</h1>
        <p className="text-teal-100 text-xs mt-0.5">
          {currentTrip.destination} · {members.length} member{members.length !== 1 ? 's' : ''}
        </p>

        {/* Tabs */}
        <div className="flex bg-teal-700/50 rounded-xl p-1 mt-4">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  active ? 'bg-white text-teal-700 shadow-sm' : 'text-teal-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === 'expenses' && <ExpensesTab tripId={tripId} expenses={expenses} members={members} />}
        {tab === 'balances' && <BalancesTab tripId={tripId} expenses={expenses} members={members} />}
        {tab === 'members' && <MembersTab trip={currentTrip} members={members} />}
      </motion.div>

      {!isMember && (
        <div className="fixed bottom-0 left-0 right-0 bg-saffron-50 border-t border-saffron-200 px-5 py-3 text-center text-xs text-saffron-700">
          You're viewing this trip but haven't joined yet.
        </div>
      )}

      {showAI && <NearbyExplorerModal destination={currentTrip.destination} onClose={() => setShowAI(false)} />}
    </div>
  );
}
