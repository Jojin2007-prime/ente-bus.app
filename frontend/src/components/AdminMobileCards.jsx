// File: frontend/src/components/AdminMobileCards.jsx
import React from 'react';
import { Bus, MapPin, Clock, Edit, Trash2, Phone, TrendingUp, User, Mail, ShieldCheck, XCircle } from 'lucide-react';

// --- 1. BUS CARD (Mobile View) ---
export const MobileBusCard = ({ bus, onEdit, onDelete }) => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-lg mb-4">
    <div className="flex items-center gap-4 mb-4">
      <div className="p-3 bg-indigo-50 dark:bg-slate-900 rounded-2xl text-indigo-600 shadow-inner">
        <Bus size={22} />
      </div>
      <div>
        <h3 className="font-black text-sm uppercase dark:text-white leading-tight">{bus.name}</h3>
        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{bus.registrationNumber}</p>
      </div>
    </div>
    
    <div className="space-y-2 mb-4">
      <div className="flex justify-between items-center text-xs font-bold dark:text-slate-300">
        <div className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-400"/> {bus.from}</div>
        <div className="h-px w-4 bg-slate-300 dark:bg-slate-600"></div>
        <div>{bus.to}</div>
      </div>
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl">
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-orange-500">
          <Clock size={12} /> {bus.departureTime}
        </div>
        <div className="text-sm font-black text-indigo-600">₹{bus.price}</div>
      </div>
    </div>

    <div className="flex gap-2">
      <button onClick={() => onEdit(bus)} className="flex-1 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all">
        <Edit size={14} /> Modify
      </button>
      <button onClick={() => onDelete(bus._id)} className="flex-1 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all">
        <Trash2 size={14} /> Remove
      </button>
    </div>
  </div>
);

// --- 2. MANIFEST CARD (Mobile View) ---
export const MobileManifestCard = ({ passenger }) => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-md mb-3 flex flex-col gap-3">
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full">
          <User size={16} className="text-slate-500" />
        </div>
        <div>
          <p className="text-xs font-black uppercase dark:text-white">{passenger.customerName}</p>
          <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
            <Phone size={10} /> {passenger.customerPhone}
          </p>
        </div>
      </div>
      <div className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase border ${
        passenger.status === 'Boarded' 
          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
          : 'bg-amber-50 text-amber-600 border-amber-100'
      }`}>
        {passenger.status}
      </div>
    </div>
    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl flex justify-between items-center">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Allocated Seat</span>
      <span className="text-lg font-black text-indigo-600">{passenger.seatNumbers.join(", ")}</span>
    </div>
  </div>
);

// --- 3. REVENUE CARD (Mobile View) ---
export const MobileRevenueCard = ({ stat, onClick }) => (
  <div onClick={onClick} className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-md mb-3 active:scale-95 transition-transform flex justify-between items-center">
    <div>
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
        {stat.details?.registrationNumber || 'Unknown'}
      </p>
      <p className="text-xs font-bold dark:text-white">{stat.details?.name}</p>
    </div>
    <div className="text-right">
      <p className="text-[9px] font-bold uppercase text-slate-400">Earned</p>
      <p className="text-lg font-black text-emerald-500">₹{stat.revenue}</p>
    </div>
  </div>
);

// --- 4. REFUND CARD (Mobile View) ---
export const MobileRefundCard = ({ booking, onRefund }) => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-md mb-3">
    <div className="flex justify-between items-start mb-3">
      <div>
        <p className="text-sm font-black dark:text-white capitalize">{booking.customerName}</p>
        <p className="text-[10px] text-slate-400 lowercase flex items-center gap-1 mt-0.5">
          <Mail size={10}/> {booking.customerEmail}
        </p>
      </div>
      <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase ${
        booking.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
      }`}>
        {booking.status}
      </span>
    </div>
    {booking.status === 'Paid' && (
      <button 
        onClick={() => onRefund(booking._id)}
        className="w-full py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all"
      >
        <TrendingUp size={14} className="rotate-180" /> Process Refund
      </button>
    )}
  </div>
);