import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bus,
  ArrowLeft,
  Clock,
  IndianRupee,
  Loader,
  ChevronRight,
  AlertCircle,
  MapPin,
  Ticket,
  Shield,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CalendarClock = ({ size, className }) => (
  <svg 
    width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}
  >
    <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h5" />
    <path d="M17.5 17.5 16 16.25V14" />
    <circle cx="16" cy="16" r="6" />
  </svg>
);

export default function BusResults() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const API_URL = "https://ente-bus-app-api.onrender.com";

  const queryParams = new URLSearchParams(location.search);
  const from = queryParams.get('from');
  const to = queryParams.get('to');
  const date = queryParams.get('date');

  useEffect(() => {
    const fetchBuses = async () => {
      if (!from || !to) {
        setError('Missing route information. Please restart your search.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(
          `${API_URL}/api/buses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        );
        setBuses(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('API Fetch Error:', err);
        setError('Unable to connect to the fleet database.');
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, [from, to]);

  const handleSelectBus = (busId) => {
    navigate(`/seats/${busId}?date=${date || new Date().toISOString().split('T')[0]}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center">
        <Loader className="animate-spin text-indigo-500 mb-4" size={48} />
        <p className="text-indigo-500 font-bold uppercase tracking-[0.3em] text-[10px]">
          Scanning Available Fleet...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 md:p-10 pb-28 font-sans transition-colors duration-500">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col gap-8 mb-12">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 hover:scale-105 transition-all"
            >
              <ArrowLeft size={20} className="dark:text-white" />
            </button>
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-extrabold dark:text-white uppercase tracking-tighter flex items-center justify-center gap-3">
                <Bus size={28} className="text-indigo-600"/> Available Trips
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-2">Fleet Selection Gateway</p>
            </div>
            <div className="w-12"></div>
          </div>

          {/* SEARCH SUMMARY BAR */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-2xl text-indigo-600">
                <MapPin size={24}/>
              </div>
              <div>
                <p className="text-[9px] uppercase text-slate-400 tracking-widest font-bold mb-1">Route</p>
                <p className="text-sm font-extrabold dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <span className="capitalize">{from?.toLowerCase()}</span> 
                  <ArrowRight size={14} className="opacity-30" /> 
                  <span className="capitalize">{to?.toLowerCase()}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-2xl text-emerald-600">
                <CalendarClock size={24}/>
              </div>
              <div>
                <p className="text-[9px] uppercase text-slate-400 tracking-widest font-bold mb-1">Schedule</p>
                <p className="text-sm font-extrabold dark:text-white uppercase tracking-tight">{date || 'Flexible Date'}</p>
              </div>
            </div>

            <button 
              onClick={() => navigate('/')} 
              className="px-8 py-3 bg-slate-50 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 text-[10px] uppercase font-bold rounded-xl hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 tracking-widest"
            >
              Modify Search
            </button>
          </div>
        </header>

        {/* ERROR STATE */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-10 rounded-[3rem] text-center shadow-xl">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <p className="text-red-600 font-bold uppercase text-xs tracking-widest leading-relaxed">{error}</p>
          </div>
        )}

        {/* BUS LISTING */}
        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {buses.length > 0 ? (
              buses.map((bus, index) => (
                <motion.div
                  key={bus._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 flex flex-col lg:flex-row justify-between items-center hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all group relative overflow-hidden"
                >
                  <div className="flex-1 w-full text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                        <span className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[9px] uppercase tracking-[0.2em] font-bold border border-emerald-100 dark:border-emerald-900/30">
                          Active Service
                        </span>
                    </div>
                    
                    <h3 className="text-2xl md:text-3xl font-extrabold dark:text-white uppercase tracking-tighter mb-6 group-hover:text-indigo-600 transition-colors">
                      {bus.name}
                    </h3>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 text-[11px] text-slate-400 uppercase tracking-widest font-bold">
                       <span className="flex items-center gap-2.5">
                          <Clock size={16} className="text-indigo-500"/> {bus.departureTime}
                       </span>
                       <span className="flex items-center gap-2.5">
                          <Shield size={16} className="text-indigo-500"/> {bus.registrationNumber}
                       </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-10 mt-10 lg:mt-0 pt-10 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-50 dark:border-slate-700/50 w-full lg:w-auto lg:pl-12">
                    <div className="text-center lg:text-right min-w-[120px]">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">Price Per Seat</p>
                      <div className="flex items-center justify-center lg:justify-end text-4xl font-extrabold dark:text-white tracking-tighter">
                        <IndianRupee size={28} className="text-indigo-600 mr-1" />
                        {bus.price}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleSelectBus(bus._id)}
                      className="w-full sm:w-auto bg-slate-900 dark:bg-indigo-600 text-white px-12 py-6 rounded-[2rem] text-xs font-bold uppercase tracking-[0.2em] shadow-2xl hover:bg-black dark:hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      Secure Seats <ChevronRight size={18}/>
                    </button>
                  </div>
                </motion.div>
              ))
            ) : !loading && !error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-white dark:bg-slate-800 rounded-[3.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700 shadow-sm">
                <Bus size={80} className="mx-auto text-slate-200 dark:text-slate-700 mb-6 opacity-40" />
                <h2 className="text-sm font-bold uppercase text-slate-400 tracking-[0.3em]">No fleet matches found</h2>
                <button onClick={() => navigate('/')} className="mt-8 text-indigo-600 font-bold text-[10px] uppercase tracking-widest border-b-2 border-indigo-600 pb-1 hover:text-indigo-500 hover:border-indigo-500 transition-all">Modify Search Parameters</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}