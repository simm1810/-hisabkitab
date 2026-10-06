import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, MapPin, Calendar, Crown, LogIn, LogOut, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { useTripStore } from '../store/useTripStore';
import Avatar from '../components/Avatar';
import Footer from '../components/Footer';
import LogoMark from '../components/LogoMark';
import beachImage from '../../IMAGE/beach.jpg';
import goaImage from '../../IMAGE/goa.jpg';
import keralaImage from '../../IMAGE/kerala.jpg';
import ladakhImage from '../../IMAGE/ladakh.jpg';
import manaliImage from '../../IMAGE/manali.jpg';

const EMOJIS = ['🏖️', '🏔️', '🏙️', '🌴', '🕌', '🎡', '⛰️', '🌊'];
const emojiFor = (seed = '') => EMOJIS[seed.charCodeAt(0) % EMOJIS.length];
const DESTINATIONS = [
  { name: 'Goa', image: goaImage },
  { name: 'Kerala', image: keralaImage },
  { name: 'Ladakh', image: ladakhImage },
  { name: 'Manali', image: manaliImage },
];

function formatDateRange(start, end) {
  if (!start) return 'Dates TBD';
  const opts = { day: 'numeric', month: 'short' };
  const s = new Date(start).toLocaleDateString('en-IN', opts);
  if (!end) return s;
  const e = new Date(end).toLocaleDateString('en-IN', opts);
  return `${s} - ${e}`;
}

export default function Dashboard() {
  const { user, profile, signOut } = useAuthStore();
  const { trips, fetchMyTrips, loading } = useTripStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;

    fetchMyTrips(user.id).catch((err) => {
      toast.error(err.message || 'Could not load your trips.');
    });
  }, [user, fetchMyTrips]);

  const handleCreateTrip = () => {
    if (!user) {
      navigate('/login', { state: { from: '/create-trip' } });
      return;
    }

    navigate('/create-trip');
  };

  const filtered = user
    ? trips.filter(
        (t) =>
          (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (t.destination || '').toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-cream-50 pb-28">
      <div
        className="relative overflow-hidden bg-teal-600 px-5 pt-6 pb-8 rounded-b-[2rem] shadow-lg"
        style={
          !user
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(6, 78, 72, 0.82), rgba(6, 78, 72, 0.92)), url(${goaImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {user ? (
              <Avatar name={profile?.name || user.email} url={profile?.avatar_url} size={44} ring />
            ) : (
              <LogoMark className="h-11 w-11 rounded-full ring-2 ring-white" />
            )}
            <div>
              <p className="text-teal-100 text-xs">{user ? 'Namaste,' : 'Welcome to'}</p>
              <p className="text-white font-semibold">{profile?.name || 'HisabKitab'}</p>
            </div>
          </div>

          {user ? (
            <button
              onClick={signOut}
              className="w-10 h-10 rounded-full bg-teal-500/40 flex items-center justify-center text-white active:scale-95 transition"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-10 h-10 rounded-full bg-teal-500/40 flex items-center justify-center text-white active:scale-95 transition"
              aria-label="Sign in"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-1">
          <LogoMark className="h-8 w-8 rounded-lg shadow-sm" />
          <h1 className="text-white text-xl font-bold">{user ? 'My Trips' : 'HisabKitab'}</h1>
        </div>
        <p className="text-teal-100 text-sm">
          {user
            ? `${trips.length} trip${trips.length !== 1 ? 's' : ''} - split smart, travel happy`
            : 'Trip expenses, split fairly, hisaab clear'}
        </p>

        {user && (
          <div className="relative mt-5">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-teal-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your trips..."
              className="w-full bg-white/95 rounded-xl pl-10 pr-4 py-3 text-sm text-teal-900 placeholder:text-teal-400 focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
        )}

        {!user && (
          <div className="mt-7 flex gap-3">
            <button onClick={handleCreateTrip} className="btn-accent flex-1">
              Create Trip
            </button>
            <button onClick={() => navigate('/login')} className="btn-outline flex-1 bg-white/95">
              Sign In
            </button>
          </div>
        )}
      </div>

      <div className="px-5 mt-6 space-y-4">
        {!user && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-xl2 shadow-card"
            >
              <div
                className="min-h-[180px] bg-cover bg-center p-5 flex flex-col justify-end"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(15, 63, 60, 0.1), rgba(15, 63, 60, 0.85)), url(${beachImage})`,
                }}
              >
                <p className="text-white text-lg font-bold">Plan together, pay clearly</p>
                <p className="text-teal-50 text-sm mt-1">Create a trip ledger for stays, fuel, food, tickets, and shared memories.</p>
              </div>
            </motion.div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-teal-900 font-bold">Popular trip ideas</h2>
                <span className="text-xs text-teal-500">Use your images</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {DESTINATIONS.map((place) => (
                  <button
                    key={place.name}
                    onClick={handleCreateTrip}
                    className="relative overflow-hidden rounded-xl min-h-[128px] text-left shadow-card active:scale-[0.98] transition"
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(15, 63, 60, 0.08), rgba(15, 63, 60, 0.72)), url(${place.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <span className="absolute bottom-3 left-3 text-white font-bold">{place.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {user && loading && (
          <div className="text-center py-16 text-teal-400 text-sm">Loading your trips...</div>
        )}

        {user && !loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="text-5xl mb-3">🧳</div>
            <p className="text-teal-700 font-semibold">No trips yet</p>
            <p className="text-teal-400 text-sm mt-1">Create your first trip and invite friends!</p>
          </motion.div>
        )}

        {filtered.map((trip, idx) => (
          <motion.button
            key={trip.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => navigate(`/trip/${trip.id}`)}
            className="w-full text-left card active:scale-[0.98] transition-transform"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-2xl shrink-0">
                  {emojiFor(trip.name)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-teal-900">{trip.name}</h3>
                    {trip.myRole === 'admin' && <Crown className="w-3.5 h-3.5 text-saffron-500" />}
                  </div>
                  <div className="flex items-center gap-1 text-teal-500 text-xs mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {trip.destination}
                  </div>
                  <div className="flex items-center gap-1 text-teal-400 text-xs mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {formatDateRange(trip.start_date, trip.end_date)}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-md">
                {trip.join_code}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      <Footer />

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        onClick={handleCreateTrip}
        className="fixed bottom-6 right-5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-full w-14 h-14 shadow-xl flex items-center justify-center active:scale-95 transition"
        aria-label="Create new trip"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {(!user || (!loading && trips.length === 0)) && (
        <div className="fixed bottom-0 left-0 right-0 bg-cream-50 border-t border-teal-100 p-4 pb-6">
          <button onClick={handleCreateTrip} className="btn-primary w-full flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Trip
          </button>
        </div>
      )}
    </div>
  );
}
