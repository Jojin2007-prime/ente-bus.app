import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Loader, User, Phone, CreditCard, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const SteeringWheel = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="2" />
    <path d="M12 10v2M10 12h2M12 12h2M12 12v2" />
    <path d="M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M19.07 4.93l-4.24 4.24M9.17 14.83l-4.24 4.24" />
  </svg>
);

export default function SeatSelection() {
  const { busId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const API_URL = "https://ente-bus-app-api.onrender.com";
  const searchParams = new URLSearchParams(location.search);
  const selectedDate = searchParams.get('date');

  const [bus, setBus] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]); 
  const [selectedSeats, setSelectedSeats] = useState([]); 
  const [passengerName, setPassengerName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);

  // --- HELPER: FORMAT DATE TO DD/MM/YYYY ---
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // --- HELPER: FORMAT TIME TO 12HR CLOCK ---
  const formatTime12h = (time24) => {
    if (!time24) return "N/A";
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
          setPassengerName(userData.name || "");
          setPhone(userData.phone || ""); 
        }

        const busRes = await axios.get(`${API_URL}/api/buses`);
        const currentBus = busRes.data.find(b => b._id === busId);
        setBus(currentBus);

        const seatRes = await axios.get(`${API_URL}/api/bookings/occupied?busId=${busId}&date=${selectedDate}`);
        setOccupiedSeats(Array.isArray(seatRes.data) ? seatRes.data : []);
      } catch (err) {
        console.error("Connection error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, [busId, selectedDate]);

  const toggleSeat = (num) => {
    setSelectedSeats(prev => 
      prev.includes(num) ? prev.filter(s => s !== num) : [...prev, num]
    );
  };

  const totalAmount = selectedSeats.length * (Number(bus?.price) || 0);

  // --- VALIDATION LOGIC ---
  const isPhoneValid = phone.length === 10 && /^\d+$/.test(phone);
  const canBook = selectedSeats.length > 0 && isPhoneValid && passengerName.trim() !== '';

  const handlePayment = async () => {
    if (!canBook) return;
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) return navigate('/login');

    try {
      const bookingRes = await axios.post(`${API_URL}/api/bookings/init`, {
        busId, seatNumbers: selectedSeats, customerEmail: userData.email,
        customerName: passengerName, customerPhone: phone, amount: totalAmount, travelDate: selectedDate
      });
      
      const { data: order } = await axios.post(`${API_URL}/api/payment/order`, { amount: totalAmount });

      const options = {
        key: "rzp_test_Rp42r0Aqd3EZrY", 
        amount: order.amount, 
        currency: "INR",
        name: "Ente Bus", 
        description: `Booking for ${bus.name}`, 
        order_id: order.id,
        handler: async (response) => {
          const verifyRes = await axios.post(`${API_URL}/api/bookings/verify`, { ...response, bookingId: bookingRes.data.bookingId });
          if (verifyRes.data.success) navigate(`/booking-success/${bookingRes.data.bookingId}`);
        },
        prefill: { name: passengerName, email: userData.email, contact: phone },
        theme: { color: "#4F46E5" }
      };
      new window.Razorpay(options).open();
    } catch (err) { alert("Checkout failed. Try again."); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex justify-center items-center">
      <Loader className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  const rows = Array.from({ length: 7 }, (_, i) => ({
    left: [i * 5 + 1, i * 5 + 2],
    right: [i * 5 + 3, i * 5 + 4, i * 5 + 5]
  }));
  const backRow = [36, 37, 38, 39, 40];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 py-10 px-4 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* BUS VISUAL ENGINE */}
        <div className="lg:col-span-7 bg-[#0f172a] rounded-[4rem] shadow-2xl p-6 md:p-10 border-x-[16px] border-[#1e293b] relative overflow-hidden">
          <div className="w-full mb-14 bg-slate-900/80 rounded-[2.5rem] p-8 border border-white/5 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-[#1e293b] border-2 border-slate-700 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                <SteeringWheel className="w-12 h-12 text-indigo-500/80" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-100 tracking-[0.2em] uppercase">Driver Cabin</h4>
                <div className="flex gap-1.5 mt-2">
                   <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                   <div className="w-12 h-2 rounded-full bg-slate-800" />
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Main Entrance</span>
              <div className="w-24 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
            </div>
          </div>

          <div className="space-y-6 px-4">
            {rows.map((row, idx) => (
              <div key={idx} className="flex justify-between items-center gap-6">
                <div className="flex gap-3">
                  {row.left.map(n => <Seat key={n} num={n} isOccupied={occupiedSeats.includes(n)} isSelected={selectedSeats.includes(n)} onToggle={toggleSeat} />)}
                </div>
                <div className="flex-1 flex justify-center opacity-5">
                   <div className="w-[2px] h-14 bg-slate-400" />
                </div>
                <div className="flex gap-3">
                  {row.right.map(n => <Seat key={n} num={n} isOccupied={occupiedSeats.includes(n)} isSelected={selectedSeats.includes(n)} onToggle={toggleSeat} />)}
                </div>
              </div>
            ))}
            <div className="mt-12 pt-10 border-t border-white/5 flex justify-between gap-3">
               {backRow.map(n => <Seat key={n} num={n} isOccupied={occupiedSeats.includes(n)} isSelected={selectedSeats.includes(n)} onToggle={toggleSeat} />)}
            </div>
          </div>
        </div>

        {/* SIDEBAR: INFO & PAYMENT */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* TRIP SUMMARY CARD */}
          <div className="bg-[#0f172a] p-6 rounded-[2.5rem] border border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Travel Date</p>
                <p className="font-bold text-slate-200">{formatDate(selectedDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Departure</p>
                <p className="font-bold text-slate-200">{formatTime12h(bus?.departureTime)}</p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                <Clock size={20} />
              </div>
            </div>
          </div>

          {/* PASSENGER FORM */}
          <div className="bg-[#0f172a] p-8 rounded-[3rem] shadow-xl border border-white/5">
              <h2 className="text-xs font-black uppercase mb-8 flex items-center gap-3 text-indigo-400 tracking-[0.2em]">
                <User size={16}/> Boarding Details
              </h2>
              
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    className="w-full pl-14 p-5 bg-[#1e293b] rounded-2xl font-bold text-white outline-none border border-transparent focus:border-indigo-500 transition-all" 
                    value={passengerName} 
                    onChange={e => setPassengerName(e.target.value)} 
                    placeholder="Full Name" 
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="tel"
                    className={`w-full pl-14 p-5 bg-[#1e293b] rounded-2xl font-bold text-white outline-none border transition-all ${phone.length > 0 && !isPhoneValid ? 'border-red-500/50' : 'border-transparent focus:border-indigo-500'}`} 
                    value={phone} 
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} 
                    placeholder="10 Digit Phone Number" 
                    maxLength={10} 
                  />
                  {phone.length > 0 && !isPhoneValid && (
                    <p className="text-[10px] text-red-400 mt-2 ml-2 font-bold uppercase tracking-tighter">Please enter exactly 10 digits</p>
                  )}
                </div>
              </div>
          </div>

          {/* TOTAL & PAY */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-800 p-10 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden group">
              <CreditCard className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:rotate-12 transition-transform duration-700" size={200} />
              
              <div className="relative z-10">
                <p className="text-[11px] font-black uppercase opacity-60 mb-2 tracking-[0.3em]">Total for {selectedSeats.length} Seat(s)</p>
                <h3 className="text-6xl font-black mb-10 tracking-tighter">
                  <span className="text-2xl align-top mr-1 opacity-40">₹</span>
                  {totalAmount.toLocaleString()}
                </h3>
                
                <button 
                  onClick={handlePayment} 
                  disabled={!canBook} 
                  className="w-full py-6 bg-white text-indigo-700 rounded-3xl font-black uppercase text-sm tracking-widest shadow-xl hover:bg-slate-900 hover:text-white transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {!isPhoneValid && phone.length > 0 ? "Enter Valid Phone" : "Book Seat Now"}
                </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Seat({ num, isOccupied, isSelected, onToggle }) {
  return (
    <motion.button
      whileHover={!isOccupied ? { y: -2, scale: 1.05 } : {}}
      whileTap={!isOccupied ? { scale: 0.95 } : {}}
      disabled={isOccupied} 
      onClick={() => onToggle(num)}
      className={`w-12 h-14 md:w-14 md:h-16 rounded-2xl font-black text-xs transition-all duration-300 relative flex items-center justify-center
        ${isOccupied 
          ? 'bg-slate-800 text-slate-700 cursor-not-allowed border-none opacity-40' 
          : isSelected 
            ? 'bg-indigo-500 text-white shadow-[0_12px_24px_rgba(79,70,229,0.5)] ring-2 ring-white/20 -translate-y-1' 
            : 'bg-[#1e293b] text-indigo-200 border border-white/5 hover:bg-indigo-900 hover:text-white shadow-lg'
        }`}
    >
      <div className="absolute inset-x-2 top-2 h-[2px] bg-white/5 rounded-full" />
      {num}
      {isSelected && <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#0f172a] shadow-lg" />}
    </motion.button>
  );
}