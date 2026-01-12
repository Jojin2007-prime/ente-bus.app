import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Navigation, Loader2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ CUSTOM BUS LOGO COMPONENT
const BusLogo = () => {
  return (
    <svg 
      width="31.87" 
      height="28.4" 
      viewBox="0 0 100 80" 
      xmlns="http://www.w3.org/2000/svg"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="busGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#1e3a8a', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#9333ea', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path d="M -10 75 Q 50 55 110 80" fill="none" stroke="#1f2937" strokeWidth="6" strokeLinecap="round" />
      <path d="M -10 75 Q 50 55 110 80" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeDasharray="10,5" />
      <path d="M 10 30 L 80 20 Q 95 18 95 40 L 95 55 Q 95 65 85 65 L 15 65 Q 5 65 5 55 L 5 40 Q 5 30 10 30 Z" fill="url(#busGradient)" stroke="white" strokeWidth="1" />
      <path d="M 15 35 L 50 30 L 50 45 L 15 48 Z" fill="#e0f2fe" opacity="0.8" />
      <path d="M 55 29 L 85 26 Q 90 26 90 40 L 90 45 L 55 45 Z" fill="#e0f2fe" opacity="0.8" />
      <circle cx="25" cy="65" r="6" fill="#1f2937" stroke="gray" strokeWidth="1" />
      <circle cx="75" cy="65" r="6" fill="#1f2937" stroke="gray" strokeWidth="1" />
    </svg>
  );
};

export default function SearchBuses() {
  const [search, setSearch] = useState({ from: '', to: '', date: '' });
  const [locations, setLocations] = useState({ from: [], to: [] });
  const [suggestions, setSuggestions] = useState({ from: [], to: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = 'https://ente-bus-app-api.onrender.com';

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

    // Navigate to Results page with query params
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
            Select your route and departure date.
          </p>

          <form onSubmit={handleSearch} className="mt-8 md:mt-10 space-y-4 md:space-y-6">
            <InputBox
              icon={<MapPin className="text-indigo-500" />}
              placeholder="Origin (From)"
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
              placeholder="Destination (To)"
              value={search.to}
              suggestions={suggestions.to}
              onChange={v => handleInputChange('to', v)}
              onSelect={v => {
                setSearch(s => ({ ...s, to: v }));
                setSuggestions(s => ({ ...s, to: [] }));
              }}
            />

            {/* DATE INPUT FIELD */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Journey Date (DD/MM/YYYY)</label>
              <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-transparent focus-within:border-indigo-500/50 transition-all">
                <Calendar className="text-emerald-500" size={20} />
                <input
                  type="date"
                  className="bg-transparent w-full outline-none font-bold text-slate-900 dark:text-white [color-scheme:dark] cursor-pointer"
                  value={search.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setSearch({ ...search, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 md:py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-lg shadow-indigo-500/20 transition active:scale-95"
            >
              Search Routes
            </button>
          </form>
        </div>

        {/* RIGHT SECTION (BLUE BOX) */}
        <div className="w-full md:w-2/5 bg-indigo-950 p-10 md:p-12 text-white flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/5 relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          
          <div className="mb-4 md:mb-6 relative z-10">
            <BusLogo />
          </div>
          <h3 className="text-2xl md:text-3xl font-black leading-snug relative z-10 uppercase tracking-tighter">
            Smart <br className="hidden md:block" /> Travel Tool
          </h3>
          <p className="text-indigo-300 mt-4 text-xs md:text-sm font-medium relative z-10 leading-relaxed">
            Real-time seat availability and secure payments with Razorpay integration.
          </p>
          
          <div className="mt-10 flex gap-2 relative z-10">
             <div className="w-10 h-1 bg-indigo-500 rounded-full" />
             <div className="w-4 h-1 bg-indigo-800 rounded-full" />
             <div className="w-4 h-1 bg-indigo-800 rounded-full" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InputBox({ icon, placeholder, value, onChange, suggestions, onSelect }) {
  return (
    <div className="relative group">
      <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-transparent focus-within:border-indigo-500/50 transition-all">
        {icon}
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent w-full outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-500 placeholder:font-medium"
        />
      </div>

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute z-50 w-full bg-white dark:bg-slate-800 mt-2 rounded-xl overflow-hidden shadow-2xl border border-white/10"
          >
            {suggestions.map(s => (
              <li
                key={s}
                onClick={() => onSelect(s)}
                className="px-6 py-4 cursor-pointer hover:bg-indigo-600 hover:text-white transition font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-white/5 last:border-none flex items-center justify-between group/item"
              >
                {s}
                <Search size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}