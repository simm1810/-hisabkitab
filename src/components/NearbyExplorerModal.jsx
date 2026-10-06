import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MapPin, Star, Navigation, Loader2, UtensilsCrossed, Fuel, Landmark, Compass } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const MODES = [
  { value: 'places', label: 'Places', icon: Compass },
  { value: 'eats', label: 'Cheap Eats', icon: UtensilsCrossed },
  { value: 'petrol', label: 'Petrol Pumps', icon: Fuel },
  { value: 'atm', label: 'ATMs', icon: Landmark },
];

export default function NearbyExplorerModal({ destination, onClose }) {
  const [mode, setMode] = useState('places');
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState(null);
  const [errored, setErrored] = useState(false);

  const fetchSuggestions = async (nextMode) => {
    setMode(nextMode);
    setLoading(true);
    setErrored(false);
    try {
      const { data, error } = await supabase.functions.invoke('nearby-explorer', {
        body: { destination, mode: nextMode },
      });
      if (error) throw error;
      setPlaces(data?.places || []);
    } catch (err) {
      setErrored(true);
      toast.error('AI suggestions unavailable — check Edge Function setup');
    } finally {
      setLoading(false);
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
          className="bg-cream-50 w-full max-w-lg rounded-t-[1.75rem] max-h-[88vh] overflow-y-auto pb-8"
        >
          <div className="sticky top-0 bg-cream-50 px-5 pt-5 pb-3 border-b border-teal-100/60 z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-saffron-500" />
                <h2 className="font-bold text-teal-900 text-lg">AI Nearby Explorer</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center active:scale-95">
                <X className="w-4 h-4 text-teal-600" />
              </button>
            </div>
            <p className="text-xs text-teal-400 flex items-center gap-1 mb-3">
              <MapPin className="w-3.5 h-3.5" /> Near {destination}
            </p>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {MODES.map((m) => {
                const Icon = m.icon;
                const active = mode === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => fetchSuggestions(m.value)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                      active ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-5 mt-4">
            {!places && !loading && !errored && (
              <div className="text-center py-14">
                <Sparkles className="w-10 h-10 text-teal-200 mx-auto mb-3" />
                <p className="text-teal-500 text-sm mb-4">Pick a category above to get AI-powered suggestions</p>
                <button onClick={() => fetchSuggestions('places')} className="btn-accent">
                  Suggest Near Me
                </button>
              </div>
            )}

            {loading && (
              <div className="text-center py-14">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-3" />
                <p className="text-teal-400 text-sm">Asking AI for the best budget spots…</p>
              </div>
            )}

            {errored && !loading && (
              <div className="text-center py-14">
                <p className="text-teal-500 text-sm mb-2">Couldn't fetch suggestions right now.</p>
                <p className="text-teal-300 text-xs mb-4 max-w-xs mx-auto">
                  Make sure the <code className="bg-teal-50 px-1 rounded">nearby-explorer</code> Edge Function is
                  deployed with a <code className="bg-teal-50 px-1 rounded">GEMINI_API_KEY</code> secret set.
                </p>
                <button onClick={() => fetchSuggestions(mode)} className="btn-outline">
                  Try Again
                </button>
              </div>
            )}

            {places && !loading && (
              <div className="space-y-3">
                {places.map((p, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="card !p-3 flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 font-bold text-teal-600 text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-teal-900 text-sm truncate">{p.name}</p>
                      <p className="text-xs text-teal-400">{p.type}</p>
                      {p.note && <p className="text-xs text-teal-500 mt-1">{p.note}</p>}
                      <div className="flex items-center gap-3 mt-1.5">
                        {p.rating && (
                          <span className="flex items-center gap-0.5 text-xs font-semibold text-saffron-600">
                            <Star className="w-3 h-3 fill-saffron-500 text-saffron-500" />
                            {p.rating}
                          </span>
                        )}
                        {p.distance_km && (
                          <span className="flex items-center gap-0.5 text-xs text-teal-400">
                            <Navigation className="w-3 h-3" />
                            {p.distance_km} km
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
