import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowRight, Tag, Clock } from 'lucide-react';

// ✅ YOUR CUSTOM BUS LOGO COMPONENT
const CustomBusLogo = () => {
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
      <path
        d="M -10 75 Q 50 55 110 80"
        fill="none"
        stroke="#1f2937"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M -10 75 Q 50 55 110 80"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="10,5"
      />
      <path
        d="M 10 30 L 80 20 Q 95 18 95 40 L 95 55 Q 95 65 85 65 L 15 65 Q 5 65 5 55 L 5 40 Q 5 30 10 30 Z"
        fill="url(#busGradient)"
        stroke="white"
        strokeWidth="1"
      />
      <path d="M 15 35 L 50 30 L 50 45 L 15 48 Z" fill="#e0f2fe" opacity="0.8" />
      <path d="M 55 29 L 85 26 Q 90 26 90 40 L 90 45 L 55 45 Z" fill="#e0f2fe" opacity="0.8" />
      <circle cx="25" cy="65" r="6" fill="#1f2937" stroke="gray" strokeWidth="1" />
      <circle cx="75" cy="65" r="6" fill="#1f2937" stroke="gray" strokeWidth="1" />
    </svg>
  );
};

export default function TicketPrices() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Centralized URL
  const API_URL = "https://ente-bus-app-api.onrender.com";

  // Helper: 12H Time Format
  const formatTime = (time24) => {
    if (!time24) return "";
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
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="text-center mb-12 flex flex-col items-center">
          <div className="mb-4">
            <CustomBusLogo />
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4 transition-colors">
            Current Ticket Prices
          </h1>
          <p className="text-gray-500 dark:text-slate-400 transition-colors">
            Transparent pricing for all our active routes.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 dark:text-slate-500 font-medium">Loading rates...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buses.map((bus, index) => (
              <motion.div 
                key={bus._id} 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 p-2 rounded-lg transition-colors">
                    <Tag size={20} />
                  </div>
                  <span className="text-3xl font-black text-gray-900 dark:text-white transition-colors">
                    ₹{bus.price}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 transition-colors">
                  {bus.name}
                </h3>
                
                <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 font-medium mb-4 transition-colors">
                  {bus.from} <ArrowRight size={16} /> {bus.to}
                </div>
                
                <div className="pt-4 border-t border-gray-50 dark:border-slate-700 flex justify-between items-center text-sm transition-colors">
                  <span className="text-gray-400 dark:text-slate-500 font-medium">Daily Departure</span>
                  <div className="flex items-center gap-1 font-bold text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-700/50 px-2 py-1 rounded transition-colors">
                      <Clock size={14} className="text-orange-500"/>
                      {formatTime(bus.departureTime)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}