import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, Calendar, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { useTripStore } from '../store/useTripStore';
import LogoMark from '../components/LogoMark';

export default function JoinTrip() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthStore();
  const { findTripByCode, joinTrip } = useTripStore();

  const [trip, setTrip] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | found | not-found
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const found = await findTripByCode(code);
        if (found) {
          setTrip(found);
          setStatus('found');
        } else {
          setStatus('not-found');
        }
      } catch {
        setStatus('not-found');
      }
    })();
  }, [code, findTripByCode]);

  const handleJoin = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/join/${code}` } });
      return;
    }
    setJoining(true);
    try {
      await joinTrip(trip.id, user.id);
      toast.success(`Welcome to ${trip.name}! 🎉`);
      navigate(`/trip/${trip.id}`);
    } catch (err) {
      toast.error(err.message || 'Could not join trip');
    } finally {
      setJoining(false);
    }
  };

  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-teal-600 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center px-6 text-center">
        <AlertTriangle className="w-12 h-12 text-saffron-500 mb-4" />
        <h2 className="text-lg font-bold text-teal-900">Invalid Join Code</h2>
        <p className="text-teal-500 text-sm mt-1">
          The code <span className="font-mono font-bold">{code}</span> does not match any trip.
        </p>
        <button onClick={() => navigate('/')} className="btn-primary mt-6">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-600 to-teal-700 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-5"
      >
        <LogoMark className="h-16 w-16 rounded-2xl shadow-lg" />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="card w-full max-w-sm text-center"
      >
        <p className="text-teal-400 text-xs font-semibold uppercase tracking-wide">You are invited to</p>
        <h1 className="text-2xl font-bold text-teal-900 mt-1">{trip.name}</h1>

        <div className="flex items-center justify-center gap-1 text-teal-500 text-sm mt-2">
          <MapPin className="w-4 h-4" />
          {trip.destination}
        </div>

        {trip.start_date && (
          <div className="flex items-center justify-center gap-1 text-teal-400 text-xs mt-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(trip.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}

        <div className="flex items-center justify-center gap-1 text-teal-400 text-xs mt-1 mb-6">
          <Users className="w-3.5 h-3.5" />
          Expecting {trip.expected_members} members
        </div>

        <button onClick={handleJoin} disabled={joining} className="btn-accent w-full flex items-center justify-center gap-2">
          {joining ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : user ? (
            'Join This Trip'
          ) : (
            'Login to Join'
          )}
        </button>

        <p className="text-teal-300 text-[11px] mt-3">Join code: <span className="font-mono font-bold text-teal-500">{trip.join_code}</span></p>
      </motion.div>
    </div>
  );
}
