import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode'; 
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, Plus, LogOut, Edit, Trash2, ClipboardList, 
  Users, ArrowRight, History, Mail, Phone, MessageSquareWarning, 
  CheckCircle, Bus, QrCode, Camera, StopCircle, RefreshCw,
  XCircle, Loader, MapPin, Calendar, ChevronDown, UserCheck, AlertTriangle, User, ImageIcon, Printer
} from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // --- Data States ---
  const [bookings, setBookings] = useState([]);
  const [buses, setBuses] = useState([]);
  const [complaints, setComplaints] = useState([]); 

  // --- QR Scanner Specific States ---
  const [ticketData, setTicketData] = useState(null);
  const [ticketStatus, setTicketStatus] = useState(null); // 'valid', 'future', 'expired'
  const [scanError, setScanError] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Manifest/Form States ---
  const [manifestBusId, setManifestBusId] = useState('');
  const [manifestDate, setManifestDate] = useState('');
  const [manifestData, setManifestData] = useState([]);
  const [formData, setFormData] = useState({ 
    name: '', registrationNumber: '', from: '', to: '', 
    departureTime: '', price: '', driverName: '', driverContact: '' 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const API_URL = "https://entebus-api.onrender.com";

  // --- ✅ 1. SUCCESS BEEP LOGIC ---
  const playSuccessBeep = () => {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880; 
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.2);
      oscillator.stop(context.currentTime + 0.2);
    } catch (e) { console.error("Audio error", e); }
  };

  // --- 2. INITIALIZATION & DATA FETCHING ---
  useEffect(() => {
    if (!localStorage.getItem('admin')) {
      navigate('/admin-login');
    } else { 
      fetchBookings(); 
      fetchBuses(); 
      fetchComplaints();
      initHardware();
    }
    return () => { stopScanner(); };
  }, [navigate]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/bookings`);
      setBookings(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchBuses = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/buses`);
      setBuses(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/complaints/all`);
      setComplaints(res.data);
    } catch (err) { console.error(err); }
  };

  // --- 3. SCANNER HARDWARE & MEDIA LOGIC ---
  const initHardware = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        const backCam = devices.find(d => d.label.toLowerCase().includes('back')) || devices[devices.length - 1];
        setSelectedCamera(backCam.id);
      }
    } catch (err) { console.error("Hardware Init Error", err); }
  };

  const startScanner = async () => {
    if (!selectedCamera) return alert("Select a lens hardware.");
    setIsCameraActive(true); setScanError(''); setTicketData(null);
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("admin-reader");
        html5QrCodeRef.current = scanner;
        await scanner.start(
          selectedCamera, 
          { fps: 25, qrbox: (w, h) => ({ width: w * 0.75, height: w * 0.75 }) },
          (decodedText) => handleScannedID(decodedText),
          () => {} 
        );
      } catch (err) {
        setScanError("Camera access failed.");
        setIsCameraActive(false);
      }
    }, 300);
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) { console.warn(e); }
    }
    setIsCameraActive(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanLoading(true); setScanError(''); setTicketData(null);
    await stopScanner();
    try {
      const scanner = new Html5Qrcode("file-worker-admin");
      const result = await scanner.scanFile(file, true);
      handleScannedID(result);
    } catch (err) {
      setScanError("QR Code not readable from this image.");
    } finally {
      setScanLoading(false);
      e.target.value = null;
    }
  };

  const handleScannedID = (decodedText) => {
    const idMatch = decodedText.match(/[a-f\d]{24}/i);
    if (idMatch) {
      playSuccessBeep(); 
      stopScanner();
      verifyScannedTicket(idMatch[0]);
    }
  };

  // --- ✅ 4. TODAY-ONLY VERIFICATION LOGIC ---
  const verifyScannedTicket = async (id) => {
    setScanLoading(true); setScanError('');
    try {
      const res = await axios.get(`${API_URL}/api/verify/${id}`);
      const ticket = res.data;
      
      // Date Comparison Logic
      const travelDate = new Date(ticket.travelDate);
      const today = new Date();
      
      // Reset hours to compare only Dates
      travelDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (travelDate.getTime() < today.getTime()) {
        setTicketStatus('expired'); // For yesterday or before
      } else if (travelDate.getTime() > today.getTime()) {
        setTicketStatus('future');  // For tomorrow or later
      } else {
        setTicketStatus('valid');   // Exactly for Today
      }

      setTicketData(ticket);
    } catch (err) { setScanError("❌ Record not found in database."); }
    finally { setScanLoading(false); }
  };

  const confirmBoarding = async () => {
    if (!ticketData || ticketStatus !== 'valid') return;
    setConfirmLoading(true);
    try {
      await axios.put(`${API_URL}/api/bookings/board/${ticketData._id}`);
      setTicketData(prev => ({ ...prev, status: 'Boarded' }));
      playSuccessBeep(); 
      alert("Passenger Boarded Successfully! ✅");
    } catch (err) { alert("Failed to update boarding status."); }
    finally { setConfirmLoading(false); }
  };

  // --- 5. ACTION HANDLERS (BUS CRUD & COMPLAINTS) ---
  const handleBusSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/api/buses/${editId}`, formData);
        setIsEditing(false); setEditId(null);
        alert('Bus Details Updated! ✅');
      } else {
        await axios.post(`${API_URL}/api/buses`, formData);
        alert('New Bus Route Added! ✅');
      }
      setFormData({ name: '', registrationNumber: '', from: '', to: '', departureTime: '', price: '', driverName: '', driverContact: '' });
      fetchBuses();
    } catch (err) { alert('Error processing request'); }
  };

  const handleEditClick = (bus) => {
    setFormData({
      name: bus.name, registrationNumber: bus.registrationNumber || '', 
      from: bus.from, to: bus.to, departureTime: bus.departureTime, 
      price: bus.price, driverName: bus.driverName || '', driverContact: bus.driverContact || ''
    });
    setEditId(bus._id); setIsEditing(true); window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleDeleteBus = async (id) => {
    if (window.confirm("Delete this bus permanently?")) {
      try { await axios.delete(`${API_URL}/api/buses/${id}`); fetchBuses(); } catch (err) { alert("Error deleting bus"); }
    }
  };

  const handleResolveComplaint = async (id) => {
    try {
      await axios.put(`${API_URL}/api/complaints/resolve/${id}`);
      fetchComplaints(); 
      alert("Issue marked as Resolved ✅");
    } catch (err) { alert("Error updating complaint"); }
  };

  const handleFetchManifest = async () => {
    if (!manifestBusId || !manifestDate) return alert("Select Bus and Date.");
    try {
      const res = await axios.get(`${API_URL}/api/admin/manifest?busId=${manifestBusId}&date=${manifestDate}`);
      setManifestData(res.data);
    } catch (err) { alert("Error fetching manifest data"); }
  };

  const handleLogout = () => { localStorage.removeItem('admin'); navigate('/'); };

  const formatTime = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const period = +hours >= 12 ? 'PM' : 'AM';
    const hours12 = (+hours % 12) || 12;
    return `${hours12}:${minutes} ${period}`;
  };

  const processedManifest = manifestData.flatMap(booking => 
    booking.seatNumbers.map(seat => ({
      seat, 
      name: booking.customerName || "Guest", 
      phone: booking.customerPhone || "N/A", 
      email: booking.customerEmail || "N/A",
      status: booking.status
    }))
  ).sort((a, b) => a.seat - b.seat);

  return (
    <div className="p-6 md:p-10 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
      <div id="file-worker-admin" style={{ display: 'none' }}></div>
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-black dark:text-white italic uppercase flex items-center gap-2">
          <Shield className="text-red-600" size={32}/> EnteBus Admin
        </h1>
        
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-x-auto">
           <button onClick={() => { stopScanner(); setActiveTab('dashboard'); }} className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab==='dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50'}`}>Dashboard</button>
           <button onClick={() => { stopScanner(); setActiveTab('manifest'); }} className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab==='manifest' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50'}`}>Manifest</button>
           <button onClick={() => setActiveTab('scanner')} className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${activeTab==='scanner' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50'}`}>
             <QrCode size={18}/> Scanner
           </button>
           <button onClick={() => { stopScanner(); setActiveTab('complaints'); }} className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab==='complaints' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-300'}`}>
             Complaints {complaints.filter(c => c.status === 'Pending').length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{complaints.filter(c => c.status === 'Pending').length}</span>}
           </button>
        </div>
        <button onClick={handleLogout} className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-5 py-2 rounded-xl font-bold border border-red-100 dark:border-red-800 transition-all active:scale-95">Logout</button>
      </div>

      {/* --- DASHBOARD TAB --- */}
      {activeTab === 'dashboard' && (
        <div className="animate-in fade-in duration-500">
           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
             <Link to="/admin/history" className="p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-3 text-center group no-underline">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition"><History size={24}/></div>
                <div><h3 className="font-bold text-gray-800 dark:text-white">Trip History</h3><p className="text-xs text-gray-500 dark:text-slate-400 mt-1">View revenue & trip records</p></div>
             </Link>
           </div>

           <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 mb-10">
            <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
              {isEditing ? <Edit className="text-indigo-500" /> : <Plus className="text-green-500" />}
              {isEditing ? 'Update Route Details' : 'Register New Bus Route'}
            </h3>
            <form onSubmit={handleBusSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {[
                { label: 'Bus Service Name', value: 'name', col: 'md:col-span-2', placeholder: 'KSRTC Super Fast' },
                { label: 'Registration ID', value: 'registrationNumber', col: 'md:col-span-2', placeholder: 'KL-15-A-1234' },
                { label: 'From', value: 'from', placeholder: 'Source' }, { label: 'To', value: 'to', placeholder: 'Destination' },
                { label: 'Departure Time', value: 'departureTime', type: 'time' }, { label: 'Ticket Price (₹)', value: 'price', type: 'number' },
                { label: 'Driver Name', value: 'driverName', col: 'md:col-span-2' }, { label: 'Driver Contact', value: 'driverContact', col: 'md:col-span-2' },
              ].map((field, idx) => (
                <div key={idx} className={field.col || ''}>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 tracking-widest">{field.label}</label>
                  <input type={field.type || 'text'} placeholder={field.placeholder} className="w-full p-3 border dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 ring-indigo-500 outline-none transition-all" value={formData[field.value]} onChange={e => setFormData({...formData, [field.value]: e.target.value})} required />
                </div>
              ))}
              <div className="col-span-full flex gap-3">
                 <button className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg">{isEditing ? 'Update Database' : 'Register Bus Route'}</button>
                 {isEditing && <button type="button" onClick={() => { setIsEditing(false); setFormData({name:'', registrationNumber:'', from:'', to:'', departureTime:'', price:'', driverName:'', driverContact:''}); }} className="px-8 bg-gray-200 dark:bg-slate-700 dark:text-white font-bold rounded-xl">Cancel</button>}
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 shadow-sm">
              <h3 className="text-xl font-bold mb-6 dark:text-white">Active Fleet Management</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-slate-700 text-[10px] uppercase text-gray-500 tracking-widest">
                    <tr><th className="p-4">Bus Details</th><th className="p-4">Route</th><th className="p-4">Schedule</th><th className="p-4 text-center">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {buses.map(b => (
                      <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="p-4 font-bold dark:text-white">{b.name} <br/><span className="text-[10px] font-mono opacity-50">{b.registrationNumber}</span></td>
                        <td className="p-4 text-sm dark:text-slate-300">{b.from} → {b.to}</td>
                        <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">{formatTime(b.departureTime)}</td>
                        <td className="p-4 text-center">
                           <div className="flex justify-center gap-2">
                             <button onClick={() => handleEditClick(b)} className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100"><Edit size={16}/></button>
                             <button onClick={() => handleDeleteBus(b._id)} className="p-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: MANIFEST --- */}
      {activeTab === 'manifest' && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 animate-in slide-in-from-right-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-gray-50 dark:bg-slate-900 p-6 rounded-2xl">
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Select Route</label>
              <select className="w-full p-4 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white font-bold appearance-none" onChange={(e) => setManifestBusId(e.target.value)}>
                <option value="">-- Choose Route --</option>
                {buses.map(b => <option key={b._id} value={b._id}>{b.name} ({b.from} - {b.to})</option>)}
              </select></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Travel Date</label>
              <input type="date" className="w-full p-4 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white font-bold" onChange={(e) => setManifestDate(e.target.value)} /></div>
              <div className="flex items-end"><button onClick={handleFetchManifest} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition">Generate List</button></div>
          </div>
          {manifestData.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
              <table className="w-full text-left bg-white dark:bg-slate-800">
                <thead className="bg-gray-800 text-white">
                  <tr><th className="p-4 uppercase text-[10px] tracking-widest">Seat</th><th className="p-4 uppercase text-[10px] tracking-widest">Passenger</th><th className="p-4 uppercase text-[10px] tracking-widest">Contact Info</th><th className="p-4 uppercase text-[10px] tracking-widest">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {processedManifest.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="p-4 font-black text-gray-700 dark:text-gray-300">{row.seat}</td>
                      <td className="p-4 font-bold dark:text-white">{row.name}</td>
                      <td className="p-4 text-xs font-mono dark:text-slate-400">{row.phone} <br/> {row.email}</td>
                      <td className="p-4"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${row.status==='Boarded' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 bg-gray-50 dark:bg-slate-900 text-right"><button onClick={() => window.print()} className="text-indigo-600 dark:text-indigo-400 font-black text-sm flex items-center gap-2 justify-end ml-auto hover:underline"><Printer size={16}/> Print Manifest</button></div>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-gray-200">
               <Users size={48} className="opacity-10 mb-4"/><p className="font-bold text-xs uppercase tracking-widest">No passengers found.</p>
             </div>
          )}
        </div>
      )}

      {/* --- TAB 3: SCANNER (WITH TODAY-ONLY LOGIC) --- */}
      {activeTab === 'scanner' && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 animate-in slide-in-from-bottom-4 duration-500">
          <div className="max-w-xl mx-auto space-y-6">
            {!isCameraActive && !ticketData && !scanLoading && (
              <div className="space-y-6 bg-gray-50 dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-inner text-center">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Conductor Hardware Lenses</label>
                  <select value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 p-4 rounded-xl font-bold focus:ring-2 ring-indigo-500 transition-all outline-none">
                    {cameras.map(cam => <option key={cam.id} value={cam.id}>{cam.label || `Hardware ${cam.id.slice(0,5)}`}</option>)}
                  </select>
                </div>
                <button onClick={startScanner} className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black text-xl flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all shadow-indigo-900/40">
                  <Camera size={32} /> Open Boarding Scanner
                </button>
                <div className="py-2 opacity-30 text-[10px] font-black">OR</div>
                <div onClick={() => fileInputRef.current.click()} className="bg-slate-200 dark:bg-slate-800 p-10 rounded-2xl border-2 border-dashed border-slate-400 text-center cursor-pointer hover:border-indigo-500 transition-all group">
                   <ImageIcon size={40} className="mx-auto mb-2 text-slate-400 group-hover:text-indigo-500" />
                   <p className="font-bold text-sm text-slate-500 group-hover:text-slate-200">Scan Passenger Screenshot</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              </div>
            )}

            {isCameraActive && (
              <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
                <div className="relative w-full max-w-md aspect-square rounded-[3rem] border-4 border-indigo-600 overflow-hidden shadow-[0_0_80px_rgba(79,70,229,0.5)] bg-slate-950">
                   <div id="admin-reader" className="w-full h-full"></div>
                   <div className="absolute inset-0 border-[50px] border-black/50 pointer-events-none"></div>
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-indigo-400 rounded-3xl animate-pulse pointer-events-none"></div>
                </div>
                <button onClick={stopScanner} className="mt-12 bg-red-600 text-white px-12 py-4 rounded-2xl font-black flex items-center gap-3 active:scale-95 transition-all shadow-xl">
                  <StopCircle size={24} /> Close Scanner
                </button>
              </div>
            )}

            {ticketData && (
              <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-500 border border-gray-200 dark:border-slate-700">
                
                {/* --- HEADER WITH TODAY-ONLY STATUS --- */}
                <div className={`${
                    ticketStatus === 'valid' ? 'bg-green-600' : 
                    ticketStatus === 'future' ? 'bg-blue-600' : 'bg-orange-500'
                } p-7 text-white text-center font-black text-xl tracking-wide flex items-center justify-center gap-3 shadow-lg`}>
                  {ticketStatus === 'valid' ? <CheckCircle size={28} /> : 
                   ticketStatus === 'future' ? <Calendar size={28} /> : <AlertTriangle size={28} />}
                  
                  {ticketStatus === 'valid' ? 'ENTRY PERMITTED' : 
                   ticketStatus === 'future' ? 'FUTURE TICKET' : 'EXPIRED TICKET'}
                </div>

                <div className="p-8 space-y-6">
                  <div className="flex gap-5 border-b dark:border-slate-700 pb-5"><div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-2xl text-indigo-600"><User size={28} /></div><div><p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">Passenger</p><p className="font-bold text-2xl text-gray-800 dark:text-white leading-tight">{ticketData.customerName || "Verified Guest"}</p></div></div>
                  <div className="flex gap-5 border-b dark:border-slate-700 pb-5"><div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-2xl text-orange-600"><Bus size={28} /></div><div className="flex-1"><p className="text-[10px] text-gray-400 uppercase mb-1 font-black tracking-widest">Route Details</p><p className="font-bold text-xl text-gray-900 dark:text-white leading-tight">{ticketData.busId?.name}</p><div className="text-indigo-600 dark:text-indigo-400 font-black text-sm flex items-center gap-2 mt-1"><span>{ticketData.busId?.from}</span> <ArrowRight size={14}/> <span>{ticketData.busId?.to}</span></div></div></div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-700">
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">Travel Date</p>
                        <p className={`font-black text-lg ${ticketStatus==='valid' ? 'text-green-600' : 'text-red-500'}`}>{ticketData.travelDate}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-700"><p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">Seats</p><p className="font-black text-lg dark:text-white tracking-widest">{ticketData.seatNumbers?.join(', ')}</p></div>
                  </div>

                  {/* ✅ CONFIRM BOARDING BUTTON (ENABLED FOR TODAY ONLY) */}
                  {ticketData.status === 'Boarded' ? (
                     <div className="bg-green-100 text-green-700 p-5 rounded-2xl text-center font-black border-2 border-green-200 flex items-center justify-center gap-2 uppercase tracking-tighter shadow-inner"><UserCheck /> Already Boarded</div>
                  ) : (
                     <button 
                        onClick={confirmBoarding} 
                        disabled={confirmLoading || ticketStatus !== 'valid'} 
                        className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all ${
                            ticketStatus === 'valid' 
                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-900/20' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                        }`}
                     >
                        {confirmLoading ? <Loader className="animate-spin" /> : <UserCheck />} 
                        {ticketStatus === 'future' ? 'BOARDING NOT OPEN' : 
                         ticketStatus === 'expired' ? 'TICKET EXPIRED' : 'CONFIRM BOARDING'}
                     </button>
                  )}
                  <button onClick={() => setTicketData(null)} className="w-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 py-5 rounded-2xl font-black text-lg active:scale-95 transition-all hover:bg-slate-200">Reset Scanner</button>
                </div>
              </div>
            )}
            {scanError && (
              <div className="bg-red-500/10 border border-red-500/30 p-10 rounded-[2.5rem] text-center shadow-2xl animate-in zoom-in">
                <XCircle size={72} className="mx-auto text-red-500 mb-6" /><p className="text-red-400 font-bold mb-10 text-lg leading-relaxed">{scanError}</p><button onClick={() => {setScanError(''); setTicketData(null);}} className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black shadow-lg">Try Again</button>
              </div>
            )}
            {scanLoading && <div className="text-center py-20 animate-in fade-in"><Loader className="animate-spin text-indigo-500 mx-auto" size={64} /><p className="mt-6 font-black uppercase text-xs tracking-widest text-gray-500">Connecting EnteBus Database...</p></div>}
          </div>
        </div>
      )}

      {/* --- TAB 4: COMPLAINTS --- */}
      {activeTab === 'complaints' && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 animate-in slide-in-from-right-4 duration-500">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b dark:border-slate-700">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-xl text-yellow-600"><MessageSquareWarning size={32}/></div>
            <div><h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Support Tickets</h3><p className="text-gray-500 text-sm">Review issues submitted by travelers.</p></div>
          </div>
          <div className="space-y-4">
            {complaints.length > 0 ? complaints.map((c) => (
              <div key={c._id} className="bg-gray-50 dark:bg-slate-900 p-6 rounded-xl border dark:border-slate-700 flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${c.status === 'Resolved' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>{c.status}</span>
                    <span className="text-xs text-gray-500 tracking-widest">• {new Date(c.date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{c.category}</h3>
                  <p className="text-gray-600 dark:text-slate-300 mt-2 mb-4 p-4 rounded-lg border dark:border-slate-700 italic bg-white dark:bg-slate-800">"{c.message}"</p>
                  <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"><span>Reported By: {c.name}</span><span>Email: {c.email}</span></div>
                </div>
                {c.status === 'Pending' && (<button onClick={() => handleResolveComplaint(c._id)} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold text-xs hover:bg-green-700 transition shadow-md">Resolve Case</button>)}
              </div>
            )) : <div className="text-center py-20 opacity-20"><p className="font-black uppercase tracking-widest">No active complaints.</p></div>}
          </div>
        </div>
      )}

    </div>
  );
}