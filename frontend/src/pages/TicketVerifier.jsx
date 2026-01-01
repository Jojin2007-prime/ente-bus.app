import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  QrCode, CheckCircle, XCircle, Loader, Bus, 
  User, ImageIcon, RefreshCw, AlertTriangle, 
  Download, Calendar, MapPin, StopCircle, Camera, ChevronDown, X 
} from 'lucide-react';

export default function TicketVerifier() {
    // --- State Management ---
    const [ticketData, setTicketData] = useState(null);
    const [ticketStatus, setTicketStatus] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    
    // --- Refs for Hardware Control ---
    const html5QrCodeRef = useRef(null);
    const fileInputRef = useRef(null);

    const API_URL = "https://entebus-api.onrender.com";

    // --- Helper: Format 24h time to AM/PM ---
    const formatTime = (time24) => {
        if (!time24) return "";
        const [hours, minutes] = time24.split(':');
        const period = +hours >= 12 ? 'PM' : 'AM';
        const hours12 = (+hours % 12) || 12;
        return `${hours12}:${minutes} ${period}`;
    };

    // --- 1. Hardware Discovery ---
    const initHardware = async () => {
        try {
            setError('');
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
                setCameras(devices);
                // Default to the Back/Rear camera
                const backCam = devices.find(d => 
                    d.label.toLowerCase().includes('back') || 
                    d.label.toLowerCase().includes('rear') ||
                    d.label.toLowerCase().includes('environment')
                ) || devices[devices.length - 1];
                
                setSelectedCamera(backCam.id);
            } else {
                setError("No cameras found on this device.");
            }
        } catch (err) {
            console.error("Hardware Init Error:", err);
            setError("Camera permission denied. Please allow access in settings.");
        }
    };

    useEffect(() => {
        initHardware();
        return () => { stopScannerInstance(); };
    }, []);

    // --- 2. Instance Manager (Prevents "Camera Busy" Errors) ---
    const stopScannerInstance = async () => {
        if (html5QrCodeRef.current) {
            if (html5QrCodeRef.current.isScanning) {
                await html5QrCodeRef.current.stop();
            }
            html5QrCodeRef.current.clear();
            html5QrCodeRef.current = null;
        }
    };

    const startCamera = async () => {
        if (!selectedCamera) return setError("Please select a lens.");
        
        await stopScannerInstance(); 
        setIsCameraActive(true);
        setError('');
        setTicketData(null);

        // Wait for 'reader' div to render in DOM
        setTimeout(async () => {
            try {
                const scanner = new Html5Qrcode("reader");
                html5QrCodeRef.current = scanner;
                
                const config = {
                    fps: 20,
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        const size = Math.floor(minEdge * 0.75);
                        return { width: size, height: size };
                    },
                    aspectRatio: 1.0
                };

                await scanner.start(
                    selectedCamera, 
                    config, 
                    (decodedText) => handleScannedID(decodedText),
                    () => {} // Ignore scan misses
                );
            } catch (err) {
                setError("Failed to start camera. Close other apps using the camera.");
                setIsCameraActive(false);
            }
        }, 300);
    };

    // --- 3. High-Accuracy Media Scan (Any size/quality) ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setError('');
        setTicketData(null);
        setIsCameraActive(false);

        await stopScannerInstance();

        try {
            const scanner = new Html5Qrcode("file-scan-worker");
            html5QrCodeRef.current = scanner;
            
            // Pass 1: Direct Scan
            try {
                const result = await scanner.scanFile(file, true);
                handleScannedID(result);
            } catch (err) {
                // Pass 2: Manual Enhancement Repair (For blurry/small screenshots)
                const repairedResult = await attemptManualRepair(file);
                handleScannedID(repairedResult);
            }
        } catch (err) {
            setError("QR Code not readable. Ensure the screenshot is clear.");
        } finally {
            setLoading(false);
            await stopScannerInstance();
            e.target.value = null; 
        }
    };

    // Creates a high-contrast B&W version of the image to force detection
    const attemptManualRepair = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = async () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width; canvas.height = img.height;
                    
                    // Vision Pre-processing
                    ctx.filter = 'contrast(2.5) grayscale(1)'; 
                    ctx.drawImage(img, 0, 0);
                    
                    canvas.toBlob(async (blob) => {
                        const repairedFile = new File([blob], "temp.png", { type: "image/png" });
                        const scanner = new Html5Qrcode("file-scan-worker");
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

    const handleScannedID = (decodedText) => {
        // Find MongoDB ID in scanned string
        const cleanID = decodedText.replace('TicketID:', '').trim();
        const idMatch = cleanID.match(/[a-f\d]{24}/i);
        if (idMatch) {
            stopScannerInstance();
            setIsCameraActive(false);
            verifyTicket(idMatch[0]);
        }
    };

    // --- 4. API Verification ---
    const verifyTicket = async (id) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/verify/${id}`);
            const ticket = res.data;
            
            // Check Expiry
            const travelDate = new Date(ticket.travelDate);
            const today = new Date();
            today.setHours(0,0,0,0); travelDate.setHours(0,0,0,0);
            
            setTicketStatus(travelDate < today ? 'expired' : 'valid');
            setTicketData(ticket);
        } catch (err) {
            setError("❌ Ticket not found in EnteBus database.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 font-sans">
            {/* Hidden Worker Element */}
            <div id="file-scan-worker" style={{ display: 'none' }}></div>

            <header className="text-center mb-10">
                <div className="bg-indigo-600/20 p-5 rounded-full w-fit mx-auto mb-4 border border-indigo-500/30">
                    <QrCode className="text-indigo-500" size={50} />
                </div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Ente Bus Verifier</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Conductor Entry Module</p>
            </header>

            {/* --- Scanner UI --- */}
            {isCameraActive && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
                    <div className="relative w-full max-w-md aspect-square rounded-[3rem] border-4 border-indigo-600 overflow-hidden shadow-[0_0_80px_rgba(79,70,229,0.4)]">
                        <div id="reader" className="w-full h-full bg-slate-950"></div>
                        <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-indigo-400 rounded-3xl animate-pulse pointer-events-none"></div>
                    </div>
                    <button onClick={() => { stopScannerInstance(); setIsCameraActive(false); }} className="mt-12 bg-red-600 px-12 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl active:scale-95 transition-all">
                        <StopCircle size={24} /> Close Scanner
                    </button>
                </div>
            )}

            {/* --- Main Action View --- */}
            {!ticketData && !loading && !error && !isCameraActive && (
                <div className="w-full max-w-sm space-y-6 animate-in fade-in duration-500">
                    <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1 mb-2 block">Lens Source</label>
                        <div className="relative">
                            <select value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-indigo-500 appearance-none transition-all pr-10">
                                {cameras.length === 0 && <option>Searching hardware...</option>}
                                {cameras.map(cam => <option key={cam.id} value={cam.id}>{cam.label}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        </div>
                        <button onClick={initHardware} className="text-[10px] text-indigo-400 font-bold flex items-center gap-1 mt-3 ml-1 active:scale-95"><RefreshCw size={10}/> Refresh Cameras</button>
                    </div>

                    <button onClick={startCamera} className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all">
                        <Camera size={32} /> Open Scanner
                    </button>

                    <div className="flex items-center gap-4 py-2 opacity-30">
                        <div className="h-px bg-gray-500 flex-1"></div>
                        <span className="text-[10px] font-black uppercase">OR</span>
                        <div className="h-px bg-gray-500 flex-1"></div>
                    </div>

                    <div onClick={() => fileInputRef.current.click()} className="bg-slate-800/50 p-10 rounded-3xl border-2 border-dashed border-slate-700 text-center cursor-pointer hover:border-indigo-500 group transition-all shadow-2xl">
                        <ImageIcon size={48} className="mx-auto text-slate-600 group-hover:text-indigo-500 mb-4 transition-colors" />
                        <p className="font-bold text-slate-400 group-hover:text-slate-200 uppercase text-xs">Verify Screenshot</p>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                </div>
            )}

            {/* --- Verification Results --- */}
            {ticketData && (
                <div className="w-full max-w-md bg-white text-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in">
                    <div className={`${ticketStatus === 'valid' ? 'bg-green-600' : 'bg-orange-500'} p-7 text-white text-center font-black text-xl flex items-center justify-center gap-3 shadow-lg`}>
                        {ticketStatus === 'valid' ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
                        {ticketStatus === 'valid' ? 'TICKET VERIFIED' : 'TICKET EXPIRED'}
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="flex gap-5 border-b pb-5">
                            <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><User size={28} /></div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Passenger</p>
                                <p className="font-bold text-2xl text-gray-800 leading-tight">{ticketData.customerName || "Guest User"}</p>
                            </div>
                        </div>

                        <div className="flex gap-5 border-b pb-5">
                            <div className="bg-orange-50 p-4 rounded-2xl text-orange-600"><Bus size={28} /></div>
                            <div className="flex-1">
                                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Bus Service</p>
                                <p className="font-bold text-xl text-gray-900 leading-tight">{ticketData.busId?.name || "EnteBus Regular"}</p>
                                <div className="text-indigo-600 font-black text-sm">{ticketData.busId?.from} → {ticketData.busId?.to}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-5 rounded-3xl border">
                                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Travel Date</p>
                                <p className="font-black text-lg">{ticketData.travelDate}</p>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-3xl border">
                                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Assigned Seats</p>
                                <p className="font-black text-lg">{ticketData.seatNumbers?.join(', ')}</p>
                            </div>
                        </div>

                        <div className="bg-indigo-900 text-white p-4 rounded-2xl text-center shadow-lg">
                           <p className="text-[10px] font-black uppercase opacity-60">Departure Time</p>
                           <p className="text-xl font-bold">{formatTime(ticketData.busId?.departureTime)}</p>
                        </div>

                        <button onClick={() => setTicketData(null)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg active:scale-95 transition-all shadow-xl">Scan Next</button>
                    </div>
                </div>
            )}

            {/* --- Error Handling --- */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-10 rounded-[2.5rem] text-center max-w-sm shadow-2xl animate-in zoom-in">
                    <XCircle size={72} className="mx-auto text-red-500 mb-6" />
                    <p className="text-red-400 font-bold mb-10 text-lg leading-relaxed">{error}</p>
                    <button onClick={() => {setError(''); setTicketData(null);}} className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black active:scale-95 transition-all">Try Again</button>
                </div>
            )}

            {/* --- Loading State --- */}
            {loading && (
                <div className="text-center py-10 animate-in fade-in">
                    <Loader className="animate-spin text-indigo-500 mx-auto" size={64} />
                    <p className="mt-6 font-black uppercase text-xs tracking-widest text-slate-500">Retrieving Database Record...</p>
                </div>
            )}
        </div>
    );
}