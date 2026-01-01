import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Navigation, Loader2, Bus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchBuses() {
  const [search, setSearch] = useState({ from: '', to: '', date: '' });
  const [locations, setLocations] = useState({ from: [], to: [] });
  const [suggestions, setSuggestions] = useState({ from: [], to: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = 'https://entebus-api.onrender.com';

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) navigate('/');

    const fetchLiveRoutes = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/buses`);
        const allBuses = res.data;

        const uniqueFrom = [...new Set(allBuses.map(b => b.from))].sort();
        const uniqueTo = [...new Set(allBuses.map(b => b.to))].sort();

        setLocations({ from: uniqueFrom, to: uniqueTo });
      } catch (err) {
        console.error('Route Sync Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveRoutes();
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setSearch({ ...search, [field]: value });
    if (value) {
      const filtered = locations[field].filter(loc =>
        loc.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions({ ...suggestions, [field]: filtered });
    } else {
      setSuggestions({ ...suggestions, [field]: [] });
    }
  };

  const handleSearch = e => {
    e.preventDefault();
    if (!search.from || !search.to || !search.date) {
      alert('Please specify your route and travel date.');
      return;
    }
    navigate(
      `/buses?from=${encodeURIComponent(search.from)}&to=${encodeURIComponent(
        search.to
      )}&date=${search.date}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
        <p className="font-semibold text-indigo-400 animate-pulse">
          Syncing fleet…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-slate-900 transition-colors">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-6xl w-full flex flex-col md:flex-row overflow-hidden border dark:border-slate-700"
      >
        {/* LEFT */}
        <div className="md:w-3/5 p-10 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              Find your <span className="text-indigo-600 dark:text-indigo-400">journey</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-3">
              Real-time database search
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* FROM */}
              <div className="relative">
                <div className="input-wrapper">
                  <MapPin className="text-indigo-500" size={18} />
                  <input
                    type="text"
                    placeholder="From"
                    className="input"
                    value={search.from}
                    onChange={e => handleInputChange('from', e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>

                <AnimatePresence>
                  {suggestions.from.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="suggestions"
                    >
                      {suggestions.from.map(loc => (
                        <li
                          key={loc}
                          onClick={() => {
                            setSearch({ ...search, from: loc });
                            setSuggestions({ ...suggestions, from: [] });
                          }}
                        >
                          {loc}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              {/* TO */}
              <div className="relative">
                <div className="input-wrapper">
                  <Navigation className="text-rose-500" size={18} />
                  <input
                    type="text"
                    placeholder="To"
                    className="input"
                    value={search.to}
                    onChange={e => handleInputChange('to', e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>

                <AnimatePresence>
                  {suggestions.to.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="suggestions"
                    >
                      {suggestions.to.map(loc => (
                        <li
                          key={loc}
                          onClick={() => {
                            setSearch({ ...search, to: loc });
                            setSuggestions({ ...suggestions, to: [] });
                          }}
                        >
                          {loc}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* DATE */}
            <div className="input-wrapper">
              <Search className="text-emerald-500" size={18} />
              <input
                type="date"
                className="input"
                min={new Date().toISOString().split('T')[0]}
                value={search.date}
                onChange={e => setSearch({ ...search, date: e.target.value })}
                required
              />
            </div>

            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-semibold transition active:scale-95">
              Search routes
            </button>
          </form>
        </div>

        {/* RIGHT */}
        <div className="md:w-2/5 bg-indigo-900 dark:bg-slate-950 p-12 text-white flex flex-col justify-center">
          <div className="mb-6 w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <Bus size={28} />
          </div>
          <h3 className="text-3xl font-bold mb-4">Smart travel tool</h3>
          <p className="text-indigo-200 dark:text-slate-400 text-sm leading-relaxed">
            EnteBus maps destinations using live fleet data so you can travel
            smarter and faster.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
