import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MapPin, Navigation, Loader2, UtensilsCrossed, Fuel, Landmark, Compass } from 'lucide-react';
import toast from 'react-hot-toast';

const MODES = [
  { value: 'places', label: 'Places', icon: Compass, query: 'tourism~"attraction|viewpoint|museum|fort|temple"' },
  { value: 'eats', label: 'Cheap Eats', icon: UtensilsCrossed, query: 'amenity~"restaurant|cafe|fast_food|dhaba"' },
  { value: 'petrol', label: 'Petrol Pumps', icon: Fuel, query: 'amenity="fuel"' },
  { value: 'atm', label: 'ATMs', icon: Landmark, query: 'amenity~"atm|bank"' },
];

export default function NearbyExplorerModal({ destination = 'India', onClose }) {
  const [mode, setMode] = useState('places');
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState(null);
  const [coords, setCoords] = useState(null);

  const fetchSuggestions = async (nextMode) => {
    const selected = MODES.find(m => m.value === nextMode);
    setMode(nextMode);
    setLoading(true);
    setPlaces(null);
    try {
      // 1. destination -> lat/lon
      let latLon = coords;
      if (!latLon) {
        const res = await fetch('https://overpass.kumi.systems/api/interpreter', {
  method: 'POST',
  body: 'data=' + encodeURIComponent(q),
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});
const data = await res.json();
        if (!data.elements[0]) throw new Error(destination + ' not found');
        latLon = { lat: data.elements[0].lat, lon: data.elements[0].lon };
        setCoords(latLon);
      }

      // 2. OSM se real data
      const q = `[out:json][timeout:25];(node[${selected.query}](around:5000,${latLon.lat},${latLon.lon}););out 20;`;
      const data = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`
      ).then(r => r.json());

      const list = data.elements
        .filter(e => e.tags?.name)
        .slice(0, 10)
        .map(e => ({
          name: e.tags.name,
          type: e.tags.amenity || e.tags.tourism || selected.label,
          lat: e.lat,
          lon: e.lon,
        }));

      if (!list.length) toast(`No ${selected.label} near ${destination}`);
      setPlaces(list);
    } catch (err) {
      toast.error(err.message);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40 flex items-end justify-center" onClick={onClose}>
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={e => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-t-[1.75rem] max-h-[88vh] overflow-y-auto pb-8">
          <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b">
            <div className="flex justify-between">
              <h2 className="font-bold flex gap-2"><Sparkles className="w-5 h-5 text-orange-500" /> AI Nearby Explorer</h2>
              <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex justify-center items-center"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-teal-500 flex gap-1 mt-1"><MapPin className="w-3 h-3" /> Near {destination}</p>
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {MODES.map(m => {
                const Icon = m.icon;
                return <button key={m.value} onClick={() => fetchSuggestions(m.value)} className={`px-3.5 py-2 rounded-full text-xs font-bold flex gap-1.5 ${mode===m.value?'bg-teal-800 text-white':'bg-teal-50 text-teal-700'}`}><Icon className="w-3.5 h-3.5" />{m.label}</button>
              })}
            </div>
          </div>

          <div className="px-5 mt-4">
            {!places && !loading && (
              <div className="text-center py-14">
                <p className="text-sm text-gray-500 mb-4">Suggestions for <b>{destination}</b></p>
                <button onClick={() => fetchSuggestions('places')} className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold">Suggest Near Me</button>
              </div>
            )}
            {loading && <div className="text-center py-14"><Loader2 className="w-8 h-8 animate-spin mx-auto" /><p className="text-sm mt-2">Searching near {destination}...</p></div>}
            {places && (
              <div className="space-y-2">
                {places.map((p, i) => (
                  <div key={i} className="border p-3 rounded-xl flex justify-between items-center">
                    <div><p className="font-bold text-sm">{p.name}</p><p className="text-xs text-gray-400">{p.type}</p></div>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`} target="_blank" className="w-9 h-9 bg-teal-50 rounded-full flex items-center justify-center"><Navigation className="w-4 h-4" /></a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}