import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
// Minimal icons to ensure stability
import { Loader, ArrowLeft, CreditCard, User } from 'lucide-react';

export default function SeatSelection() {
  const { busId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ MUST MATCH YOUR server.js PORT
  const API_URL = "https://ente-bus-app-api.onrender.com";

  const searchParams = new URLSearchParams(location.search);
  const selectedDate = searchParams.get('date');

  const [bus, setBus] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]); 
  const [selectedSeats, setSelectedSeats] = useState([]); 
  const [passengerName, setPassengerName] = useState('NAME');
  const [phone, setPhone] = useState('MOBILE NUMBER');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Bus Details
        const busRes = await axios.get(`${API_URL}/api/buses`);
        const currentBus = busRes.data.find(b => b._id === busId);
        setBus(currentBus);

        // 2. Fetch Occupied Seats for this specific date
        const seatRes = await axios.get(`${API_URL}/api/bookings/occupied?busId=${busId}&date=${selectedDate}`);
        setOccupiedSeats(Array.isArray(seatRes.data) ? seatRes.data : []);
      } catch (err) {
        console.error("Backend unreachable. Ensure node server.js is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // 3. Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, [busId, selectedDate, API_URL]);

  const toggleSeat = (num) => {
    setSelectedSeats(prev => 
      prev.includes(num) ? prev.filter(s => s !== num) : [...prev, num]
    );
  };

  // ✅ Ensures totalAmount is a Number for the backend
  const totalAmount = selectedSeats.length * (Number(bus?.price) || 0);

  const handlePayment = async () => {
    if (selectedSeats.length === 0) return alert("Select seats first!");
    if (!passengerName || !phone) return alert("Please fill in passenger details.");
    
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) return navigate('/login');

    try {
      // Step A: Initialize booking on server
      const bookingRes = await axios.post(`${API_URL}/api/bookings/init`, {
        busId, 
        seatNumbers: selectedSeats, 
        customerEmail: userData.email,
        customerName: passengerName, 
        customerPhone: phone, 
        amount: totalAmount, 
        travelDate: selectedDate
      });
      
      // Step B: Create Razorpay order on server
      const { data: order } = await axios.post(`${API_URL}/api/payment/order`, { amount: totalAmount });

      const options = {
        key: "rzp_test_Rp42r0Aqd3EZrY", 
        amount: order.amount,
        currency: "INR",
        name: "Ente Bus",
        description: `Booking for ${bus.name}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            // Step C: Verify payment on server
            const verifyRes = await axios.post(`${API_URL}/api/bookings/verify`, { 
              ...response, 
              bookingId: bookingRes.data.bookingId 
            });
            
            if (verifyRes.data.success) {
              // Navigate to success page using the precise bookingId
              navigate(`/booking-success/${bookingRes.data.bookingId}`);
            }
          } catch (error) {
            alert("Payment verification failed.");
          }
        },
        prefill: { name: passengerName, email: userData.email, contact: phone },
        theme: { color: "#4F46E5" }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) { 
      const errMsg = err.response?.data?.message || "Payment Initiation Failed";
      alert(errMsg); 
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-center">
      <Loader className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  // Generate 7 rows of 2+3 layout
  const rows = [];
  for (let i = 0; i < 7; i++) {
    rows.push({ left: [i * 5 + 1, i * 5 + 2], right: [i * 5 + 3, i * 5 + 4, i * 5 + 5] });
  }
  const backRow = [36, 37, 38, 39, 40];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 px-4 transition-all">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* BUS VISUALS - 2-3 Layout with Aisle Gap */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl p-10 border-4 border-slate-100 dark:border-slate-700">
          
          {/* DRIVER CABIN AREA */}
          <div className="flex justify-between items-center mb-10 border-b-2 border-dashed pb-8 border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-900 p-4 rounded-3xl w-28">
               <div className="w-12 h-12 rounded-full border-4 border-slate-400 flex items-center justify-center font-black">
                  <div className="w-1 h-8 bg-slate-400 rotate-45" />
               </div>
               <span className="text-[9px] font-black uppercase text-slate-400 mt-2 text-center">Driver Cabin</span>
            </div>
            <div className="text-right">
                <span className="uppercase font-black text-[10px] text-indigo-500 block tracking-widest">Main Entry</span>
                <div className="h-1.5 w-16 bg-emerald-400 rounded-full mt-1 ml-auto" />
            </div>
          </div>

          {/* SEAT GRID */}
          <div className="space-y-6">
            {rows.map((row, idx) => (
              <div key={idx} className="flex justify-between items-center px-2">
                {/* Left Section (2 Seats) */}
                <div className="flex gap-4">
                    {row.left.map(n => <Seat key={n} num={n} isOccupied={occupiedSeats.includes(n)} isSelected={selectedSeats.includes(n)} onToggle={toggleSeat} />)}
                </div>

                {/* AISLE GAP */}
                <div className="flex-1 flex justify-center opacity-10">
                    <div className="w-0.5 h-10 bg-slate-500 rounded-full" />
                </div>

                {/* Right Section (3 Seats) */}
                <div className="flex gap-4">
                    {row.right.map(n => <Seat key={n} num={n} isOccupied={occupiedSeats.includes(n)} isSelected={selectedSeats.includes(n)} onToggle={toggleSeat} />)}
                </div>
              </div>
            ))}

            {/* FULL BACK ROW (5 Seats) */}
            <div className="pt-6 border-t-2 border-dashed border-slate-200 dark:border-slate-700 flex justify-between px-2">
              {backRow.map(n => <Seat key={n} num={n} isOccupied={occupiedSeats.includes(n)} isSelected={selectedSeats.includes(n)} onToggle={toggleSeat} />)}
            </div>
          </div>
        </div>

        {/* BOOKING SUMMARY PANEL */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-700">
             <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2 dark:text-white">
                <User className="text-indigo-500" size={20}/> Passenger Info
             </h2>
             <input className="w-full p-5 mb-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold dark:text-white border-none outline-none focus:ring-2 ring-indigo-500/20" value={passengerName} onChange={e => setPassengerName(e.target.value)} placeholder="Full Name" />
             <input className="w-full p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold dark:text-white border-none outline-none focus:ring-2 ring-indigo-500/20" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile Number" maxLength={10} />
          </div>

          <div className="bg-indigo-600 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
             <CreditCard className="absolute right-[-20px] bottom-[-20px] opacity-10" size={150} />
             <p className="text-[10px] font-bold uppercase opacity-80 mb-2 tracking-widest">Grand Total</p>
             <h3 className="text-5xl font-black mb-8 tracking-tighter">₹{totalAmount.toLocaleString()}</h3>
             <button onClick={handlePayment} disabled={selectedSeats.length === 0} className="w-full py-6 bg-white text-indigo-600 rounded-3xl font-black uppercase shadow-xl hover:bg-black hover:text-white transition-all active:scale-95 disabled:opacity-50">
                Pay Now
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Seat({ num, isOccupied, isSelected, onToggle }) {
  return (
    <button
      disabled={isOccupied} onClick={() => onToggle(num)}
      className={`w-11 h-12 rounded-xl font-black text-[10px] transition-all relative
        ${isOccupied ? 'bg-red-50 text-red-200 cursor-not-allowed border-none shadow-inner' : 
          isSelected ? 'bg-indigo-600 text-white scale-110 shadow-[0_10px_20px_rgba(79,70,229,0.4)] -translate-y-1' : 
          'bg-white dark:bg-slate-700 text-slate-500 border-2 border-slate-100 dark:border-slate-600 hover:border-indigo-400'}`}
    >
      {num}
    </button>
  );
}