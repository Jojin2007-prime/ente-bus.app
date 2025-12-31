import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import jsQR from 'jsqr';
import { 
  QrCode, CheckCircle, XCircle, Loader, Bus, 
  User, ImageIcon, RefreshCw,
  X, AlertTriangle, Download, Calendar, MapPin, StopCircle, Camera, ChevronDown
} from 'lucide-react';

export default function TicketVerifier() {
    const [ticketData, setTicketData] = useState(null);
    const [ticketStatus, setTicketStatus] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    
    // Camera States
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const requestRef = useRef(null);

    // --- 1. FETCH ALL AVAILABLE CAMERAS ---
    useEffect(() => {
        const getCameras = async () => {
            try {
                // Request temporary permission to get device labels
                await navigator.mediaDevices.getUserMedia({ video: true });
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                setCameras(videoDevices);
                
                // Default to the first camera found
                if (videoDevices.length > 0 && !selectedCamera) {
                    setSelectedCamera(videoDevices[0].deviceId);
                }
            } catch (err) { 
                console.error("Error listing cameras", err); 
                setError("Could not list cameras. Please allow permissions.");
            }
        };
        getCameras();
    }, []);

    // --- 2. START THE CHOSEN CAMERA ---
    const startCamera = async () => {
        setIsCameraActive(true);
        setError('');
        setTicketData(null);
        try {
            const constraints = {
                video: { 
                    deviceId: { exact: selectedCamera },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                requestRef.current = requestAnimationFrame(scanFrame);
            }
        } catch (err) {
            setError("Selected camera could not start.");
            setIsCameraActive(false);
        }
    };

    const stopCamera = () => {
        setIsCameraActive(false);
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };

    // --- 3. LIVE SCAN ENGINE ---
    const scanFrame = () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            canvas.height = videoRef.current.videoHeight;
            canvas.width = videoRef.current.videoWidth;
            
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });

            if (code) {
                // Extract 24-character MongoDB ID
                const idMatch = code.data.match(/[a-f\d]{24}/i);
                if (idMatch) {
                    stopCamera();
                    verifyTicket(idMatch[0]);
                    return;
                }
            }
        }
        if (isCameraActive) requestRef.current = requestAnimationFrame(scanFrame);
    };

    // --- 4. ACCURATE IMAGE UPLOAD (Iterative Repair) ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true); setError('');

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width; canvas.height = img.height;
                ctx.imageSmoothingEnabled = false;

                // TRY 1: Enhance Contrast
                ctx.filter = 'contrast(2.5) grayscale(1)';
                ctx.drawImage(img, 0, 0);
                let data = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let code = jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" });

                // TRY 2: Hard Binarization (Pure Black/White)
                if (!code) {
                    const pixels = data.data;
                    for (let i = 0; i < pixels.length; i += 4) {
                        const v = (pixels[i] + pixels[i+1] + pixels[i+2]) / 3 < 128 ? 0 : 255;
                        pixels[i] = pixels[i+1] = pixels[i+2] = v;
                    }
                    ctx.putImageData(data, 0, 0);
                    code = jsQR(pixels, data.width, data.height, { inversionAttempts: "attemptBoth" });
                }

                if (code) {
                    const idMatch = code.data.match(/[a-f\d]{24}/i);
                    if (idMatch) verifyTicket(idMatch[0]);
                    else setError("Invalid QR data.");
                } else {
                    setError("Could not read QR. Please use a clearer image.");
                }
                setLoading(false);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    // --- 5. GLOBAL VERIFICATION (No email check) ---
    const verifyTicket = async (id) => {
        setLoading(true); setTicketData(null); setError(''); setTicketStatus(null);
        try {
            const res = await axios.get(`https://entebus-api.onrender.com/api/verify/${id}`);
            const ticket = res.data;

            const travelDate = new Date(ticket.travelDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            travelDate.setHours(0, 0, 0, 0);

            setTicketStatus(travelDate < today ? 'expired' : 'valid');
            setTicketData(ticket);
        } catch (err) { 
            setError("❌ Ticket not found in database."); 
        } finally { 
            setLoading(false); 
        }
    };

    const downloadTicket = async (id) => {
        setDownloading(true);
        try {
            const res = await axios.get(`https://entebus-api.onrender.com/api/tickets/download/${id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `EnteBus_Ticket.jpg`);
            document.body.appendChild(link);
            link.click();
            setDownloading(false);
        } catch (e) { setDownloading(false); }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 font-sans">
            <header className="text-center mb-8">
                <QrCode className="text-indigo-500 mx-auto mb-4" size={50} />
                <h2 className="text-3xl font-black">Ente Bus Verifier</h2>
                <p className="text-gray-500 text-sm">Select any camera lens to begin</p>
            </header>

            {isCameraActive && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
                    <div className="relative w-full max-w-md aspect-square rounded-[3rem] border-4 border-indigo-500 overflow-hidden shadow-2xl">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/30 rounded-3xl animate-pulse"></div>
                    </div>
                    <button onClick={stopCamera} className="mt-10 bg-red-600 px-12 py-4 rounded-2xl font-black shadow-lg">Close Scanner</button>
                </div>
            )}

            {!ticketData && !loading && !error && !isCameraActive && (
                <div className="w-full max-w-sm space-y-6">
                    {/* --- CAMERA SELECTOR --- */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Choose Camera Source</label>
                        <div className="relative">
                            <select 
                                value={selectedCamera} 
                                onChange={(e) => setSelectedCamera(e.target.value)}
                                className="w-full bg-gray-800 border-2 border-gray-700 p-4 rounded-2xl appearance-none font-bold outline-none focus:border-indigo-500 transition-all"
                            >
                                {cameras.map(cam => (
                                    <option key={cam.deviceId} value={cam.deviceId}>
                                        {cam.label || `Camera ${cam.deviceId.slice(0, 5)}`}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>
                    </div>

                    <button onClick={startCamera} className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 transition-all shadow-xl shadow-indigo-900/40">
                        <Camera size={32} /> Open Scanner
                    </button>

                    <div onClick={() => fileInputRef.current.click()} className="bg-gray-800 p-10 rounded-3xl border-2 border-dashed border-gray-700 text-center cursor-pointer hover:border-indigo-500 transition-all">
                        <ImageIcon size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="font-bold">Upload Screenshot</p>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                </div>
            )}

            {ticketData && (
                <div className="w-full max-w-md bg-white text-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in">
                    <div className={`${ticketStatus === 'valid' ? 'bg-green-600' : 'bg-orange-500'} p-6 text-white text-center font-black text-xl tracking-wide`}>
                        {ticketStatus === 'valid' ? 'TICKET VERIFIED' : 'TICKET EXPIRED'}
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="flex gap-4 border-b pb-4">
                            <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><User /></div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Passenger</p>
                                <p className="font-bold text-2xl text-gray-800">{ticketData.customerName}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 border-b pb-4">
                            <div className="bg-orange-50 p-4 rounded-2xl text-orange-600"><Bus /></div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Bus Details</p>
                                <p className="font-bold">{ticketData.busId?.from} → {ticketData.busId?.to}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-3xl border">
                                <p className="text-[10px] uppercase text-gray-400 font-black mb-1">Date</p>
                                <p className="font-black text-indigo-600">{ticketData.travelDate}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-3xl border">
                                <p className="text-[10px] uppercase text-gray-400 font-black mb-1">Seats</p>
                                <p className="font-black text-indigo-600">{ticketData.seatNumbers?.join(', ')}</p>
                            </div>
                        </div>
                        <div className="pt-4 space-y-3">
                            <button onClick={() => downloadTicket(ticketData._id)} disabled={downloading} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-100">
                                {downloading ? <Loader className="animate-spin" /> : <Download />} Download Ticket
                            </button>
                            <button onClick={() => setTicketData(null)} className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold">Close Result</button>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-[2rem] text-center max-w-sm">
                    <XCircle size={64} className="mx-auto text-red-500 mb-6" />
                    <p className="text-red-400 font-bold mb-8 leading-relaxed">{error}</p>
                    <button onClick={() => {setError(''); setTicketData(null);}} className="bg-red-600 text-white px-10 py-3 rounded-xl font-black shadow-lg shadow-red-900/40">Try Again</button>
                </div>
            )}

            {loading && <div className="text-center"><Loader className="animate-spin text-indigo-500 mx-auto" size={60} /><p className="mt-4 font-black uppercase text-[10px] tracking-widest text-gray-500">Querying Database...</p></div>}
        </div>
    );
}