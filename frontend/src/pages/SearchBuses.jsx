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

        const uniqueFrom = [...new Set(allBuses.map(bus => bus.from))].sort();
        const uniqueTo = [...new Set(allBuses.map(bus => bus.to))].sort();

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
    if (value.length > 0) {
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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
        <p className="font-medium text-indigo-500 animate-pulse">
          Syncing Fleet...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors duration-500">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl overflow-hidden max-w-6xl w-full flex flex-col md:flex-row min-h-[600px] border border-transparent dark:border-slate-700"
      >
        {/* LEFT */}
        <div className="md:w-3/5 p-10 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
              Find Your <br />
              <span className="text-indigo-600 dark:text-indigo-400">
                Journey.
              </span>
            </h1>
            <p className="text-gray-400 dark:text-slate-500 font-medium text-sm mt-4">
              Real-Time Database Search
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* FROM */}
              <div className="relative">
                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-700 flex items-center gap-3 shadow-inner focus-within:ring-2 ring-indigo-500">
                  <MapPin className="text-indigo-500" size={20} />
                  <input
                    type="text"
                    placeholder="Origin"
                    className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600"
                    value={search.from}
                    onChange={e => handleInputChange('from', e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>

                <AnimatePresence>
                  {suggestions.from.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute z-20 w-full bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-2xl rounded-2xl mt-2 overflow-hidden"
                    >
                      {suggestions.from.map(loc => (
                        <li
                          key={loc}
                          onClick={() => {
                            setSearch({ ...search, from: loc });
                            setSuggestions({ ...suggestions, from: [] });
                          }}
                          className="p-4 cursor-pointer text-gray-700 dark:text-gray-200 font-medium hover:bg-indigo-600 hover:text-white transition"
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
                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-700 flex items-center gap-3 shadow-inner focus-within:ring-2 ring-indigo-500">
                  <Navigation className="text-rose-500" size={20} />
                  <input
                    type="text"
                    placeholder="Destination"
                    className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600"
                    value={search.to}
                    onChange={e => handleInputChange('to', e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>

                <AnimatePresence>
                  {suggestions.to.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute z-20 w-full bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-2xl rounded-2xl mt-2 overflow-hidden"
                    >
                      {suggestions.to.map(loc => (
                        <li
                          key={loc}
                          onClick={() => {
                            setSearch({ ...search, to: loc });
                            setSuggestions({ ...suggestions, to: [] });
                          }}
                          className="p-4 cursor-pointer text-gray-700 dark:text-gray-200 font-medium hover:bg-indigo-600 hover:text-white transition"
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
            <div className="bg-gray-50 dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-700 flex items-center gap-4 shadow-inner focus-within:ring-2 ring-indigo-500">
              <Search className="text-emerald-500" size={24} />
              <input
                type="date"
                className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white [color-scheme:dark]"
                value={search.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e =>
                  setSearch({ ...search, date: e.target.value })
                }
                required
              />
            </div>

            {/* BUTTON */}
            <button className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-semibold text-xl flex justify-center items-center gap-3 hover:bg-indigo-700 transition shadow-xl shadow-indigo-600/20 active:scale-95">
              <Search size={26} /> Search Routes
            </button>
          </form>
        </div>

        {/* RIGHT */}
        <div className="md:w-2/5 bg-indigo-900 dark:bg-slate-950 p-12 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="bg-white/10 w-16 h-16 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-xl">
              <Bus size={32} />
            </div>
            <h3 className="text-4xl font-bold mb-4 leading-tight">
              Smart <br /> Travel Tool
            </h3>
            <p className="text-indigo-200 dark:text-slate-400 font-medium text-sm">
              EnteBus dynamically maps your destination based on active fleet
              deployments.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
