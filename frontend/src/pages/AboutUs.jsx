import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, Instagram, MapPin, Globe, ShieldCheck, Users, Clock, ArrowRight, Facebook, Twitter } from 'lucide-react';

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

export default function AboutUs() {
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* HEADER SECTION */}
      <div className="bg-indigo-900 dark:bg-slate-950 text-white py-16 md:py-20 px-6 text-center border-b border-indigo-800 dark:border-slate-800 transition-colors">
        {/* ✅ BUS LOGO ADDED HERE */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center mb-6"
        >
          <BusLogo />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-3xl md:text-5xl font-black mb-4 leading-tight"
        >
          Connecting Kerala, <br className="md:hidden" /> <span className="text-yellow-400">One Journey at a Time.</span>
        </motion.h1>
        <p className="text-indigo-200 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
          We are Kerala's most trusted online bus booking platform, dedicated to making travel simple, secure, and accessible for everyone.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 -mt-10">
        
        {/* CONTACT CARDS */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {/* 1. CALL US */}
          <motion.a 
            variants={itemVariants}
            href="tel:+919876543210" 
            className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all group text-center cursor-pointer"
          >
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Phone size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Call Support</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">24/7 Customer Service</p>
            <span className="text-green-600 dark:text-green-400 font-bold flex items-center justify-center gap-1 group-hover:underline text-sm md:text-base">
              +91 98765 43210 <ArrowRight size={16}/>
            </span>
          </motion.a>

          {/* 2. EMAIL US */}
          <motion.a 
            variants={itemVariants}
            href="mailto:support@entebus.com" 
            className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all group text-center cursor-pointer"
          >
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Mail size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Email Us</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">For queries & feedback</p>
            <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center gap-1 group-hover:underline text-sm md:text-base">
              support@entebus.com <ArrowRight size={16}/>
            </span>
          </motion.a>

          {/* 3. INSTAGRAM */}
          <motion.a 
            variants={itemVariants}
            href="https://instagram.com/_ente_bus_" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all group text-center cursor-pointer"
          >
            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Instagram size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Follow Us</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">See latest updates & offers</p>
            <span className="text-pink-600 dark:text-pink-400 font-bold flex items-center justify-center gap-1 group-hover:underline text-sm md:text-base">
              @_ente_bus_ <ArrowRight size={16}/>
            </span>
          </motion.a>
        </motion.div>

        {/* MISSION SECTION */}
        <div className="flex flex-col lg:flex-row items-center gap-10 mb-16">
          <div className="w-full lg:w-1/2">
             <img 
                src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1000&auto=format&fit=crop" 
                alt="Kerala Bus Journey" 
                className="rounded-3xl shadow-2xl w-full object-cover h-64 md:h-[400px]"
             />
          </div>
          <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">Why Choose Us?</h2>
            <p className="text-gray-600 dark:text-slate-300 text-base md:text-lg leading-relaxed">
              We started with a simple mission: to revolutionize bus travel in Kerala. 
              Gone are the days of standing in long queues. With EnteBus, your seat is just a click away.
            </p>
            
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-4">
                <div className="shrink-0 bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck size={24}/>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">100% Secure Payments</h4>
                  <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400">We use top-tier encryption for safe transactions.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="shrink-0 bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg text-orange-600 dark:text-orange-400">
                  <Clock size={24}/>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">On-Time Guarantee</h4>
                  <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400">Strict schedules to ensure you reach on time.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="shrink-0 bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg text-purple-600 dark:text-purple-400">
                  <Users size={24}/>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">24/7 Support</h4>
                  <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400">Our team is always ready to assist you.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LOCATION FOOTER */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-gray-200 dark:border-slate-700 text-center transition-colors">
          <h3 className="text-lg md:text-xl font-bold mb-6 flex items-center justify-center gap-2 text-gray-900 dark:text-white">
            <MapPin className="text-red-500" /> Visit Our Headquarters
          </h3>
          <p className="text-gray-600 dark:text-slate-300 text-sm md:text-base max-w-lg mx-auto mb-6">
            EnteBus Pvt Ltd, <br/>
            MPTC Mattakkara, Kottayam, Kerala - 686001
          </p>
          <div className="flex justify-center gap-6 md:gap-4">
            <a href="#" className="text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"><Globe size={24}/></a>
            <a href="#" className="text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition"><Facebook size={24}/></a>
            <a href="#" className="text-gray-400 dark:text-slate-500 hover:text-sky-500 dark:hover:text-sky-400 transition"><Twitter size={24}/></a>
          </div>
        </div>

      </div>
    </div>
  );
}