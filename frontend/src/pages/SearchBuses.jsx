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

    const fetchRoutes = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/buses`);
        const buses = res.data;

        setLocations({
          from: [...new Set(buses.map(b => b.from))].sort(),
          to: [...new Set(buses.map(b => b.to))].sort(),
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setSearch(prev => ({ ...prev, [field]: value }));
    setSuggestions(prev => ({
      ...prev,
      [field]: value
        ? locations[field].filter(l =>
            l.toLowerCase().startsWith(value.toLowerCase())
          )
        : [],
    }));
  };

  const handleSearch = e => {
    e.preventDefault();
    if (!search.from || !search.to || !search.date) return;

    navigate(
      `/buses?from=${encodeURIComponent(search.from)}&to=${encodeURIComponent(
        search.to
      )}&date=${search.date}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 font-[Poppins]">
        <Loader2 className="animate-spin text-indigo-500 mb-3" size={46} />
        <p className="text-indigo-400 font-semibold tracking-wide">Syncing Fleet...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-6 font-[Poppins]">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] shadow-2xl max-w-6xl w-full flex flex-col md:flex-row overflow-hidden"
      >
        {/* LEFT SECTION */}
        <div className="w-full md:w-3/5 p-8 md:p-16">
          <h1 className="text-4xl md:text-[3.2rem] font-extrabold leading-tight text-slate-900 dark:text-white">
            Bus <br />
            <span className="text-indigo-600">Schedule</span>
          </h1>

          <p className="text-slate-400 font-medium mt-4 tracking-wide text-sm md:text-base">
            View fleet details and daily departure times.
          </p>

          <form onSubmit={handleSearch} className="mt-8 md:mt-10 space-y-4 md:space-y-6">
            <InputBox
              icon={<MapPin className="text-indigo-500" />}
              placeholder="Origin"
              value={search.from}
              suggestions={suggestions.from}
              onChange={v => handleInputChange('from', v)}
              onSelect={v => {
                setSearch(s => ({ ...s, from: v }));
                setSuggestions(s => ({ ...s, from: [] }));
              }}
            />

            <InputBox
              icon={<Navigation className="text-rose-500" />}
              placeholder="Destination"
              value={search.to}
              suggestions={suggestions.to}
              onChange={v => handleInputChange('to', v)}
              onSelect={v => {
                setSearch(s => ({ ...s, to: v }));
                setSuggestions(s => ({ ...s, to: [] }));
              }}
            />

            <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 p-4 md:p-5 rounded-2xl">
              <Search className="text-emerald-500" />
              <input
                type="date"
                className="bg-transparent w-full outline-none font-medium text-slate-900 dark:text-white [color-scheme:dark]"
                value={search.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setSearch({ ...search, date: e.target.value })}
                required
              />
            </div>

            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 md:py-6 rounded-2xl font-semibold text-lg tracking-wide transition active:scale-95">
              Search Routes
            </button>
          </form>
        </div>

        {/* RIGHT SECTION (BLUE BOX) */}
        <div className="w-full md:w-2/5 bg-indigo-950 p-10 md:p-12 text-white flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/5">
          <Bus size={36} className="mb-4 md:mb-6 opacity-80" />
          <h3 className="text-2xl md:text-3xl font-bold leading-snug">
            Smart <br className="hidden md:block" /> Travel Tool
          </h3>
          <p className="text-indigo-300 mt-4 text-xs md:text-sm font-medium">
            Dynamic routing based on active fleet availability.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function InputBox({ icon, placeholder, value, onChange, suggestions, onSelect }) {
  return (
    <div className="relative">
      <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-4 md:p-5 rounded-2xl">
        {icon}
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent w-full outline-none font-medium text-slate-900 dark:text-white"
        />
      </div>

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute z-10 w-full bg-white dark:bg-slate-800 mt-2 rounded-xl overflow-hidden shadow-xl"
          >
            {suggestions.map(s => (
              <li
                key={s}
                onClick={() => onSelect(s)}
                className="px-5 py-3 cursor-pointer hover:bg-indigo-600 hover:text-white transition font-medium"
              >
                {s}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}