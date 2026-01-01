import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Navigation, Loader2, Bus as BusIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchBuses() {
  const [search, setSearch] = useState({ from: '', to: '' });
  const [locations, setLocations] = useState({ from: [], to: [] }); // Dynamic Data from DB
  const [suggestions, setSuggestions] = useState({ from: [], to: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = "https://entebus-api.onrender.com";

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) navigate('/');

    // ✅ LIVE SYNC: Fetch unique locations from your actual bus fleet
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/buses`);
        const allBuses = res.data;

        // Use Set to ensure each city only appears once in the dropdown
        const uniqueFrom = [...new Set(allBuses.map(bus => bus.from))].sort();
        const uniqueTo = [...new Set(allBuses.map(bus => bus.to))].sort();

        setLocations({ from: uniqueFrom, to: uniqueTo });
      } catch (err) {
        console.error("Database Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [navigate]);

  // --- AUTOCOMPLETE LOGIC ---
  const handleInputChange = (field, value) => {
    setSearch({ ...search, [field]: value });
    if (value.length > 0) {
      // Logic: Search specifically for locations that start with the typed letter
      const filtered = locations[field].filter(loc => 
        loc.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions({ ...suggestions, [field]: filtered });
    } else {
      setSuggestions({ ...suggestions, [field]: [] });
    }
  };

  const selectSuggestion = (field, value) => {
    setSearch({ ...search, [field]: value });
    setSuggestions({ ...suggestions, [field]: [] });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.from || !search.to) return alert("Please specify your route.");
    // Navigate to results using standard query parameters
    navigate(`/results?from=${encodeURIComponent(search.from)}&to=${encodeURIComponent(search.to)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
        <p className="font-black italic uppercase tracking-tighter text-indigo-500 tracking-[0.3em] animate-pulse">
          Syncing EnteBus Routes...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors duration-500">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl overflow-hidden max-w-6xl w-full flex flex-col md:flex-row min-h-[600px] border border-transparent dark:border-slate-700 transition-all"
      >
        
        {/* --- FORM SIDE --- */}
        <div className="md:w-3/5 p-10 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white leading-none">
              Find Your <br/><span className="text-indigo-600 dark:text-indigo-400">Journey.</span>
            </h1>
            <p className="text-gray-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-4">
              Real-Time Fleet Discovery
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            
            {/* ORIGIN INPUT */}
            <div className="relative">
              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center gap-3 focus-within:ring-2 ring-indigo-500 transition-all shadow-inner">
                <MapPin className="text-indigo-500" size={20} />
                <input 
                  type="text" 
                  placeholder="Starting City" 
                  className="bg-transparent w-full outline-none font-black italic uppercase tracking-tighter text-gray-900 dark:text-white placeholder-gray-400" 
                  value={search.from}
                  onChange={e => handleInputChange('from', e.target.value)} 
                  required 
                  autoComplete="off"
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
                    {suggestions.from.map((loc) => (
                      <li 
                        key={loc} 
                        onClick={() => selectSuggestion('from', loc)}
                        className="p-4 hover:bg-indigo-600 hover:text-white cursor-pointer text-gray-700 dark:text-gray-200 font-black italic uppercase tracking-tighter border-b last:border-0 dark:border-slate-700 transition-colors"
                      >
                        {loc}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
            
            {/* DESTINATION INPUT */}
            <div className="relative">
              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center gap-3 focus-within:ring-2 ring-indigo-500 transition-all shadow-inner">
                <Navigation className="text-rose-500" size={20} />
                <input 
                  type="text" 
                  placeholder="Destination City" 
                  className="bg-transparent w-full outline-none font-black italic uppercase tracking-tighter text-gray-900 dark:text-white placeholder-gray-400" 
                  value={search.to}
                  onChange={e => handleInputChange('to', e.target.value)} 
                  required 
                  autoComplete="off"
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
                    {suggestions.to.map((loc) => (
                      <li 
                        key={loc} 
                        onClick={() => selectSuggestion('to', loc)}
                        className="p-4 hover:bg-indigo-600 hover:text-white cursor-pointer text-gray-700 dark:text-gray-200 font-black italic uppercase tracking-tighter border-b last:border-0 dark:border-slate-700 transition-colors"
                      >
                        {loc}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            <button className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black italic uppercase tracking-tighter text-2xl flex justify-center items-center gap-3 hover:bg-indigo-700 transition shadow-xl shadow-indigo-600/20 active:scale-95">
              <Search size={28} /> Search Routes
            </button>
          </form>
        </div>

        {/* --- BRANDED SIDE PANEL --- */}
        <div className="md:w-2/5 bg-indigo-900 dark:bg-slate-950 p-12 text-white flex flex-col justify-center relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full opacity-10 blur-3xl translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full opacity-10 blur-3xl -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10">
            <div className="bg-white/10 w-16 h-16 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-xl border border-white/10">
              <BusIcon size={32} className="text-white" />
            </div>
            <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-4 leading-none">Smart <br/>Travel Tool</h3>
            <p className="text-indigo-200 dark:text-slate-400 font-bold text-sm leading-relaxed">
              EnteBus dynamically maps your destination based on active fleet deployments. Select your path and we'll handle the rest.
            </p>
            <div className="mt-8 pt-8 border-t border-indigo-800/50">
              <div className="flex items-center gap-3 text-emerald-400 font-black italic uppercase tracking-widest text-[10px]">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                Live Fleet Link: Active
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}