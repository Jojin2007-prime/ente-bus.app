import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react'; 
import { 
  CheckCircle, 
  Download, 
  Home, 
  Loader, 
  ShieldCheck,
} from 'lucide-react';

// --- CUSTOM BUS LOGO COMPONENT ---
const BusLogo = () => (
  <svg width="31.87" height="28.4" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
    <defs>
      <linearGradient id="busGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#1e3a8a', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#9333ea', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M -10 75 Q 50 55 110 80" fill="none" stroke="#1f2937" strokeWidth="6" strokeLinecap="round"/>
    <path d="M 10 30 L 80 20 Q 95 18 95 40 L 95 55 Q 95 65 85 65 L 15 65 Q 5 65 5 55 L 5 40 Q 5 30 10 30 Z" fill="url(#busGradient)" stroke="white" strokeWidth="1"/>
    <circle cx="25" cy="65" r="6" fill="#1f2937" stroke="gray" strokeWidth="1" />
    <circle cx="75" cy="65" r="6" fill="#1f2937" stroke="gray" strokeWidth="1" />
  </svg>
);

export default function BookingSuccess() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef();

  const API_URL = "https://ente-bus-app-api.onrender.com";

  const formatTime = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const period = +hours >= 12 ? 'PM' : 'AM';
    const hours12 = (+hours % 12) || 12;
    return `${hours12}:${minutes} ${period}`;
  };

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        // ✅ Give MongoDB 2 seconds to finalize the 'Paid' status update
        await new Promise(resolve => setTimeout(resolve, 2000));

        // ✅ Use targeted verification route for 100% accuracy
        const res = await axios.get(`${API_URL}/api/admin/verify-ticket/${id}`);
        
        if (res.data.booking) {
          setBooking(res.data.booking);
        }
      } catch (err) {
        console.error("Error fetching booking:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id, API_URL]);

 const downloadTicket = async () => {
    if (!booking) return;
    
    // Capture QR Code from Canvas
    const canvas = qrRef.current.querySelector('canvas');
    const qrImageData = canvas.toDataURL("image/png");

    const doc = new jsPDF();
    const primaryColor = [30, 41, 59]; // Dark Slate
    const accentColor = [79, 70, 229];  // Indigo

    // 1. HEADER BRANDING
    doc.setFillColor(...primaryColor); 
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("ENTE BUS", 20, 30);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("OFFICIAL DIGITAL BOARDING PASS", 20, 40);
    doc.text(`TICKET ID: ${booking._id.slice(-8).toUpperCase()}`, 190, 30, null, null, "right");

    // 2. PASSENGER & TRIP SECTION
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.text("PASSENGER NAME", 20, 65);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(booking.customerName.toUpperCase(), 20, 75);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("CONTACT NUMBER", 20, 85);
    doc.text(booking.customerPhone, 20, 93);

    // 3. QR CODE POSITIONING
    doc.setDrawColor(226, 232, 240);
    doc.rect(140, 60, 50, 50); 
    doc.addImage(qrImageData, 'PNG', 142.5, 62.5, 45, 45);

    // 4. JOURNEY INFO BOX
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 115, 190, 115); // Separator

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("FROM", 20, 125);
    doc.text("TO", 100, 125);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(booking.busId?.from || "N/A", 20, 135);
    doc.text(booking.busId?.to || "N/A", 100, 135);

    // 5. SEAT & PAYMENT DETAILS
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, 150, 170, 40, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setTextColor(...accentColor);
    doc.text("CONFIRMED SEATS", 30, 165);
    doc.setFontSize(18);
    doc.text(booking.seatNumbers.join(", "), 30, 180);

    doc.setFontSize(10);
    doc.text("TOTAL PAID", 130, 165);
    doc.setFontSize(18);
    doc.text(`INR ${booking.amount}.00`, 130, 180);

    // 6. BUS SERVICE DETAILS
    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.text(`Bus Service: ${booking.busId?.name}`, 20, 210);
    doc.text(`Travel Date: ${booking.travelDate}`, 20, 218);
    doc.text(`Departure Time: ${formatTime(booking.busId?.departureTime)}`, 20, 226);

    // 7. FOOTER SECURITY
    doc.setLineDash([2, 2], 0);
    doc.line(20, 250, 190, 250);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("This is a computer-generated ticket and does not require a physical signature.", 105, 265, null, null, "center");
    doc.text("Please carry a valid government ID proof during boarding.", 105, 272, null, null, "center");
    doc.setFont("helvetica", "bold");
    doc.text("POWERED BY ENTE BUS FLEET MANAGEMENT SYSTEM", 105, 280, null, null, "center");

    doc.save(`EnteBus_Ticket_${booking.customerName}_${booking._id.slice(-4)}.pdf`);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center font-sans">
      <Loader className="animate-spin text-indigo-500 mb-4" size={48} />
      <p className="text-indigo-400 text-xs uppercase tracking-[0.3em] font-extrabold text-center px-4">
        Finalizing Payment & Generating Ticket...
      </p>
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 font-sans p-6 text-center">
      <h2 className="text-2xl font-extrabold uppercase tracking-widest text-gray-900 dark:text-white mb-4">Record Not Found</h2>
      <p className="text-slate-500 mb-6 text-sm">The payment was successful, but the record is still syncing. Please check your history in a moment.</p>
      <button onClick={() => navigate('/history')} className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-sm font-bold shadow-xl active:scale-95 transition-all">Check My History</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 px-4 flex flex-col items-center justify-center font-sans transition-colors duration-500">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-md w-full">
        
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white dark:border-slate-800 shadow-xl">
            <CheckCircle size={40} className="text-emerald-500" />
          </div>
          <h1 className="text-3xl font-extrabold dark:text-white uppercase tracking-tighter leading-none">Trip Confirmed</h1>
          <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-[0.3em] mt-3">Verified Digital Record</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700 relative">
          <div ref={qrRef} className="bg-slate-50 dark:bg-slate-900/50 p-12 flex flex-col items-center border-b-2 border-dashed border-slate-200 dark:border-slate-700">
            <div className="bg-white p-5 rounded-[2rem] shadow-2xl border-4 border-slate-50">
              <QRCodeCanvas value={id} size={180} level={"H"} />
            </div>
            <p className="text-[10px] uppercase text-slate-400 tracking-[0.4em] font-extrabold mt-6">Gate Access Code</p>
          </div>

          <div className="p-10 space-y-8">
            <div className="flex items-center gap-5 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl border dark:border-slate-700">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg"><BusLogo /></div>
              <div className="flex-1">
                <p className="text-[9px] uppercase text-slate-400 font-extrabold mb-1 tracking-widest">Service Operator</p>
                <p className="text-sm font-extrabold dark:text-white uppercase tracking-wider leading-none">{booking.busId?.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[9px] uppercase text-slate-400 font-extrabold mb-1 tracking-widest">Traveler</p>
                <p className="text-sm font-extrabold dark:text-white uppercase leading-none">{booking.customerName}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase text-slate-400 font-extrabold mb-1 tracking-widest">Seats</p>
                <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tighter leading-none">{booking.seatNumbers?.join(", ")}</p>
              </div>
            </div>

            <div className="pt-8 border-t dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-widest">{booking.status}</span>
              </div>
              <span className="text-[10px] font-extrabold dark:text-white uppercase tracking-widest">{booking.travelDate}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <button onClick={downloadTicket} className="w-full py-6 bg-slate-900 dark:bg-indigo-600 text-white rounded-3xl text-sm font-bold tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4">
            <Download size={20} /> Download Official PDF
          </button>
          <button onClick={() => navigate('/')} className="w-full py-6 bg-white dark:bg-slate-800 text-slate-500 dark:text-white border-2 border-slate-100 dark:border-slate-700 rounded-3xl text-sm font-bold tracking-widest flex items-center justify-center gap-4 transition-all active:scale-95">
            <Home size={20} /> Return to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}