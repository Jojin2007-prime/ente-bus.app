import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Clock, MapPin, Phone, User, FileText, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

// ✅ ADDED YOUR CUSTOM BUS LOGO COMPONENT
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

export default function BusSchedule() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = "https://ente-bus-app-api.onrender.com";

  const user = JSON.parse(localStorage.getItem('user'));
  const admin = localStorage.getItem('admin');
  const isLoggedIn = !!(user || admin);

  const formatTime = (time24) => {
    if (!time24) return "--:--";
    const [hours, minutes] = time24.split(':');
    const period = +hours >= 12 ? 'PM' : 'AM';
    const hours12 = (+hours % 12) || 12;
    return `${hours12}:${minutes} ${period}`;
  };

  useEffect(() => {
    axios.get(`${API_URL}/api/buses`)
      .then(res => {
        setBuses(res.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 md:p-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          {/* ✅ REPLACED ICON WITH NEW BUS LOGO COMPONENT */}
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4 flex justify-center items-center gap-3 transition-colors">
            <BusLogo /> Bus Schedule
          </h1>
          <p className="text-gray-500 dark:text-slate-400 transition-colors">View fleet details and daily departure times.</p>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 dark:text-slate-500">Loading schedule...</p>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
              
              {/* Table Header */}
              <div className="grid grid-cols-4 bg-gray-100 dark:bg-slate-950 p-4 font-bold text-gray-500 dark:text-slate-400 uppercase text-sm transition-colors">
                <div>Bus Details</div>
                <div>Route</div>
                <div>Departure Time</div>
                <div>Driver Info</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                {buses.map((bus, index) => (
                  <motion.div 
                    key={bus._id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: index * 0.05 }} 
                    className="grid grid-cols-1 md:grid-cols-4 p-4 items-center gap-4 md:gap-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    {/* Col 1: Bus Name & Reg */}
                    <div>
                      <div className="font-bold text-lg text-indigo-900 dark:text-indigo-400">{bus.name}</div>
                      <div className="inline-flex items-center gap-1 text-xs font-mono bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-1 rounded mt-1 border border-gray-200 dark:border-slate-600 transition-colors">
                        <FileText size={10} /> {bus.registrationNumber || 'N/A'}
                      </div>
                    </div>

                    {/* Col 2: Route */}
                    <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300 font-medium">
                      <MapPin size={16} className="text-gray-400 dark:text-slate-500" />
                      {bus.from} ➝ {bus.to}
                    </div>

                    {/* Col 3: Departure Time */}
                    <div>
                      <div className="flex items-center gap-2 text-gray-800 dark:text-white font-bold text-lg">
                        <Clock size={18} className="text-orange-500" /> 
                        {formatTime(bus.departureTime)}
                      </div>
                    </div>

                    {/* Col 4: Conditional Driver Info */}
                    <div className="transition-colors">
                      {isLoggedIn ? (
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-100 dark:border-green-800/30">
                          <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-slate-200">
                            <User size={14} className="text-indigo-500 dark:text-indigo-400"/> {bus.driverName || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mt-1">
                            <Phone size={12}/> {bus.driverContact || '--'}
                          </div>
                        </div>
                      ) : (
                        <Link to="/login-options" className="flex flex-col items-center justify-center p-2 bg-gray-50 dark:bg-slate-900/50 border border-dashed border-gray-300 dark:border-slate-700 rounded-lg group hover:border-indigo-400 transition-all">
                          <Lock size={14} className="text-gray-400 group-hover:text-indigo-500" />
                          <span className="text-[10px] uppercase tracking-tighter font-bold text-gray-400 group-hover:text-indigo-500 mt-1">
                            Login to view
                          </span>
                        </Link>
                      )}
                    </div>

                  </motion.div>
                ))}
              </div>
          </div>
        )}
      </div>
    </div>
  );
}