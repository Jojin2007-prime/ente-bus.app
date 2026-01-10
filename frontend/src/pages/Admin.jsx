import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';
import {
  Shield, Plus, Edit, Trash2, Users, Bus, Loader, 
  QrCode, ShieldCheck, XCircle, Scan, Search, Printer, 
  TrendingUp, RefreshCw, LayoutDashboard, AlertCircle, Mail
} from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // ✅ LOADING STATE
  const [pageLoading, setPageLoading] = useState(true);

  // Data States
  const [buses, setBuses] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  const [boardingLoading, setBoardingLoading] = useState(false);
  const [isScannerEnabled, setIsScannerEnabled] = useState(false);
  
  const [manifestBus, setManifestBus] = useState('');
  const [manifestDate, setManifestDate] = useState(new Date().toLocaleDateString('en-CA'));
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

  // Auth Check
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
    } else {
      fetchInitialData();
    }
    return () => { stopScanner(); }; 
  }, [navigate]);

  const fetchInitialData = async () => {
    setPageLoading(true); // Start loading
    await Promise.all([
      fetchBuses(),
      fetchComplaints(),
      loadCameras(),
      fetchAllBookings(),
      fetchRevenue()
    ]);
    setPageLoading(false); // Stop loading when done
  };

  // --- API CALLS ---
  const fetchRevenue = async () => { try { const res = await axios.get(`${API_URL}/api/admin/revenue-stats`); setRevenueData(res.data); } catch (err) { console.error(err); } };
  const checkDateRevenue = async (busId) => { if (!filterDate) return showToast("Select a date first", "error"); try { const res = await axios.get(`${API_URL}/api/admin/revenue-stats?busId=${busId}&date=${filterDate}`); setDateRevenue(res.data.filteredRevenue); } catch (err) { console.error(err); } };
  const fetchAllBookings = async () => { try { const res = await axios.get(`${API_URL}/api/admin/bookings`); setAllBookings(Array.isArray(res.data) ? res.data : []); } catch (err) { console.error(err); } };
  const fetchBuses = async () => { try { const res = await axios.get(`${API_URL}/api/buses`); setBuses(res.data); } catch (err) { console.error(err); } };
  const fetchComplaints = async () => { try { const res = await axios.get(`${API_URL}/api/complaints/all`); setComplaints(res.data); } catch (err) { console.error(err); } };

  // --- ACTIONS ---
  const handleBusSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) { await axios.put(`${API_URL}/api/buses/${editId}`, formData); showToast('Route Updated', "success"); } 
      else { const res = await axios.post(`${API_URL}/api/buses`, formData); if (res.data.success) showToast('Bus Registered', "success"); }
      resetForm(); 
      // ✅ FIX: Update BOTH Buses and Revenue (so new fleets show up instantly)
      fetchBuses();
      fetchRevenue(); 
    } catch (err) { showToast('Operation Failed', "error"); }
  };

  const resetForm = () => { setIsEditing(false); setEditId(null); setFormData({ name: '', registrationNumber: '', from: '', to: '', departureTime: '', price: '', driverName: '', driverContact: '' }); };
  const handleDeleteBus = async (id) => { if (window.confirm("Delete this route permanently?")) { try { await axios.delete(`${API_URL}/api/buses/${id}`); fetchBuses(); fetchRevenue(); showToast("Deleted", "success"); } catch (err) { showToast("Error", "error"); } } };
  const handleRefund = async (bookingId) => { if (window.confirm("Process Refund?")) { try { const res = await axios.post(`${API_URL}/api/admin/refund/${bookingId}`); if (res.data.success) { showToast("Refunded", "success"); fetchAllBookings(); fetchRevenue(); } } catch (err) { showToast("Failed", "error"); } } };
  
  const fetchManifest = async () => {
    if (!manifestBus) return showToast("Select a bus", "error");
    setManifestLoading(true);
    setHasSearchedManifest(true);
    try { const res = await axios.get(`${API_URL}/api/admin/manifest?busId=${manifestBus}&date=${manifestDate}`); setManifestData(res.data); } catch (err) { showToast("Error loading manifest", "error"); }
    finally { setManifestLoading(false); }
  };

  // --- SCANNER ---
  const loadCameras = async () => { try { const devices = await Html5Qrcode.getCameras(); if (devices?.length > 0) { setCameras(devices); setSelectedCameraId(devices[devices.length - 1].id); } } catch (err) { console.error(err); } };
  const stopScanner = async () => { if (scannerRef.current) { try { if (scannerRef.current.isScanning) await scannerRef.current.stop(); scannerRef.current.clear(); scannerRef.current = null; setIsScannerEnabled(false); } catch (err) { setIsScannerEnabled(false); } } };
  const startScanner = async () => { try { if (scannerRef.current) await stopScanner(); const html5QrCode = new Html5Qrcode("reader"); scannerRef.current = html5QrCode; setIsScannerEnabled(true); await html5QrCode.start(selectedCameraId || { facingMode: "environment" }, { fps: 15, qrbox: { width: 250, height: 250 } }, (decodedText) => { const bookingId = decodedText.match(/[a-f\d]{24}/i); if (bookingId) { stopScanner(); handleVerifyTicket(bookingId[0]); } }, () => {} ); } catch (err) { setIsScannerEnabled(false); showToast("Camera Error", "error"); } };
  const handleVerifyTicket = async (id) => { try { const res = await axios.get(`${API_URL}/api/admin/verify-ticket/${id}`); setScanResult(res.data); } catch (err) { showToast("Invalid Ticket", "error"); setScanResult(null); } };
  const handleConfirmBoarding = async () => { try { setBoardingLoading(true); await axios.put(`${API_URL}/api/admin/confirm-board/${scanResult.booking._id}`); showToast("Boarded", "success"); setScanResult(prev => ({ ...prev, status: 'boarded_already', message: "Boarding Confirmed" })); } catch (err) { showToast("Failed", "error"); } finally { setBoardingLoading(false); } };
  const handleResolveComplaint = async (id) => { try { await axios.put(`${API_URL}/api/complaints/resolve/${id}`); fetchComplaints(); showToast("Resolved", "success"); } catch (err) { console.error(err); } };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader className="animate-spin mb-4 text-indigo-500" size={48} />
        <p className="text-[10px] uppercase font-bold tracking-widest animate-pulse">Accessing Command Tower...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen font-sans pb-20 transition-colors duration-500 text-slate-900 dark:text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 no-print">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tighter flex items-center gap-3">
              <LayoutDashboard className="text-indigo-600" size={32}/> Admin Dashboard
            </h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em] mt-2 ml-1">Command Tower Control</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border dark:border-slate-700 shadow-xl overflow-x-auto">
              {['dashboard', 'manifest', 'revenue', 'refunds', 'complaints', 'scanner'].map((tab) => (
                <button key={tab} onClick={() => { setActiveTab(tab); setScanResult(null); }} className={`px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-500'}`}>{tab}</button>
              ))}
            </div>
            {/* ❌ Logout Button Removed from Here */}
          </div>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-700">
            <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-2xl h-fit">
               <h2 className="text-lg font-extrabold uppercase mb-8 flex items-center gap-3 tracking-tighter">{isEditing ? <Edit className="text-indigo-500" size={20}/> : <Plus className="text-indigo-500" size={20}/>} {isEditing ? 'Modify Route' : 'Register Bus'}</h2>
               <form onSubmit={handleBusSubmit} className="space-y-5">
                 {Object.keys(formData).map((f) => (
                    <div key={f}><label className="text-[9px] font-bold uppercase text-slate-400 block mb-2 tracking-widest ml-1">{f.replace(/([A-Z])/g, ' $1')}</label><input type={f === 'departureTime' ? 'time' : f === 'price' ? 'number' : 'text'} className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none outline-none focus:ring-2 ring-indigo-500/30 transition-all font-bold text-sm" value={formData[f]} onChange={e => setFormData({...formData, [f]: e.target.value})} required /></div>
                 ))}
                 <div className="flex gap-3"><button className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-bold uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all mt-4 hover:bg-indigo-500">{isEditing ? 'Commit Changes' : 'Initialize Service'}</button>{isEditing && (<button type="button" onClick={resetForm} className="bg-slate-100 dark:bg-slate-700 p-5 rounded-2xl mt-4"><RefreshCw size={20} /></button>)}</div>
               </form>
            </div>
            <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-[3.5rem] p-8 border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden h-fit">
              <h2 className="text-lg font-extrabold uppercase mb-8 tracking-tighter">Active Fleet Directory</h2>
              {buses.length === 0 ? <div className="p-10 text-center text-slate-400 font-bold uppercase text-xs tracking-widest border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">No Buses Registered</div> : (
                <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-[12px] uppercase text-slate-400 border-b dark:border-slate-700"><th className="pb-6 font-bold tracking-widest">Service Details</th><th className="pb-6 font-bold tracking-widest">Route</th><th className="pb-6 font-bold text-center tracking-widest">Control</th></tr></thead><tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">{buses.map(b => (<tr key={b._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group"><td className="py-6 pr-4"><p className="text-sm font-bold tracking-tight uppercase">{b.name}</p><p className="text-[12px] text-slate-400 font-mono mt-1">{b.registrationNumber}</p></td><td className="py-6"><p className="text-[15px] dark:text-slate-300 font-bold tracking-tighter flex items-center gap-2"><span className="capitalize">{b.from.toLowerCase()}</span> <span className="text-indigo-500 opacity-40">→</span> <span className="capitalize">{b.to.toLowerCase()}</span></p></td><td className="py-6"><div className="flex gap-3 justify-center opacity-40 group-hover:opacity-100 transition-opacity"><button onClick={() => { const { _id, __v, ...cleanData } = b; setFormData(cleanData); setEditId(b._id); setIsEditing(true); }} className="p-3 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"><Edit size={18}/></button><button onClick={() => handleDeleteBus(b._id)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button></div></td></tr>))}</tbody></table></div>
              )}
            </div>
          </div>
        )}

        {/* MANIFEST TAB - UPDATED WITH EMAIL */}
        {activeTab === 'manifest' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-700">
            <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-2xl flex flex-col md:flex-row gap-8 items-end no-print">
              <div className="flex-1 space-y-3 w-full"><label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Select Service</label><select className="w-full p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none font-bold text-sm outline-none" value={manifestBus} onChange={(e) => setManifestBus(e.target.value)}><option value="">Choose service...</option>{buses.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}</select></div>
              <div className="flex-1 space-y-3 w-full"><label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Departure Schedule</label><input type="date" className="w-full p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none font-bold text-sm outline-none" value={manifestDate} onChange={(e) => setManifestDate(e.target.value)} /></div>
              <button onClick={fetchManifest} className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-5 rounded-2xl font-bold uppercase text-[11px] tracking-widest shadow-xl flex items-center gap-3">{manifestLoading ? <Loader className="animate-spin" size={18}/> : <Search size={18}/>} Sync Manifest</button>
            </div>
            {hasSearchedManifest && manifestData.length === 0 ? (<div className="p-10 text-center text-slate-400 font-bold uppercase text-xs tracking-widest border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[3rem] bg-white dark:bg-slate-800"><AlertCircle className="mx-auto mb-2 opacity-50" size={32}/>No Passengers Found for this Trip</div>) : manifestData.length > 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-10 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50"><h3 className="font-extrabold uppercase tracking-tighter text-xl">Passenger Manifest</h3><button onClick={() => window.print()} className="text-[10px] uppercase font-bold text-indigo-600 border px-6 py-3 rounded-full flex items-center gap-2 no-print"><Printer size={14}/> Print Document</button></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="text-[10px] uppercase text-slate-400 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30"><th className="px-10 py-5 font-bold tracking-widest">Seat</th><th className="px-10 py-5 font-bold tracking-widest">Identity</th><th className="px-10 py-5 font-bold text-center">Status</th></tr></thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                      {manifestData.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50/50">
                          <td className="px-10 py-6 text-sm font-extrabold text-indigo-600">{p.seatNumbers.join(", ")}</td>
                          <td className="px-10 py-6">
                            <p className="text-sm font-bold capitalize">{p.customerName}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{p.customerPhone}</p>
                            <p className="text-[10px] text-indigo-400 lowercase">{p.customerEmail}</p>
                          </td>
                          <td className="px-10 py-6 text-center"><span className={`px-5 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest border ${p.status === 'Boarded' ? 'bg-emerald-50 text-emerald-600' : p.status === 'Refunded' ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 text-amber-600'}`}>{p.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* REVENUE TAB */}
        {activeTab === 'revenue' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden"><TrendingUp className="absolute right-[-10px] bottom-[-10px] opacity-10" size={150} /><p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80 mb-2">Net Platform Revenue</p><h2 className="text-5xl font-extrabold tracking-tighter">₹{revenueData.overallTotal}</h2></div>
               <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border dark:border-slate-700 shadow-xl"><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Total Tickets Sold</p><h2 className="text-5xl font-extrabold tracking-tighter">{revenueData.totalBookings}</h2></div>
               <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border dark:border-slate-700 shadow-xl"><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Active Fleet</p><h2 className="text-5xl font-extrabold tracking-tighter">{revenueData.busStats.length}</h2></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden">
                  <div className="p-8 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50"><h3 className="font-extrabold uppercase tracking-tighter text-lg">Bus Revenue Directory</h3><RefreshCw onClick={fetchRevenue} size={18} className="text-slate-400 cursor-pointer hover:rotate-180 transition-all" /></div>
                  {revenueData.busStats.length === 0 ? <div className="p-10 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No Revenue Data Yet</div> : (
                    <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-[10px] uppercase text-slate-400 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30"><th className="px-10 py-6 font-bold tracking-widest">Bus Details</th><th className="px-10 py-6 font-bold tracking-widest text-right">Revenue</th></tr></thead><tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">{revenueData.busStats.map((stat) => (<tr key={stat._id} onClick={() => { setSelectedBusStat(stat); setDateRevenue(null); }} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 cursor-pointer transition-colors group"><td className="px-10 py-6"><p className="text-sm font-extrabold uppercase group-hover:text-indigo-600 transition-colors">{stat.details?.name || 'Bus'}</p><p className="text-[10px] text-slate-400 font-mono mt-1">{stat.details?.registrationNumber}</p></td><td className="px-10 py-6 text-right font-extrabold text-indigo-600 text-lg tracking-tighter">₹{stat.revenue}</td></tr>))}</tbody></table></div>
                  )}
               </div>
               <div className="lg:col-span-5"><div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-indigo-100 dark:border-slate-700 shadow-2xl h-full"><h3 className="font-extrabold uppercase tracking-tighter text-lg mb-8 flex items-center gap-3"><Search className="text-indigo-600" size={20}/> Date Drill Down</h3>{selectedBusStat ? (<div className="space-y-6"><div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border-l-4 border-indigo-600"><p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-1">Analyzing Service</p><p className="text-lg font-extrabold uppercase tracking-tight">{selectedBusStat.details?.name}</p></div><div className="space-y-3"><label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Select Report Date</label><input type="date" className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none outline-none font-bold text-sm" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} /><button onClick={() => checkDateRevenue(selectedBusStat._id)} className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest">Check Earnings</button></div>{dateRevenue !== null && (<motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2.5rem] border border-indigo-100 text-center shadow-inner"><p className="text-[10px] font-bold uppercase text-indigo-400 tracking-widest mb-2">Earnings on {filterDate}</p><h4 className="text-5xl font-extrabold text-indigo-600 tracking-tighter">₹{dateRevenue}</h4></motion.div>)}</div>) : <p className="text-center py-20 text-slate-400 font-bold">Select a bus to drill down</p>}</div></div>
            </div>
          </div>
        )}

        {/* REFUNDS TAB - UPDATED WITH EMAIL */}
        {activeTab === 'refunds' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-700">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6"><div><h2 className="text-xl font-extrabold uppercase tracking-tighter">Refund Control Center</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Transaction Reversal Gateway</p></div><div className="relative w-full md:w-96"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search passenger..." className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 ring-indigo-500/20" value={refundSearch} onChange={(e) => setRefundSearch(e.target.value)} /></div></div>
            <div className="bg-white dark:bg-slate-800 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden">
               {allBookings.length === 0 ? <div className="p-10 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No Bookings Found</div> : (
                 <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-[10px] uppercase text-slate-400 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30"><th className="px-10 py-6 font-bold tracking-widest">Passenger</th><th className="px-10 py-6 font-bold tracking-widest text-center">Status / Action</th></tr></thead><tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">{allBookings.filter(b => b.customerName.toLowerCase().includes(refundSearch.toLowerCase()) || b.customerEmail.toLowerCase().includes(refundSearch.toLowerCase())).map((b) => (<tr key={b._id} className="hover:bg-slate-50/50">
                   <td className="px-10 py-6">
                     <p className="text-sm font-bold capitalize">{b.customerName}</p>
                     <p className="text-[10px] text-slate-400 lowercase flex items-center gap-1"><Mail size={10}/> {b.customerEmail}</p>
                   </td>
                   <td className="px-10 py-6 text-center">{b.status === 'Paid' ? (<button onClick={() => handleRefund(b._id)} className="bg-red-50 text-red-600 border border-red-100 px-6 py-2.5 rounded-xl text-[10px] font-extrabold uppercase hover:bg-red-600 hover:text-white transition-all">Process Refund</button>) : (<span className={`px-5 py-2 rounded-full text-[9px] font-bold uppercase border bg-slate-100 text-slate-500`}>{b.status}</span>)}</td></tr>))}</tbody></table></div>
               )}
            </div>
          </div>
        )}

        {/* COMPLAINTS TAB */}
        {activeTab === 'complaints' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in zoom-in-95 duration-500">
            {complaints.length === 0 ? <div className="col-span-full text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-widest border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[3rem]">No Complaints Filed</div> : (
              complaints.map((c) => (<div key={c._id} className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-xl flex flex-col justify-between"><div><span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase border mb-8 inline-block tracking-widest ${c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{c.status}</span><h3 className="font-extrabold text-lg uppercase leading-tight mb-2">{c.category}</h3><p className="text-[10px] font-bold lowercase text-slate-400 mb-6">{c.email}</p><div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 text-lg font-bold italic">"{c.message}"</div></div><div className="pt-10 flex justify-between items-center text-[10px] font-bold uppercase">By: {c.name.toLowerCase()}{c.status === 'Pending' && <button onClick={() => handleResolveComplaint(c._id)} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold uppercase text-[10px] shadow-lg active:scale-95 transition-all">Resolve</button>}</div></div>))
            )}
          </div>
        )}

        {/* SCANNER TAB */}
        {activeTab === 'scanner' && (
          <div className="max-w-xl mx-auto space-y-10 animate-in zoom-in-95 duration-500">
            {!scanResult ? (
              <div className="bg-white dark:bg-slate-800 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl text-center"><div className="flex justify-between items-center mb-10 text-left"><div><h2 className="text-xl font-extrabold uppercase dark:text-white tracking-tighter">Gateway Sensor</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Live QR Verifier</p></div><button onClick={() => isScannerEnabled ? stopScanner() : startScanner()} className={`px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl ${isScannerEnabled ? 'bg-red-50 text-red-500' : 'bg-indigo-600 text-white'}`}>{isScannerEnabled ? 'Terminate' : 'Activate'}</button></div><div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 aspect-square flex items-center justify-center border-4 border-slate-100 shadow-inner"><div id="reader" className="w-full h-full"></div>{!isScannerEnabled && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900"><Scan size={64} className="text-slate-200 dark:text-slate-800 mb-4 animate-pulse"/><p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Ready</p></div>)}</div><div className="mt-8 flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl"><select className="bg-transparent text-[11px] uppercase w-full outline-none font-bold tracking-widest" value={selectedCameraId} onChange={(e) => setSelectedCameraId(e.target.value)}>{cameras.map(c => <option key={c.id} value={c.id}>{c.label || "Lens"}</option>)}</select></div></div>
            ) : (
              <div className={`p-10 rounded-[3.5rem] border shadow-2xl transition-all duration-500 bg-white dark:bg-slate-800 ${scanResult.status === 'boarded_already' ? 'border-emerald-500' : scanResult.status === 'refunded' ? 'border-red-500 border-dashed animate-pulse' : scanResult.status === 'success' ? 'border-indigo-500' : 'border-red-500'}`}><div className="flex items-center gap-6 mb-10"><div className={`p-6 rounded-[2rem] shadow-xl ${scanResult.status === 'success' ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'}`}>{scanResult.status === 'success' ? <ShieldCheck size={48} /> : <XCircle size={48} />}</div><div><h3 className="text-2xl uppercase font-extrabold tracking-tighter mb-3">{scanResult.message}</h3><p className="text-sm font-bold capitalize">{scanResult.booking?.customerName}</p></div></div><div className="space-y-4">{scanResult.status === 'success' && (<button onClick={handleConfirmBoarding} disabled={boardingLoading} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-bold uppercase text-xs tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3">{boardingLoading ? <Loader className="animate-spin" size={20}/> : <ShieldCheck size={20}/>} Confirm Boarding</button>)}<button onClick={() => { setScanResult(null); if(isScannerEnabled) startScanner(); }} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-bold uppercase text-[11px] tracking-[0.2em] shadow-lg">Dismiss & Next</button></div></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowRight({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}