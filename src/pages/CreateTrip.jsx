import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Users, Calendar, Loader2, Palmtree } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { useTripStore } from '../store/useTripStore';

export default function CreateTrip() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createTrip } = useTripStore();

  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expectedMembers, setExpectedMembers] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !destination.trim()) {
      toast.error('Trip name and destination are required');
      return;
    }
    setSubmitting(true);
    try {
      const trip = await createTrip(
        { name: name.trim(), destination: destination.trim(), startDate, endDate, expectedMembers },
        user.id
      );
      toast.success(`Trip created! Code: ${trip.join_code}`);
      navigate(`/trip/${trip.id}`);
    } catch (err) {
      toast.error(err.message || 'Could not create trip');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-teal-600 px-5 pt-6 pb-10 rounded-b-[2rem] flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-teal-500/40 flex items-center justify-center text-white active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-white text-lg font-bold">Create New Trip</h1>
          <p className="text-teal-100 text-xs">Set it up, share the code, done.</p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="px-5 -mt-6 space-y-4"
      >
        <div className="card space-y-5">
          <div>
            <label className="label-text flex items-center gap-1.5">
              <Palmtree className="w-3.5 h-3.5 text-teal-500" /> Trip Name
            </label>
            <input
              className="input-field"
              placeholder="Goa Trip 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label-text flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-500" /> Destination
            </label>
            <input
              className="input-field"
              placeholder="Goa, India"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-500" /> Start Date
              </label>
              <input
                type="date"
                className="input-field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label-text">End Date</label>
              <input
                type="date"
                className="input-field"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label-text flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-teal-500" /> Total Members Expected
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setExpectedMembers((n) => Math.max(2, n - 1))}
                className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 font-bold active:scale-95"
              >
                −
              </button>
              <span className="w-10 text-center font-bold text-teal-900 text-lg">{expectedMembers}</span>
              <button
                type="button"
                onClick={() => setExpectedMembers((n) => Math.min(30, n + 1))}
                className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 font-bold active:scale-95"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="card bg-teal-50 border border-teal-100 !shadow-none">
          <p className="text-xs text-teal-600 leading-relaxed">
            🎉 You'll become the <strong>Admin</strong> of this trip. A unique join code and shareable
            invite link will be generated automatically so friends can join via WhatsApp.
          </p>
        </div>

        <button type="submit" disabled={submitting} className="btn-accent w-full flex items-center justify-center gap-2">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Trip'}
        </button>
      </motion.form>
    </div>
  );
}
