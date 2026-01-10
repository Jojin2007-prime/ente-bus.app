import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  QrCode, CheckCircle, XCircle, Loader, Bus, 
  User, ImageIcon, RefreshCw, AlertTriangle, 
  StopCircle, Camera, ChevronDown, ArrowRight
} from 'lucide-react';

export default function TicketVerifier() {
    // --- 1. State Management ---
    const [ticketData, setTicketData] = useState(null);
    const [ticketStatus, setTicketStatus] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    
    // --- 2. Hardware & Engine Refs ---
    const html5QrCodeRef = useRef(null);
    const fileInputRef = useRef(null);

    // ✅ Centralized Localhost URL
    const API_URL = "https://ente-bus-app-api.onrender.com";

    // --- 3. Digital Success Beep ---
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

    // --- 4. Camera Lifecycle Management ---
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

    const initHardware = async () => {
        try {
            setError('');
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
                setCameras(devices);
                const backCam = devices.find(d => 
                    d.label.toLowerCase().includes('back') || 
                    d.label.toLowerCase().includes('environment')
                ) || devices[0];
                setSelectedCamera(backCam.id);
            } else {
                setError("No camera hardware found.");
            }
        } catch (err) {
            setError("Camera access was denied.");
        }
    };

    useEffect(() => {
        initHardware();
        return () => { stopScannerInstance(); };
    }, []);

    const startCamera = async () => {
        if (!selectedCamera) return setError("Select a camera first.");
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
                    { fps: 25, qrbox: { width: 250, height: 250 } },
                    (decodedText) => handleScannedID(decodedText),
                    () => {}
                );
            } catch (err) {
                setError("Camera failed to initialize.");
                setIsCameraActive(false);
            }
        }, 300);
    };

    // --- 5. Data Processing Logic ---
    const handleScannedID = (decodedText) => {
        const idMatch = decodedText.match(/[a-f\d]{24}/i);
        if (idMatch) {
            playSuccessBeep();
            stopScannerInstance();
            setIsCameraActive(false);
            verifyTicket(idMatch[0]);
        }
    };

    const verifyTicket = async (id) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/admin/verify-ticket/${id}`);
            setTicketData(res.data.booking);
            setTicketStatus(res.data.status);
        } catch (err) { 
            setError("This QR does not match our records."); 
        } finally { 
            setLoading(false); 
        }
    };

    // --- 6. Professional Media Scan ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true); setError(''); setTicketData(null);
        await stopScannerInstance();

        try {
            const scanner = new Html5Qrcode("file-worker", { verbose: false });
            try {
                const result = await scanner.scanFile(file, true);
                handleScannedID(result);
            } catch (err) {
                const repairedResult = await processAndScan(file);
                handleScannedID(repairedResult);
            }
        } catch (err) {
            setError("QR Code not detected in this image.");
        } finally {
            setLoading(false);
            e.target.value = null; 
        }
    };

    const processAndScan = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = async () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width; canvas.height = img.height;
                    ctx.filter = 'contrast(2.0) grayscale(1)'; 
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob(async (blob) => {
                        const repairedFile = new File([blob], "fix.png", { type: "image/png" });
                        const scanner = new Html5Qrcode("file-worker");
                        try {
                            const res = await scanner.scanFile(repairedFile, false);
                            resolve(res);
                        } catch (err) { reject(err); }
                    });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-500 flex flex-col items-center justify-center p-6 font-sans">
            <div id="file-worker" style={{ display: 'none' }}></div>

            <header className="text-center mb-10">
                <div className="bg-indigo-600/10 dark:bg-indigo-600/20 p-5 rounded-full w-fit mx-auto mb-4 border border-indigo-500/20 dark:border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.1)] dark:shadow-[0_0_50px_rgba(79,70,229,0.25)]">
                    <QrCode className="text-indigo-600 dark:text-indigo-500" size={50} />
                </div>
                <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tighter">Ticket Verifier</h2>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-[0.3em] mt-2">Validity Check Mode</p>
            </header>

            {/* SCANNER VIEWPORT */}
            {isCameraActive && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4 backdrop-blur-md bg-black/90">
                    <div className="relative w-full max-w-md aspect-square rounded-[3.5rem] border-4 border-indigo-600 overflow-hidden shadow-[0_0_80px_rgba(79,70,229,0.4)]">
                        <div id="reader" className="w-full h-full bg-slate-950"></div>
                        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-indigo-400 rounded-3xl animate-pulse pointer-events-none"></div>
                    </div>
                    <button onClick={() => { stopScannerInstance(); setIsCameraActive(false); }} className="mt-12 bg-red-600 hover:bg-red-700 text-white px-12 py-5 rounded-2xl font-extrabold flex items-center gap-3 uppercase text-xs tracking-widest active:scale-95 transition-all shadow-xl">
                        <StopCircle size={20} /> Close Scanner
                    </button>
                </div>
            )}

            {/* INITIAL DASHBOARD ACTIONS */}
            {!ticketData && !loading && !error && !isCameraActive && (
                <div className="w-full max-w-sm space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-gray-200 dark:border-slate-700 shadow-xl">
                        <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-3 block ml-1">Hardware Lens</label>
                        <div className="relative">
                            <select value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 p-4 rounded-xl font-bold text-sm outline-none appearance-none pr-10 focus:ring-2 ring-indigo-500 transition-all text-slate-900 dark:text-white">
                                {cameras.map(cam => <option key={cam.id} value={cam.id}>{cam.label || "System Lens"}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        </div>
                    </div>

                    <button onClick={startCamera} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-7 rounded-[2.5rem] font-extrabold text-xl uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all">
                        <Camera size={28} /> Start Scanner
                    </button>

                    <div onClick={() => fileInputRef.current.click()} className="bg-white dark:bg-slate-800/30 p-8 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-slate-700 text-center cursor-pointer hover:border-indigo-500 transition-all group shadow-sm">
                        <ImageIcon size={40} className="mx-auto text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 mb-3 transition-colors" />
                        <p className="font-extrabold text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-200 uppercase text-[10px] tracking-widest">Verify Ticket Image</p>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                </div>
            )}

            {/* RESULT CARD */}
            {ticketData && (
                <div className="w-full max-w-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[3rem] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-slate-700 animate-in zoom-in duration-300">
                    <div className={`p-6 text-white text-center font-extrabold text-lg tracking-widest uppercase flex items-center justify-center gap-3 shadow-lg
                        ${ticketStatus === 'success' ? 'bg-indigo-600' : 'bg-orange-500'}`}>
                        {ticketStatus === 'success' ? <CheckCircle size={26}/> : <AlertTriangle size={26} />}
                        {ticketStatus === 'success' ? 'Verified: Valid' : 'Alert: Expired'}
                    </div>

                    <div className="p-10 space-y-8">
                        <div className="flex gap-5 border-b border-gray-100 dark:border-slate-700 pb-6">
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-2xl text-indigo-600 dark:text-indigo-400 shadow-sm"><User size={28} /></div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">Traveler</p>
                                <p className="font-extrabold text-2xl uppercase tracking-tighter">{ticketData.customerName}</p>
                            </div>
                        </div>

                        <div className="flex gap-5 border-b border-gray-100 dark:border-slate-700 pb-6">
                            <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-2xl text-orange-600 dark:text-orange-400 shadow-sm"><Bus size={28} /></div>
                            <div className="flex-1">
                                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">Service</p>
                                <p className="font-extrabold text-lg uppercase leading-tight">{ticketData.busId?.name}</p>
                                <div className="text-indigo-600 dark:text-indigo-400 font-extrabold text-[11px] uppercase tracking-widest flex items-center gap-2 mt-1">
                                   {ticketData.busId?.from} <ArrowRight size={14}/> {ticketData.busId?.to}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-slate-900/50 p-5 rounded-3xl border border-gray-100 dark:border-slate-700">
                                <p className="text-[9px] text-slate-400 font-extrabold uppercase mb-1">Journey Date</p>
                                <p className="font-extrabold text-sm">{ticketData.travelDate}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-900/50 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 text-right">
                                <p className="text-[9px] text-slate-400 font-extrabold uppercase mb-1">Seat Assignment</p>
                                <p className="font-extrabold text-sm tracking-widest text-indigo-600 dark:text-indigo-400">{ticketData.seatNumbers?.join(', ')}</p>
                            </div>
                        </div>

                        <button onClick={() => setTicketData(null)} className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-6 rounded-[2rem] font-extrabold uppercase text-sm tracking-[0.2em] active:scale-95 transition-all shadow-lg">
                            Done & Scan Next
                        </button>
                    </div>
                </div>
            )}

            {/* ERROR CARD */}
            {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-10 rounded-[3rem] text-center max-w-sm shadow-2xl animate-in zoom-in duration-300">
                    <XCircle size={60} className="mx-auto text-red-500 mb-6" />
                    <p className="text-red-600 dark:text-red-400 font-extrabold uppercase text-xs tracking-widest mb-10 leading-relaxed">{error}</p>
                    <button onClick={() => {setError(''); setTicketData(null);}} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-extrabold uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Try Again</button>
                </div>
            )}

            {/* LOADER */}
            {loading && (
                <div className="text-center py-10">
                    <Loader className="animate-spin text-indigo-500 mx-auto" size={50} />
                    <p className="mt-6 font-extrabold uppercase text-[10px] tracking-[0.3em] text-slate-400 dark:text-slate-500 animate-pulse">Checking Records...</p>
                </div>
            )}
        </div>
    );
}