import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Calendar, CheckCircle, RefreshCw, 
  MapPin, AlertTriangle, CreditCard, Download, 
  Ticket, ChevronRight, AlertCircle, Trash2, SearchX, Bus, ShieldCheck, Mail
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode'; // Ensure 'qrcode' is installed: npm install qrcode

export default function PaymentHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const API_URL = "https://ente-bus-app-api.onrender.com";

  // Helper: Format Time for PDF
  const formatTime = (time24) => {
    if (!time24) return "N/A";
    const [hours, minutes] = time24.split(':');
    const period = +hours >= 12 ? 'PM' : 'AM';
    const hours12 = (+hours % 12) || 12;
    return `${hours12}:${minutes} ${period}`;
  };

  const isTripExpired = (travelDate, departureTime) => {
    if (!travelDate) return true;
    
    const now = new Date();
    const [year, month, day] = travelDate.split('-').map(Number);
    const tripDate = new Date(year, month - 1, day);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (tripDate < today) return true; 
    if (tripDate > today) return false; 

    if (departureTime) {
      const [hours, minutes] = departureTime.split(':').map(Number);
      const departure = new Date(year, month - 1, day, hours, minutes);
      return now > departure;
    }
    return false;
  };

  const clearExpiredBookings = () => {
    const activeBookings = bookings.filter(booking => {
      const isPaid = booking.status === 'Paid' || booking.status === 'Boarded';
      const isRefunded = booking.status === 'Refunded';
      const expired = booking.status === 'Pending' && isTripExpired(booking.travelDate, booking.busId?.departureTime);
      return isPaid || isRefunded || !expired; 
    });
    setBookings(activeBookings);
  };

  const fetchBookings = async () => {
    const userData = localStorage.getItem('user');
    if (!userData) return;
    const user = JSON.parse(userData);
    
    try {
      setRefreshing(true);
      const res = await axios.get(`${API_URL}/api/bookings/user/${user.email}`);
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleRetryPayment = async (booking) => {
    const user = JSON.parse(localStorage.getItem('user'));
    try {
      const { data: order } = await axios.post(`${API_URL}/api/payment/order`, { 
        amount: booking.amount 
      });
      
      const options = {
        key: "rzp_test_Rp42r0Aqd3EZrY", 
        amount: order.amount,
        currency: "INR",
        name: "Ente Bus",
        description: `Repay Now - ${booking.busId?.name}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            await axios.post(`${API_URL}/api/bookings/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id
            });
            fetchBookings();
          } catch (error) {
            console.error("Verification Failed");
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#4f46e5" } 
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) { console.error("Payment Initiation Failed"); }
  };

  // --- PROFESSIONAL PDF GENERATOR (Updated Design) ---
  // --- PROFESSIONAL PDF GENERATOR (Fixed Text Issue) ---
  const handleDownload = async (booking) => {
    setDownloadingId(booking._id);
    const doc = new jsPDF();
    
    try {
      // Generate QR Code data URI internally
      const qrImageData = await QRCode.toDataURL(booking._id, {
        margin: 1,
        width: 200,
        color: { dark: '#1e293b', light: '#ffffff' }
      });

      // 1. Header & Branding
      doc.setFillColor(30, 41, 59); // Dark Navy
      doc.rect(0, 0, 210, 60, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont("helvetica", "bold");
      doc.text("ENTE BUS", 20, 35);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("PREMIUM INTERCITY TRAVELS", 20, 45);
      doc.text("DIGITAL BOARDING PASS", 190, 35, null, null, "right");

      // 2. Journey Header (The "Route")
      // ✅ FIX: Replaced special arrow '→' with 'TO' to prevent text glitch
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(`${booking.busId?.from}  TO  ${booking.busId?.to}`, 20, 85); 

      // 3. QR Code Positioning
      doc.setDrawColor(226, 232, 240);
      doc.rect(145, 70, 45, 45); 
      doc.addImage(qrImageData, 'PNG', 147.5, 72.5, 40, 40);

      // 4. Detailed Grid Info
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("PASSENGER NAME", 20, 105);
      doc.text("TRAVEL DATE", 80, 105);

      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text(booking.customerName?.toUpperCase() || 'GUEST', 20, 115);
      doc.text(booking.travelDate || 'N/A', 80, 115);

      // 5. Service & Time Section
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("BUS SERVICE", 20, 130);
      doc.text("DEPARTURE TIME", 80, 130);
      doc.text("CONTACT", 145, 130);

      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text(booking.busId?.name || "Premium Fleet", 20, 140);
      doc.text(formatTime(booking.busId?.departureTime), 80, 140);
      doc.text(booking.customerPhone || 'N/A', 145, 140);

      // 6. Highlighted Seat & Price Bar
      doc.setFillColor(79, 70, 229); // Indigo
      doc.roundedRect(20, 155, 170, 35, 3, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text("CONFIRMED SEATS", 30, 170);
      doc.text("TOTAL FARE", 130, 170);

      doc.setFontSize(18);
      const seats = booking.seatNumbers?.join(", ") || "N/A";
      doc.text(seats, 30, 182);
      doc.text(`INR ${booking.amount}.00`, 130, 182);

      // 7. Important Instructions
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.text("IMPORTANT INSTRUCTIONS:", 20, 210);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("• Please report at the boarding point 15 minutes prior to departure.", 20, 218);
      doc.text("• Presentation of this digital ticket and a valid Govt ID is mandatory for boarding.", 20, 224);
      doc.text("• No-show tickets are non-refundable after the bus has departed.", 20, 230);

      // 8. Footer Security
      doc.setDrawColor(241, 245, 249);
      doc.line(20, 260, 190, 260);
      doc.setFontSize(7);
      doc.text(`Transaction ID: ${booking.paymentId || booking._id}`, 105, 270, null, null, "center");
      doc.setFont("helvetica", "bold");
      doc.text("Thank you for choosing ENTE BUS", 105, 278, null, null, "center");

      doc.save(`EnteBus_Ticket_${booking._id.slice(-6)}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-500 p-4 md:p-10 pb-28 font-sans text-slate-900 dark:text-white">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 no-print">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tighter flex items-center gap-3">
              Your Bookings <Ticket className="text-indigo-600" size={32} />
            </h1>
            <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-[0.4em] font-bold">Trip History & E-Tickets</p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={clearExpiredBookings}
              className="px-8 py-3 bg-white dark:bg-slate-800 text-red-500 rounded-2xl text-[10px] uppercase tracking-widest font-bold border border-red-50 dark:border-red-900/20 hover:bg-red-50 transition-all active:scale-95"
            >
              <Trash2 size={14} className="inline mr-2" /> Clear Expired
            </button>

            <button 
              onClick={fetchBookings}
              className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 text-slate-500 transition-all active:scale-90"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* CONTENT */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-44 w-full bg-white dark:bg-slate-800 animate-pulse rounded-[3rem] border dark:border-slate-700 shadow-sm" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-32 bg-white dark:bg-slate-800 rounded-[3.5rem] border border-dashed border-gray-200 dark:border-slate-700 shadow-sm">
            <SearchX size={80} className="mx-auto mb-6 text-slate-200 dark:text-slate-700" />
            <p className="font-extrabold uppercase tracking-[0.4em] text-slate-300 text-sm italic">No records acquired</p>
          </div>
        ) : (
          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {bookings.map((booking) => {
                const isPaid = booking.status === 'Paid' || booking.status === 'Boarded';
                const isRefunded = booking.status === 'Refunded'; 
                const expired = isTripExpired(booking.travelDate, booking.busId?.departureTime);

                return (
                  <motion.div 
                    layout
                    key={booking._id} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }} 
                    className={`p-10 rounded-[3.5rem] border transition-all duration-500 bg-white dark:bg-slate-800
                      ${isPaid ? 'border-slate-100 dark:border-slate-700 shadow-lg' : 
                        isRefunded ? 'border-red-100 bg-red-50/10' : 
                        expired ? 'border-red-100 opacity-60 grayscale-[0.5]' : 
                        'border-amber-100 shadow-md ring-4 ring-amber-50/50'}`}
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-8">
                          <span className={`px-5 py-2 rounded-full text-[10px] uppercase tracking-widest font-extrabold border ${
                            isPaid ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                            isRefunded ? 'bg-red-100 text-red-600 border-red-200' : 
                            expired ? 'bg-slate-50 text-slate-400 border-slate-200' : 
                            'bg-red-50 text-red-600 border-red-200 animate-pulse'
                          }`}>
                            {isRefunded ? 'Amount Refunded' : (expired && !isPaid ? 'Expired' : (!isPaid ? 'Unpaid' : booking.status))}
                          </span>
                          {booking.status === 'Boarded' && (
                            <span className="flex items-center gap-2 text-[10px] text-emerald-600 uppercase tracking-widest font-extrabold bg-emerald-50 px-5 py-2 rounded-full border border-emerald-100">
                               <ShieldCheck size={16}/> Boarded
                            </span>
                          )}
                        </div>

                        <h2 className="text-3xl font-extrabold uppercase tracking-tighter dark:text-white mb-8">
                          {booking.busId?.name || 'Bus Service'}
                        </h2>

                        <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 text-sm font-extrabold tracking-widest text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-3 uppercase">
                            <MapPin size={18} className="text-indigo-500" /> 
                            <span className="capitalize">{booking.busId?.from?.toLowerCase() || 'N/A'}</span> 
                            <ArrowRight size={14} className="opacity-40" /> 
                            <span className="capitalize">{booking.busId?.to?.toLowerCase() || 'N/A'}</span>
                          </div>
                          <span className="flex items-center gap-3 uppercase">
                            <Calendar size={18} className="text-emerald-500" /> {booking.travelDate}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center items-center md:items-end min-w-[200px] md:border-l border-slate-100 dark:border-slate-700 md:pl-12">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-2 font-black">Fare Amount</p>
                        <p className={`text-5xl font-extrabold tracking-tighter ${isRefunded ? 'text-slate-400 line-through' : 'dark:text-white'}`}>
                          ₹{booking.amount}
                        </p>
                        
                        <div className="mt-10 w-full">
                          {isPaid ? (
                            <button 
                              onClick={() => handleDownload(booking)} 
                              className="w-full flex items-center justify-center gap-4 bg-slate-900 dark:bg-indigo-600 text-white py-6 rounded-[2rem] text-[11px] uppercase tracking-[0.2em] font-extrabold shadow-2xl transition-all active:scale-95 hover:bg-slate-800"
                              disabled={downloadingId === booking._id}
                            >
                              {downloadingId === booking._id ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18}/>} 
                              E-Ticket
                            </button>
                          ) : isRefunded ? (
                            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100">
                              <p className="text-[10px] text-red-600 uppercase tracking-widest font-black flex flex-col items-center gap-2">
                                  <RefreshCw size={20} className="mb-1"/> Transaction Reversed
                              </p>
                            </div>
                          ) : (
                            <>
                              {!expired ? (
                                <button 
                                  onClick={() => handleRetryPayment(booking)} 
                                  className="w-full bg-red-600 hover:bg-red-500 text-white py-6 rounded-[2rem] text-[11px] uppercase tracking-[0.2em] font-extrabold shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                  <CreditCard size={18}/> Repay Now
                                </button>
                              ) : (
                                <div className="text-center p-4 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border dark:border-slate-800">
                                   <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold flex flex-col items-center gap-2">
                                     <Clock size={20} className="opacity-40 mb-1"/> Booking Timed Out
                                   </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// Support Icon for Navigation
function ArrowRight({ size, className }) {
  return (
    <svg 
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}