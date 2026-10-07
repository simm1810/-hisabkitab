import React, { useState, useEffect } from 'react';
import { X, Compass, Utensils, Landmark, Fuel, Building2, MapPin, Loader2 } from 'lucide-react';

const MODES = [
  { value: 'tourist_attraction', label: 'Attractions', icon: Compass, query: 'tourism~"attraction|viewpoint|museum|fort|temple"' },
  { value: 'restaurant', label: 'Food', icon: Utensils, query: 'amenity~"restaurant|cafe|food_court"' },
  { value: 'historic', label: 'Historic', icon: Landmark, query: 'historic~"."' },
  { value: 'fuel', label: 'Fuel', icon: Fuel, query: 'amenity~"fuel"' },
  { value: 'hotel', label: 'Stay', icon: Building2, query: 'tourism~"hotel|guest_house|resort"' },
];

export default function NearbyExplorerModal({ isOpen, onClose, latLon, destination, onAddToTrip }) {
  const [mode, setMode] = useState('tourist_attraction');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [latLonState, setLatLonState] = useState(latLon || null);

  // Universal location logic - kisi bhi city ke liye
  useEffect(() => {
    async function resolveLocation() {
      if (!isOpen) return;
      if (latLon) {
        setLatLonState(latLon);
        return;
      }

      // 1. Browser location try karo
      navigator.geolocation.getCurrentPosition(
        (pos) => setLatLonState({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        async () => {
          // 2. Deny hua toh destination ko geocode karo
          if (destination) {
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}`);
              const data = await res.json();
              if (data[0]) {
                setLatLonState({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
                return;
              }
            } catch (e) {
              console.error(e);
            }
          }
          // 3. Fallback - Panjim
          setLatLonState({ lat: 15.4909, lng: 73.8278 });
        }
      );
    }
    resolveLocation();
  }, [isOpen, latLon, destination]);

  const activeLatLon = latLon || latLonState;

  const fetchSuggestions = async (selectedMode) => {
    if (!activeLatLon) return;
    setMode(selectedMode);
    setLoading(true);
    setResults([]);
    try {
      const selected = MODES.find(x => x.value === selectedMode);
      const q = `[out:json][timeout:25];(node[${selected.query}](around:5000,${activeLatLon.lat},${activeLatLon.lon}););out 20;`;
      const res = await fetch('https://overpass.kumi.systems/api/interpreter', {
        method: 'POST',
        body: 'data=' + encodeURIComponent(q),
      });
      const data = await res.json();
      const mapped = (data.elements || []).map(el => ({
        name: el.tags?.name || 'Unnamed place',
        vicinity: el.tags?.tourism || el.tags?.amenity || el.tags?.historic || '',
        place_id: el.id.toString(),
        geometry: { location: { lat: el.lat, lng: el.lon } }
      }));
      setResults(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeLatLon) fetchSuggestions(mode);
  }, [isOpen, activeLatLon]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="font-bold flex gap-2"><MapPin className="w-5 h-5" /> Nearby in {destination || 'your area'}</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="p-4 flex gap-2 overflow-x-auto">
          {MODES.map((item) => {
            const ItemIcon = item.icon;
            return (
              <button
                key={item.value}
                onClick={() => fetchSuggestions(item.value)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${mode===item.value?'bg-teal-800 text-white':'bg-teal-50 text-teal-700'}`}
              >
                <ItemIcon className="w-3.5 h-3.5" />{item.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>}
          {!loading && results.map(r => (
            <div key={r.place_id} className="border p-3 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold text-sm">{r.name}</div>
                <div className="text-xs text-gray-500">{r.vicinity}</div>
              </div>
              <button onClick={() => onAddToTrip && onAddToTrip(r)} className="bg-teal-700 text-white px-3 py-1.5 rounded-full text-xs">Add</button>
            </div>
          ))}
          {!loading && results.length === 0 && <div className="text-center text-sm text-gray-400 py-10">No places found nearby</div>}
        </div>
      </div>
    </div>
  );
}