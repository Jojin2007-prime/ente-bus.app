import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bus, QrCode, Clock, CreditCard, Star, ArrowRight } from 'lucide-react';

import busImage from '../assets/bus.png';

export default function Landing() {
  const navigate = useNavigate();

  const handleBookTicket = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    user ? navigate('/search') : navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">

      {/* ================= HERO ================= */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white overflow-hidden">

        {/* Background shapes */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 py-20 md:py-32 relative z-10 flex flex-col lg:flex-row items-center gap-12">

          {/* -------- LEFT CONTENT -------- */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-1/2 space-y-8 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 text-indigo-100 text-sm font-bold backdrop-blur-sm">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              Rated #1 Bus Booking App in Kerala
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
              Journey with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                Confidence.
              </span>
            </h1>

            <p className="text-xl text-indigo-100 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Experience the smoothest travel across God's Own Country.
              Real-time seat selection, secure payments, and instant tickets.
            </p>

            <button
              onClick={handleBookTicket}
              className="bg-yellow-400 text-indigo-900 px-8 py-4 rounded-xl font-black text-lg hover:bg-yellow-300 hover:scale-105 transition shadow-xl inline-flex items-center gap-2"
            >
              <Bus size={24} />
              Book Ticket Now
            </button>
          </motion.div>

          {/* -------- RIGHT IMAGE (FIXED) -------- */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:w-1/2 flex justify-center relative"
          >
            <div className="relative">

              {/* Floating status card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="hidden md:flex bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl absolute -top-6 -left-6 z-20 items-center gap-3"
              >
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600 dark:text-green-400">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">
                    Status
                  </p>
                  <p className="text-gray-900 dark:text-white font-bold">
                    Confirmed
                  </p>
                </div>
              </motion.div>

              {/* ✅ IMAGE + CURVE PERFECTLY MATCHED */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-[2.5rem] p-4 shadow-2xl">
                <img
                  src={busImage}
                  alt="Luxury Bus"
                  className="w-[320px] md:w-[480px] object-contain rounded-[2rem]"
                />
              </div>

            </div>
          </motion.div>
        </div>
      </div>

      {/* ================= FEATURES ================= */}
      <div className="py-24 bg-gray-50 dark:bg-slate-900 transition-colors">
        <div className="container mx-auto px-6">

          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
              Why Book With Us?
            </h2>
            <p className="text-gray-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              We simplify your travel experience with cutting-edge technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[QrCode, Clock, CreditCard].map((Icon, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-slate-700"
              >
                <div className="w-16 h-16 bg-indigo-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                  <Icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {i === 0 ? 'QR Ticket Verification' : i === 1 ? 'On-Time Guarantee' : 'Secure Payments'}
                </h3>
                <p className="text-gray-500 dark:text-slate-400">
                  {i === 0
                    ? 'Scan your QR code and board instantly.'
                    : i === 1
                    ? 'Departures strictly follow schedules.'
                    : 'Encrypted and safe transactions.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="bg-gray-900 dark:bg-slate-950 py-12 text-center text-white">
        <h2 className="text-2xl font-bold mb-6">
          Ready to start your journey?
        </h2>
        <button
          onClick={handleBookTicket}
          className="bg-indigo-600 px-8 py-3 rounded-full font-bold hover:bg-indigo-500 transition inline-flex items-center gap-2"
        >
          Book Your Seat <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

function CheckCircle({ size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
