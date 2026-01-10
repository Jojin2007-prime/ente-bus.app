import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, MessageSquare, Bus, User, Mail, Tag, Send, ArrowLeft, Loader, Phone } from 'lucide-react';

export default function Complaint() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // ✅ Centralized Localhost URL
  const API_URL = "https://ente-bus-app-api.onrender.com"; 

  const [myTrips, setMyTrips] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user ? user.name : '',
    email: user ? user.email : '',
    phone: '', // Added for Admin dashboard visibility
    category: 'Travel Experience',
    tripDetails: '',
    message: ''
  });

  // ✅ Fetch History to link complaint to a specific trip
  useEffect(() => {
    if (user && user.email) {
      axios.get(`${API_URL}/api/bookings/user/${user.email}`)
        .then(res => setMyTrips(res.data))
        .catch(err => console.error("Could not fetch trips", err));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Sending data explicitly to match Backend names
      await axios.post(`${API_URL}/api/complaints/add`, {
        ...formData,
        userId: user ? user._id : null
      });
      toast.success("Feedback Logged Successfully");
      navigate('/');
    } catch (err) {
      console.error("Submission Error:", err);
      toast.error("Failed to Submit Complaint");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 px-4 transition-all font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-slate-700"
      >
        {/* HEADER */}
        <header className="mb-12 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <ArrowLeft size={24} className="dark:text-white text-slate-900" />
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold dark:text-white uppercase tracking-tighter flex items-center justify-center gap-3">
              Support Center <AlertCircle className="text-indigo-600" size={24} />
            </h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Grievance Redressal Portal</p>
          </div>
          <div className="w-10"></div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* USER INFO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* NAME */}
            <div className="space-y-3">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-2">Full Name</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
                <input 
                  type="text" required
                  placeholder="Enter your name"
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all border-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="space-y-3">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-2">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
                <input 
                  type="email" required
                  placeholder="name@example.com"
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all border-none"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* PHONE NUMBER (Crucial for Admin logic) */}
          <div className="space-y-3">
            <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-2">Contact Number</label>
            <div className="relative group">
              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
              <input 
                type="tel" required
                placeholder="+91 XXXXX XXXXX"
                className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all border-none"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          {/* TRIP SELECT */}
          <div className="space-y-3">
            <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-2">Link to a Specific Trip</label>
            <div className="relative">
              <Bus className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
              <select 
                className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all border-none appearance-none cursor-pointer"
                value={formData.tripDetails}
                onChange={(e) => setFormData({...formData, tripDetails: e.target.value})}
              >
                <option value="">General Service Feedback</option>
                {myTrips.map((trip) => (
                  <option key={trip._id} value={`${trip.busId?.name} - ${trip.travelDate}`}>
                    {trip.travelDate} — {trip.busId?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CATEGORY */}
          <div className="space-y-3">
            <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-2">Category of Issue</label>
            <div className="relative">
              <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
              <select 
                className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all border-none appearance-none cursor-pointer"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option>Travel Experience</option>
                <option>Payment Issue</option>
                <option>Bus Condition</option>
                <option>Staff Behavior</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* MESSAGE */}
          <div className="space-y-3">
            <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-2">Describe Your Issue</label>
            <div className="relative group">
              <MessageSquare className="absolute left-5 top-6 text-indigo-500" size={18} />
              <textarea 
                required rows="5"
                className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all border-none"
                placeholder="Tell us what went wrong. Please include as much detail as possible..."
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
              ></textarea>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] text-sm font-extrabold uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader className="animate-spin" size={20} />
            ) : (
              <>
                <Send size={20} /> Submit Feedback
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}