import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Bus, Calendar, Clock, 
  MapPin, CheckCircle, XCircle, Search, 
  ArrowLeft, Download, UserCheck, ShieldCheck, Printer
} from 'lucide-react';

export default function BusManifest() {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = "https://ente-bus-app-api.onrender.com";

  // Fetch all buses for the dropdown
  useEffect(() => {
    axios.get(`${API_URL}/api/buses`)
      .then(res => setBuses(res.data))
      .catch(err => console.error(err));
  }, []);

  const fetchManifest = async () => {
    if (!selectedBus) return alert("Please select a bus service");
    setLoading(true);
    try {
      // Custom endpoint to get manifest based on busId and date
      const res = await axios.get(`${API_URL}/api/admin/manifest?busId=${selectedBus}&date=${selectedDate}`);
      setPassengers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const printManifest = () => window.print();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-500 p-6 md:p-10 font-sans pb-24">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 no-print">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tighter uppercase flex items-center gap-3">
              Bus Manifest <Users className="text-indigo-500" size={32} />
            </h1>
            <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-[0.3em] font-bold">Passenger Boarding & Load Sheet</p>
          </div>
          <button onClick={printManifest} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 active:scale-95 transition-all">
            <Printer size={24} className="text-indigo-500" />
          </button>
        </header>

        {/* FILTERS SECTION */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-xl border border-gray-100 dark:border-slate-700 mb-10 no-print">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest ml-2">Service Route</label>
              <select 
                value={selectedBus} 
                onChange={(e) => setSelectedBus(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-900 border-none p-5 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-indigo-500/20 text-slate-900 dark:text-white transition-all"
              >
                <option value="">Select Bus</option>
                {buses.map(bus => (
                  <option key={bus._id} value={bus._id}>{bus.name} ({bus.from} - {bus.to})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest ml-2">Travel Date</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-900 border-none p-5 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-indigo-500/20 text-slate-900 dark:text-white transition-all"
              />
            </div>

            <div className="flex items-end">
              <button 
                onClick={fetchManifest}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-extrabold uppercase text-xs tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Search size={18} /> Generate List
              </button>
            </div>
          </div>
        </div>

        {/* PASSENGER TABLE */}
        <AnimatePresence mode="wait">
          {passengers.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-[3.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700">
                      <th className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Seat</th>
                      <th className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Passenger Name</th>
                      <th className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Contact</th>
                      <th className="px-8 py-6 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                    {passengers.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-8 py-6">
                          <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl font-black text-xs">
                            {p.seatNumbers.join(", ")}
                          </span>
                        </td>
                        <td className="px-8 py-6 font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                          {p.customerName}
                        </td>
                        <td className="px-8 py-6 font-bold text-slate-500 dark:text-slate-400 text-sm">
                          {p.customerPhone}
                        </td>
                        <td className="px-8 py-6 text-center">
                          {p.status === 'Boarded' ? (
                            <span className="flex items-center justify-center gap-2 text-[10px] font-extrabold uppercase text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                              <ShieldCheck size={14} /> Boarded
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2 text-[10px] font-extrabold uppercase text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-full border border-amber-100 dark:border-amber-900/30">
                              <Clock size={14} /> Paid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-10 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                <div className="flex gap-10">
                   <div>
                     <p className="text-[9px] font-extrabold uppercase text-slate-400 mb-1">Total Passengers</p>
                     <p className="text-2xl font-black text-slate-900 dark:text-white">{passengers.length}</p>
                   </div>
                   <div>
                     <p className="text-[9px] font-extrabold uppercase text-slate-400 mb-1">Seats Occupied</p>
                     <p className="text-2xl font-black text-indigo-600">{passengers.reduce((acc, curr) => acc + curr.seatNumbers.length, 0)}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-extrabold uppercase text-slate-400 mb-1">Manifest Generated</p>
                   <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{new Date().toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            !loading && (
              <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-[3.5rem] border border-dashed border-gray-200 dark:border-slate-700">
                <Users size={64} className="mx-auto mb-6 text-slate-200 dark:text-slate-700" />
                <p className="font-bold uppercase tracking-[0.2em] text-slate-400 text-sm">No passengers for this trip</p>
              </div>
            )
          )}
        </AnimatePresence>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader className="animate-spin text-indigo-500 mb-4" size={48} />
            <p className="text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">Compiling Manifest...</p>
          </div>
        )}
      </div>
    </div>
  );
}