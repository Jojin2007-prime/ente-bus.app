import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  CheckCircle, XCircle, Loader, 
  User, ImageIcon, RefreshCw, AlertTriangle, 
  StopCircle, Camera, ChevronDown, ArrowRight, Clock, Ban, Bus
} from 'lucide-react';

// ✅ CUSTOM BUS LOGO COMPONENT
const CustomBusLogo = () => (
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

export default function TicketVerifier() {
    // --- State Management ---
    const [ticketData, setTicketData] = useState(null);
    const [ticketStatus, setTicketStatus] = useState(null); 
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    
    // --- Hardware & Engine Refs ---
    const html5QrCodeRef = useRef(null);
    const fileInputRef = useRef(null);

    const API_URL = "https://ente-bus-app-api.onrender.com";

    // --- Audio Feedback ---
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
        } catch (e) { console.error("Audio error:", e); }
    };

    // --- 1. Hardware Lifecycle ---
    const stopScannerInstance = async () => {
        if (html5QrCodeRef.current) {
            try {
                if (html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop();
                }
                html5QrCodeRef.current.clear();
            } catch (e) { console.warn("Cleanup warning:", e); }
            html5QrCodeRef.current = null;
        }
    };

    useEffect(() => {
        const initHardware = async () => {
            try {
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length > 0) {
                    setCameras(devices);
                    const backCam = devices.find(d => 
                        d.label.toLowerCase().includes('back') || 
                        d.label.toLowerCase().includes('environment')
                    ) || devices[0];
                    setSelectedCamera(backCam.id);
                }
            } catch (err) { setError("Camera access denied."); }
        };
        initHardware();
        return () => { stopScannerInstance(); };
    }, []);

    // --- 2. Live Scanner Logic ---
    const startCamera = async () => {
        if (!selectedCamera) return setError("Please select a camera lens.");
        await stopScannerInstance(); 
        setIsCameraActive(true);
        setError('');
        setTicketData(null);

        setTimeout(async () => {
            try {
                const scanner = new Html5Qrcode("reader");
                html5QrCodeRef.current = scanner;
                await scanner.start(
                    selectedCamera, 
                    { fps: 20, qrbox: { width: 250, height: 250 } },
                    (decodedText) => handleScannedID(decodedText),
                    () => {} 
                );
            } catch (err) {
                setError("Camera failed to start.");
                setIsCameraActive(false);
            }
        }, 300);
    };

    const handleScannedID = (decodedText) => {
        const idMatch = decodedText.match(/[a-f\d]{24}/i);
        if (idMatch) {
            playSuccessBeep();
            stopScannerInstance();
            setIsCameraActive(false);
            verifyTicket(idMatch[0]);
        } else {
            setError("Invalid QR. Scan a valid EnteBus ticket.");
        }
    };

    // --- 3. Server Verification ---
    const verifyTicket = async (id) => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${API_URL}/api/admin/verify-ticket/${id}`);
            setTicketData(res.data.booking);
            setTicketStatus(res.data.status);
            setStatusMessage(res.data.message);
        } catch (err) { 
            setError("Ticket not found in system."); 
        } finally { setLoading(false); }
    };

    // --- 4. Image Upload Logic ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true); setError(''); setTicketData(null);
        await stopScannerInstance();

        try {
            const scanner = new Html5Qrcode("file-worker", { verbose: false });
            const result = await scanner.scanFile(file, true);
            handleScannedID(result);
        } catch (err) {
            setError("QR code not found in this image.");
            setLoading(false);
        } finally {
            e.target.value = null; 
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-all duration-500 font-sans">
            <div id="file-worker" className="hidden"></div>

            <header className="text-center mb-10">
                <div className="bg-indigo-600/10 p-6 rounded-full w-fit mx-auto mb-4 border border-indigo-500/20 shadow-2xl">
                    <CustomBusLogo />
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Ticket Verifier</h1>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 text-center">Authentication Protocol</p>
            </header>

            {/* LIVE CAMERA OVERLAY */}
            {isCameraActive && (
                <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-md">
                    <div className="relative w-full max-w-md aspect-square rounded-[3rem] border-4 border-indigo-600 overflow-hidden shadow-2xl">
                        <div id="reader" className="w-full h-full bg-black"></div>
                        <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-indigo-400 rounded-3xl animate-pulse"></div>
                    </div>
                    <button 
                        onClick={() => { stopScannerInstance(); setIsCameraActive(false); }} 
                        className="mt-12 bg-rose-600 text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95"
                    >
                        <StopCircle size={20} className="inline mr-2" /> Cancel Scan
                    </button>
                </div>
            )}

            {/* MAIN DASHBOARD */}
            {!ticketData && !loading && !error && !isCameraActive && (
                <div className="w-full max-w-sm space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">Lens Selection</label>
                        <div className="relative">
                            <select 
                                value={selectedCamera} 
                                onChange={(e) => setSelectedCamera(e.target.value)} 
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-xl font-bold text-sm text-slate-900 dark:text-white appearance-none outline-none"
                            >
                                {cameras.map(cam => <option key={cam.id} value={cam.id}>{cam.label || "System Lens"}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <button onClick={startCamera} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-7 rounded-[2.5rem] font-black text-lg uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all">
                        <Camera size={28} /> Start Live Scan
                    </button>

                    <button onClick={() => fileInputRef.current.click()} className="w-full bg-white dark:bg-slate-900 text-slate-500 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95">
                        <ImageIcon size={18} /> Upload from Gallery
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                </div>
            )}

            {/* PROFESSIONAL BOARDING PASS RESULT */}
            {ticketData && (
                <div className="w-full max-w-md animate-in zoom-in duration-300">
                    <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800">
                        
                        {/* Status Header */}
                        <div className={`p-8 text-white text-center transition-colors duration-500 ${
                            ticketStatus === 'success' ? 'bg-emerald-600' : 
                            ticketStatus === 'boarded_already' ? 'bg-amber-500' :
                            ticketStatus === 'expired' ? 'bg-rose-600' : 'bg-indigo-600'}`}>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Electronic Boarding Pass</p>
                            <div className="flex items-center justify-center gap-3">
                                {ticketStatus === 'success' || ticketStatus === 'boarded_already' ? <CheckCircle size={32}/> : 
                                 ticketStatus === 'expired' ? <Ban size={32}/> : <Clock size={32}/>}
                                <h3 className="text-2xl font-black uppercase tracking-tighter">{statusMessage}</h3>
                            </div>
                        </div>

                        {/* Passenger & Voyage Info */}
                        <div className="p-8 space-y-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Traveler</p>
                                    <h4 className="text-xl font-black uppercase text-slate-800 dark:text-white">{ticketData.customerName}</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Verification</p>
                                    <span className="font-bold text-[10px] uppercase px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">Digital-ID</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 py-6 border-y border-dashed border-slate-200 dark:border-slate-800">
                                <div className="flex-1 text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Origin</p>
                                    <h5 className="font-black text-base uppercase text-indigo-600 truncate">{ticketData.busId?.from}</h5>
                                </div>
                                <Bus size={20} className="text-slate-300 rotate-90" />
                                <div className="text-right flex-1 text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                                    <h5 className="font-black text-base uppercase text-indigo-600 truncate">{ticketData.busId?.to}</h5>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 text-center">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Voyage Date</p>
                                    <p className={`font-black text-sm uppercase ${ticketStatus === 'expired' ? 'text-rose-600' : 'text-slate-800 dark:text-white'}`}>{ticketData.travelDate}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Seat Assignment</p>
                                    <p className="font-black text-sm text-indigo-600 tracking-widest">{ticketData.seatNumbers?.join(', ')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Visual Perforation (Punch-holes) */}
                        <div className="relative flex items-center px-4">
                            <div className="absolute left-[-12px] w-6 h-6 bg-slate-50 dark:bg-slate-950 rounded-full border-r border-slate-100 dark:border-slate-800 shadow-inner"></div>
                            <div className="w-full border-t-2 border-dashed border-slate-100 dark:border-slate-800"></div>
                            <div className="absolute right-[-12px] w-6 h-6 bg-slate-50 dark:bg-slate-950 rounded-full border-l border-slate-100 dark:border-slate-800 shadow-inner"></div>
                        </div>

                        {/* Footer Action */}
                        <div className="p-8 bg-slate-50 dark:bg-slate-900/50">
                            <button onClick={() => { setTicketData(null); setTicketStatus(null); }} className="w-full py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl transition-all active:scale-95">
                                Scan Next Ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ERROR CARD */}
            {error && (
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] text-center max-w-sm shadow-2xl border border-rose-100 animate-in zoom-in">
                    <XCircle size={60} className="mx-auto text-rose-500 mb-6" />
                    <p className="text-rose-600 font-black uppercase text-xs tracking-widest mb-8 leading-relaxed text-center">{error}</p>
                    <button onClick={() => {setError(''); setIsCameraActive(false);}} className="bg-rose-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95">Try Again</button>
                </div>
            )}

            {loading && (
                <div className="text-center py-10 flex flex-col items-center">
                    <Loader className="animate-spin text-indigo-600" size={50} />
                    <p className="mt-6 font-extrabold uppercase text-[10px] tracking-[0.3em] text-slate-400">Verifying Ticket...</p>
                </div>
            )}
        </div>
    );
}