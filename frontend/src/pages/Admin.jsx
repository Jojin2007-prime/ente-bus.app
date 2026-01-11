import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Plus, Edit, Trash2, Users, Bus, Loader, 
  QrCode, ShieldCheck, XCircle, Scan, Search, Printer, 
  TrendingUp, RefreshCw, LayoutDashboard, AlertCircle, Mail, MapPin, Clock, Phone
} from 'lucide-react';

// ✅ CUSTOM ADMIN LOGO SVG
const BusLogo = () => (
  <svg width="31.87" height="28.4" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
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

export default function Admin() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pageLoading, setPageLoading] = useState(true);

  // Data States
  const [buses, setBuses] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  const [boardingLoading, setBoardingLoading] = useState(false);
  const [isScannerEnabled, setIsScannerEnabled] = useState(false);
  
  const [manifestBus, setManifestBus] = useState('');
  const [manifestDate, setManifestDate] = useState(new Date().toISOString().split('T')[0]);
  const [manifestData, setManifestData] = useState([]);
  const [manifestLoading, setManifestLoading] = useState(false);
  const [hasSearchedManifest, setHasSearchedManifest] = useState(false);

  const [allBookings, setAllBookings] = useState([]);
  const [refundSearch, setRefundSearch] = useState('');
  const [revenueData, setRevenueData] = useState({ overallTotal: 0, busStats: [], totalBookings: 0 });
  const [selectedBusStat, setSelectedBusStat] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [dateRevenue, setDateRevenue] = useState(null);

  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const scannerRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', registrationNumber: '', from: '', to: '',
    departureTime: '', price: '', driverName: '', driverContact: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const API_URL = "https://ente-bus-app-api.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) navigate('/login');
    else fetchInitialData();
    return () => { stopScanner(); }; 
  }, [navigate]);

  const fetchInitialData = async () => {
    setPageLoading(true);
    try {
      await Promise.all([fetchBuses(), fetchComplaints(), loadCameras(), fetchAllBookings(), fetchRevenue()]);
    } catch (err) { console.error(err); }
    setPageLoading(false);
  };

  const fetchRevenue = async () => { try { const res = await axios.get(`${API_URL}/api/admin/revenue-stats`); setRevenueData(res.data); } catch (err) { console.error(err); } };
  const checkDateRevenue = async (busId) => { if (!filterDate) return error("Select a date first"); try { const res = await axios.get(`${API_URL}/api/admin/revenue-stats?busId=${busId}&date=${filterDate}`); setDateRevenue(res.data.filteredRevenue); } catch (err) { console.error(err); } };
  const fetchAllBookings = async () => { try { const res = await axios.get(`${API_URL}/api/admin/bookings`); setAllBookings(Array.isArray(res.data) ? res.data : []); } catch (err) { console.error(err); } };
  const fetchBuses = async () => { try { const res = await axios.get(`${API_URL}/api/buses`); setBuses(res.data); } catch (err) { console.error(err); } };
  const fetchComplaints = async () => { try { const res = await axios.get(`${API_URL}/api/complaints/all`); setComplaints(res.data); } catch (err) { console.error(err); } };

  const handleBusSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) { await axios.put(`${API_URL}/api/buses/${editId}`, formData); success('Fleet Updated'); } 
      else { const res = await axios.post(`${API_URL}/api/buses`, formData); if (res.data.success) success('Bus Registered'); }
      resetForm(); fetchBuses(); fetchRevenue();
    } catch (err) { error('Operation Failed'); }
  };

  const resetForm = () => { setIsEditing(false); setEditId(null); setFormData({ name: '', registrationNumber: '', from: '', to: '', departureTime: '', price: '', driverName: '', driverContact: '' }); };
  const handleDeleteBus = async (id) => { if (window.confirm("Delete permanently?")) { try { await axios.delete(`${API_URL}/api/buses/${id}`); fetchBuses(); fetchRevenue(); success("Deleted"); } catch (err) { error("Error"); } } };
  const handleRefund = async (bookingId) => { if (window.confirm("Process Refund?")) { try { const res = await axios.post(`${API_URL}/api/admin/refund/${bookingId}`); if (res.data.success) { success("Refunded Successfully"); fetchInitialData(); } } catch (err) { error("Refund Failed"); } } };
  
  const fetchManifest = async () => {
    if (!manifestBus) return error("Select a bus");
    setManifestLoading(true); setHasSearchedManifest(true);
    try { const res = await axios.get(`${API_URL}/api/admin/manifest?busId=${manifestBus}&date=${manifestDate}`); setManifestData(res.data); } catch (err) { error("Error loading manifest"); }
    finally { setManifestLoading(false); }
  };

  const loadCameras = async () => { try { const devices = await Html5Qrcode.getCameras(); if (devices?.length > 0) { setCameras(devices); setSelectedCameraId(devices[devices.length - 1].id); } } catch (err) {} };
  const stopScanner = async () => { if (scannerRef.current?.isScanning) await scannerRef.current.stop(); setIsScannerEnabled(false); };
  const startScanner = async () => { 
    try { 
      const html5QrCode = new Html5Qrcode("reader"); scannerRef.current = html5QrCode; setIsScannerEnabled(true); 
      await html5QrCode.start(selectedCameraId || { facingMode: "environment" }, { fps: 15, qrbox: 250 }, (decodedText) => {
        const bookingId = decodedText.match(/[a-f\d]{24}/i);
        if (bookingId) { stopScanner(); handleVerifyTicket(bookingId[0]); }
      }, () => {}); 
    } catch (err) { setIsScannerEnabled(false); error("Camera Error"); } 
  };
  const handleVerifyTicket = async (id) => { try { const res = await axios.get(`${API_URL}/api/admin/verify-ticket/${id}`); setScanResult(res.data); } catch (err) { error("Invalid Ticket"); setScanResult(null); } };
  const handleConfirmBoarding = async () => { try { setBoardingLoading(true); await axios.put(`${API_URL}/api/admin/confirm-board/${scanResult.booking._id}`); success("Boarded"); setScanResult(prev => ({ ...prev, status: 'boarded_already', message: "Boarding Confirmed" })); } catch (err) { error("Failed"); } finally { setBoardingLoading(false); } };
  const handleResolveComplaint = async (id) => { try { await axios.put(`${API_URL}/api/complaints/resolve/${id}`); fetchComplaints(); success("Resolved"); } catch (err) { console.error(err); } };

  const isTripFinished = (tripDate) => {
    const today = new Date().toISOString().split('T')[0];
    return today > tripDate;
  };

  if (pageLoading) return <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white"><Loader className="animate-spin mb-4 text-indigo-500" size={48} /><p className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Command Tower...</p></div>;

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen font-sans pb-24 transition-colors text-slate-900 dark:text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-10">
        
        {/* HEADER */}
        <div className="flex flex-col items-center justify-center mb-10 gap-4 no-print">
          <BusLogo />
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tighter">Admin Dashboard</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em] mt-2 ml-1">Command Tower Control</p>
          </div>
        </div>

        {/* ✅ MOBILE TAB GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:justify-center gap-2 mb-10 no-print">
          {['dashboard', 'manifest', 'revenue', 'refunds', 'complaints', 'scanner'].map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setScanResult(null); }} className={`py-3 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-500'}`}>{tab}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-8 rounded-[3rem] border dark:border-slate-700 shadow-2xl h-fit">
                <h2 className="text-sm font-extrabold uppercase mb-8 flex items-center gap-2 text-indigo-600">{isEditing ? <Edit size={16}/> : <Plus size={16}/>} {isEditing ? 'Modify' : 'Register'}</h2>
                <form onSubmit={handleBusSubmit} className="space-y-4">
                  {Object.keys(formData).map((f) => (
                    <div key={f}>
                      <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1 ml-1">{f.replace(/([A-Z])/g, ' $1')}</label>
                      <input type={f === 'departureTime' ? 'time' : f === 'price' ? 'number' : 'text'} className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border-none outline-none focus:ring-2 ring-indigo-500/30 font-bold text-sm" value={formData[f]} onChange={e => setFormData({...formData, [f]: e.target.value})} required />
                    </div>
                  ))}
                  <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold uppercase text-xs active:scale-95 transition-all">{isEditing ? 'Save Changes' : 'Initialize'}</button>
                </form>
              </div>
              <div className="lg:col-span-8 space-y-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-2">Active Fleet Directory ({buses.length})</h2>
                {buses.map(b => (
                  <div key={b._id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border dark:border-slate-700 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-indigo-50 dark:bg-slate-900 rounded-2xl scale-75">
                          <BusLogo />
                        </div>
                        <div><p className="font-black text-sm uppercase">{b.name}</p><p className="text-[10px] font-mono text-slate-400 mt-1">{b.registrationNumber}</p></div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 dark:border-slate-700">
                        <div className="text-left sm:text-right"><p className="text-xs font-bold">{b.from} ➝ {b.to}</p><p className="text-[10px] font-black text-indigo-500 mt-1 uppercase">₹{b.price} • {b.departureTime}</p></div>
                        <div className="flex gap-2">
                          <button onClick={() => { const { _id, __v, ...cleanData } = b; setFormData(cleanData); setEditId(b._id); setIsEditing(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600"><Edit size={16}/></button>
                          <button onClick={() => handleDeleteBus(b._id)} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500"><Trash2 size={16}/></button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'manifest' && (
            <motion.div key="manifest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 max-w-4xl mx-auto">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl flex flex-col sm:flex-row gap-4 items-end no-print">
                <div className="flex-1 w-full"><label className="text-[9px] font-bold uppercase text-slate-400 ml-2 mb-1 block">Service</label><select className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border-none font-bold text-sm outline-none" value={manifestBus} onChange={(e) => setManifestBus(e.target.value)}><option value="">Select...</option>{buses.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}</select></div>
                <div className="flex-1 w-full"><label className="text-[9px] font-bold uppercase text-slate-400 ml-2 mb-1 block">Date</label><input type="date" className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border-none font-bold text-sm outline-none" value={manifestDate} onChange={(e) => setManifestDate(e.target.value)} /></div>
                <button onClick={fetchManifest} className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold uppercase text-xs shadow-lg">{manifestLoading ? <Loader className="animate-spin" size={16}/> : 'Sync'}</button>
              </div>
              <div className="space-y-4">
                {hasSearchedManifest && manifestData.length === 0 && !manifestLoading && <p className="text-center py-10 font-bold text-slate-400 uppercase text-[10px]">No Passengers found</p>}
                {manifestData.map((p) => (
                  <div key={p._id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border dark:border-slate-700 shadow flex justify-between items-center">
                    <div><p className="text-sm font-black capitalize">{p.customerName}</p><p className="text-[10px] text-slate-400 font-bold">{p.customerPhone}</p></div>
                    <div className="text-right">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase border ${p.status === 'Boarded' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{p.status}</span>
                      <p className="text-[10px] font-black text-indigo-500 mt-1 text-center">Seat: {p.seatNumbers.join(",")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'revenue' && (
            <motion.div key="revenue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden text-center">
                <TrendingUp className="absolute right-[-20px] bottom-[-20px] opacity-10" size={150} />
                <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Platform Gross Earnings</p>
                <h2 className="text-6xl font-black tracking-tighter">₹{revenueData.overallTotal?.toLocaleString()}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border dark:border-slate-700 shadow-xl text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bookings</p>
                    <p className="text-3xl font-black">{revenueData.totalBookings}</p>
                 </div>
                 <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border dark:border-slate-700 shadow-xl text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fleets</p>
                    <p className="text-3xl font-black">{buses.length}</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-[3.5rem] border dark:border-slate-700 shadow-2xl overflow-hidden h-fit">
                   <div className="p-8 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/30"><h3 className="font-extrabold uppercase text-sm">Revenue Directory</h3><RefreshCw onClick={fetchRevenue} size={18} className="text-slate-400 cursor-pointer" /></div>
                    {revenueData.busStats?.map((stat) => (
                      <div key={stat._id} onClick={() => { setSelectedBusStat(stat); setDateRevenue(null); }} className="p-6 flex justify-between items-center cursor-pointer border-b dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors">
                        <div><p className="text-xs font-black uppercase">{stat.details?.name}</p><p className="text-[10px] text-slate-400 font-mono">{stat.details?.registrationNumber}</p></div>
                        <p className="text-lg font-black text-indigo-600">₹{stat.revenue}</p>
                      </div>
                    ))}
                </div>
                <div className="lg:col-span-5 h-fit">
                   <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border dark:border-slate-700 shadow-2xl">
                    <h3 className="font-extrabold uppercase text-sm mb-6 flex items-center gap-2"><Search size={16}/> Date Filter</h3>
                    {selectedBusStat ? (
                      <div className="space-y-6">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-l-4 border-indigo-600"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Analyzing</p><p className="font-black text-xs uppercase">{selectedBusStat.details?.name}</p></div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block ml-1">Select Date</label>
                          <input type="date" className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none font-bold text-sm" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                          <button onClick={() => checkDateRevenue(selectedBusStat._id)} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold uppercase text-[10px] shadow-lg">Check Earnings</button>
                        </div>
                        {dateRevenue !== null && (
                          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-8 bg-indigo-50 dark:bg-indigo-900/40 rounded-[2rem] text-center border border-indigo-100">
                             <p className="text-[10px] font-bold text-indigo-400 uppercase mb-2">Revenue on {filterDate}</p>
                             <h4 className="text-4xl font-black text-indigo-600 tracking-tighter">₹{dateRevenue}</h4>
                          </motion.div>
                        )}
                      </div>
                    ) : <p className="text-center py-10 text-slate-400 font-bold uppercase text-[10px]">Select a bus from directory</p>}
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'refunds' && (
            <motion.div key="refunds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search passenger name or email..." className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 font-bold text-sm outline-none focus:ring-2 ring-indigo-500/20 shadow-lg" value={refundSearch} onChange={(e) => setRefundSearch(e.target.value)} /></div>
              <div className="space-y-4">
                {allBookings.filter(b => b.customerName?.toLowerCase().includes(refundSearch.toLowerCase()) || b.customerEmail?.toLowerCase().includes(refundSearch.toLowerCase())).map((b) => (
                  <div key={b._id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border dark:border-slate-700 shadow-md flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-black capitalize dark:text-white">{b.customerName}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1"><Mail size={10}/> {b.customerEmail}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1"><Phone size={10}/> {b.customerPhone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-indigo-600 uppercase">Bus: {b.busId?.name || "Fleet"}</p>
                        <p className="text-[10px] font-bold text-slate-400">{b.travelDate}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t dark:border-slate-700">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${b.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : b.status === 'Refunded' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>{b.status}</span>
                      {b.status === 'Paid' && isTripFinished(b.travelDate) && (
                        <button onClick={() => handleRefund(b._id)} className="bg-red-50 text-red-600 border border-red-100 px-5 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all active:scale-95">Initiate Refund</button>
                      )}
                      {b.status === 'Paid' && !isTripFinished(b.travelDate) && (
                        <span className="text-[9px] text-slate-400 font-bold uppercase italic">Trip not yet finished</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'complaints' && (
            <motion.div key="complaints" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {complaints.length === 0 ? <p className="text-center py-10 text-slate-400 font-bold text-xs uppercase col-span-full">No Feedback</p> : 
                complaints.map((c) => (
                  <div key={c._id} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border dark:border-slate-700 shadow-lg flex flex-col justify-between">
                    <div className="mb-4">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase border ${c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{c.status}</span>
                       <h3 className="font-extrabold uppercase text-sm mt-3">{c.category}</h3>
                       <p className="text-xs text-slate-500 mt-2 italic">"{c.message}"</p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t dark:border-slate-700 mt-4">
                       <p className="text-[10px] font-black uppercase">{c.name}</p>
                       {c.status === 'Pending' && <button onClick={() => handleResolveComplaint(c._id)} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase active:scale-95 transition-all">Resolve</button>}
                    </div>
                  </div>
                ))
              }
            </motion.div>
          )}

          {activeTab === 'scanner' && (
            <motion.div key="scanner" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border dark:border-slate-700 shadow-2xl text-center">
                <div className="flex justify-between items-center mb-8"><h2 className="text-sm font-black uppercase tracking-widest">QR Sensor</h2><button onClick={() => isScannerEnabled ? stopScanner() : startScanner()} className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase transition-all shadow-md ${isScannerEnabled ? 'bg-red-50 text-red-500' : 'bg-indigo-600 text-white'}`}>{isScannerEnabled ? 'STOP' : 'START'}</button></div>
                <div className="relative rounded-[2.5rem] bg-slate-950 aspect-square flex items-center justify-center overflow-hidden border-[6px] border-slate-900 shadow-inner">
                   <div id="reader" className="w-full h-full"></div>
                   {!isScannerEnabled && <Scan size={60} className="text-slate-800 animate-pulse" />}
                </div>
                {scanResult && (
                  <div className={`mt-6 p-5 rounded-2xl border-2 ${scanResult.status === 'success' ? 'bg-indigo-50 border-indigo-200' : 'bg-red-50 border-red-200'}`}>
                    <h3 className={`text-lg font-black uppercase mb-1 ${scanResult.status === 'success' ? 'text-indigo-600' : 'text-red-600'}`}>{scanResult.message}</h3>
                    <p className="text-xs font-bold text-slate-600">{scanResult.booking?.customerName}</p>
                    {scanResult.status === 'success' && <button onClick={handleConfirmBoarding} disabled={boardingLoading} className="w-full mt-3 py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase text-[10px] shadow-lg">Confirm</button>}
                  </div>
                )}
                <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                   <select className="w-full bg-transparent text-[10px] font-black uppercase outline-none" value={selectedCameraId} onChange={(e) => setSelectedCameraId(e.target.value)}>
                     {cameras.map(c => <option key={c.id} value={c.id}>{c.label || "Lens"}</option>)}
                   </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}