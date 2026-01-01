import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bus, ArrowLeft, Clock, IndianRupee, Loader, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BusResults() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract parameters from URL
  const queryParams = new URLSearchParams(location.search);
  const from = queryParams.get('from');
  const to = queryParams.get('to');
  const date = queryParams.get('date');

  useEffect(() => {
    const fetchBuses = async () => {
      // Validate parameters before making API call
      if (!from || !to) {
        setError("Missing route information. Please restart your search.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // Correct query passing for your server.js logic
        const res = await axios.get(`https://entebus-api.onrender.com/api/buses?from=${from}&to=${to}`);
        setBuses(res.data);
      } catch (err) {
        console.error("API Fetch Error:", err);
        setError("Unable to connect to the fleet database. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, [from, to]);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center">
      <Loader className="animate-spin text-indigo-500 mb-4" size={48} />
      <p className="font-black italic uppercase text-indigo-500 tracking-[0.3em] animate-pulse">Scanning Fleet...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 md:p-10 transition-colors duration-300 pb-20">
      <div className="max-w-5xl mx-auto">
        
        {/* --- BRANDED HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate('/search')} 
              className="p-3 bg-white dark:bg-slate-800 text-gray-700 dark:text-white rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white leading-none">
                Available Fleet
              </h1>
              {from && to && (
                <div className="flex items-center gap-2 mt-3 font-black italic uppercase tracking-tighter text-sm text-indigo-500">
                  <span>{from}</span> 
                  <ChevronRight size={14} className="text-gray-400" /> 
                  <span>{to}</span>
                  <span className="ml-3 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px]">| {date || 'Today'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- ERROR STATE --- */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2rem] text-center mb-10">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <p className="text-red-500 font-black italic uppercase tracking-tighter">{error}</p>
            <button onClick={() => navigate('/search')} className="mt-4 text-indigo-500 font-bold uppercase text-xs underline">Go Back</button>
          </div>
        )}

        {/* --- BUS LIST --- */}
        <div className="grid gap-8">
          <AnimatePresence>
            {!error && buses.length > 0 ? (
              buses.map((bus, index) => (
                <motion.div 
                  key={bus._id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border border-gray-50 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center group hover:shadow-2xl transition-all duration-300"
                >
                  <div className="text-center md:text-left">
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Service Verified
                    </span>
                    <h3 className="text-4xl font-black italic uppercase text-gray-900 dark:text-white mt-3 group-hover:text-indigo-600 transition-colors leading-none">
                      {bus.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-4 text-gray-500 dark:text-slate-400 font-black italic uppercase text-xs justify-center md:justify-start">
                      <Clock size={16} className="text-emerald-500" /> 
                      Departs: {bus.departureTime}
                    </div>
                  </div>

                  <div className="text-center md:text-right mt-8 md:mt-0 md:pl-12 md:border-l border-gray-50 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Single Fare</p>
                    <div className="flex items-center gap-1 text-5xl font-black italic text-gray-900 dark:text-white mb-8 tracking-tighter justify-center md:justify-end">
                      <IndianRupee size={32} className="text-green-600" /> {bus.price}
                    </div>
                    {/* ✅ Matches App.js: Path is /seats/:busId */}
                    <button 
                      onClick={() => navigate(`/seats/${bus._id}?date=${date}`)} 
                      className="bg-slate-900 dark:bg-indigo-600 px-10 py-5 rounded-2xl text-white font-black italic uppercase text-lg shadow-xl shadow-indigo-600/20 active:scale-95 transition-all hover:bg-black dark:hover:bg-indigo-700"
                    >
                      Select Seats
                    </button>
                  </div>
                </motion.div>
              ))
            ) : !error && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-center py-24 bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-slate-700"
              >
                <Bus size={64} className="mx-auto text-slate-300 dark:text-slate-700 mb-6 opacity-20" />
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-400">No Routes Found</h2>
                <p className="text-[10px] font-bold text-gray-300 dark:text-slate-600 uppercase tracking-widest mt-2">Try a different route or check back later</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}