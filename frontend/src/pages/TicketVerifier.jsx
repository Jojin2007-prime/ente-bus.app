import React, { useState, useRef } from 'react';
import axios from 'axios';
import jsQR from 'jsqr';
// Note: Capacitor imports removed for Web Development to prevent "Module Not Found" errors
import { 
  QrCode, CheckCircle, XCircle, Loader, Bus, 
  User, Image as ImageIcon, 
  X, AlertTriangle, Download, Calendar, MapPin
} from 'lucide-react';

export default function TicketVerifier() {
    const [ticketData, setTicketData] = useState(null);
    const [ticketStatus, setTicketStatus] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    
    const fileInputRef = useRef(null);

    // --- ✅ WEB-STANDARD DOWNLOAD LOGIC ---
    // Replaces Filesystem.writeFile and Share.share for standard browsers
    const downloadTicket = async (ticketId) => {
        setDownloading(true);
        try {
            const response = await axios({
                url: `https://entebus-api.onrender.com/api/tickets/download/${ticketId}`,
                method: 'GET',
                responseType: 'blob', // Important for images/files
            });

            // Standard Web approach to trigger a download
            const blob = new Blob([response.data], { type: 'image/jpeg' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `EnteBus_Ticket_${ticketId}.jpg`);
            
            // Append link to body, trigger click, and cleanup
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url); // Free up memory
            
            setDownloading(false);
        } catch (err) {
            console.error("Download Error:", err);
            setError("Failed to download Ticket. Check backend connection.");
            setDownloading(false);
        }
    };

    // --- ✅ API VERIFICATION LOGIC ---
    const verifyTicket = async (id) => {
        setLoading(true); setTicketData(null); setError(''); setTicketStatus(null);
        try {
            const res = await axios.get(`https://entebus-api.onrender.com/api/verify/${id}`);
            const booking = res.data;

            // Date logic to check expiry
            const travelDate = new Date(booking.travelDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            travelDate.setHours(0, 0, 0, 0);

            setTicketStatus(travelDate < today ? 'expired' : 'valid');
            setTicketData(booking);
        } catch (err) { 
            setError('❌ Invalid Ticket ID or Ticket Not Found'); 
        } finally { 
            setLoading(false); 
        }
    };

    // --- ✅ WEB IMAGE SCAN & REPAIR LOGIC ---
    // Uses jsQR engine with Browser Canvas pre-processing (Contrast/Grayscale Repair)
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true); setError('');

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width; canvas.height = img.height;
                    
                    // REPAIR LOGIC: Boost contrast and grayscale to make QR patterns sharp for Web Engine
                    ctx.filter = 'contrast(1.6) brightness(1.1) grayscale(1)';
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    // Web-based decoder (jsQR) - Works in all browsers
                    const code = jsQR(imageData.data, imageData.width, imageData.height, { 
                        inversionAttempts: "attemptBoth" 
                    });

                    if (code) {
                        // Standard EnteBus format: Remove "TicketID:" prefix if present
                        const cleanId = code.data.replace('TicketID:', '').trim();
                        verifyTicket(cleanId);
                    } else {
                        setError("No QR code found. Please upload a clearer screenshot of the ticket.");
                    }
                } catch (err) { 
                    setError("Failed to process image file."); 
                } finally { 
                    setLoading(false); 
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const resetScanner = () => { setTicketData(null); setTicketStatus(null); setError(''); };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 font-sans">
            
            <header className="text-center mb-10">
                <div className="bg-indigo-500/20 p-5 rounded-full w-fit mx-auto mb-4 border border-indigo-500/30">
                    <QrCode className="text-indigo-500" size={48} />
                </div>
                <h2 className="text-4xl font-black tracking-tight">Ente Bus Verifier</h2>
                <p className="text-gray-500 mt-2 font-medium">Standard Web Verification System</p>
            </header>

            {!ticketData && !loading && !error && (
                <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div 
                        onClick={() => fileInputRef.current.click()}
                        className="bg-gray-800 p-12 rounded-[2.5rem] border-2 border-dashed border-gray-700 text-center cursor-pointer hover:border-indigo-500 hover:bg-gray-800/80 transition-all group shadow-2xl"
                    >
                        <div className="bg-gray-900/50 p-6 rounded-3xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <ImageIcon size={64} className="text-gray-600 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <p className="text-white font-bold text-xl">Upload Ticket Image</p>
                        <p className="text-gray-500 text-sm mt-2 font-medium leading-relaxed">Select a screenshot or photo of the QR code</p>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept="image/*" 
                        className="hidden" 
                    />
                </div>
            )}

            {loading && (
                <div className="text-center p-12 bg-gray-800 rounded-[2.5rem] w-full max-w-sm border border-gray-700 shadow-2xl">
                    <div className="relative flex items-center justify-center mb-6">
                        <Loader className="animate-spin text-indigo-500" size={64} />
                        <QrCode className="absolute text-indigo-500/50" size={24} />
                    </div>
                    <p className="text-xl font-black tracking-wide">Processing Image...</p>
                    <p className="text-gray-500 text-sm mt-2">Connecting to EnteBus Database</p>
                </div>
            )}

            {error && (
                <div className="w-full max-w-md p-8 rounded-[2.5rem] bg-red-500/10 border border-red-500/20 text-center shadow-2xl backdrop-blur-sm">
                    <XCircle size={64} className="mx-auto text-red-500 mb-6" />
                    <h3 className="text-2xl font-black text-red-500 mb-2">Verification Failed</h3>
                    <p className="text-red-400/70 font-medium mb-8 leading-relaxed">{error}</p>
                    <button 
                        onClick={resetScanner} 
                        className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-red-500 transition-all active:scale-95 shadow-lg shadow-red-900/40"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {ticketData && (
                <div className="w-full max-w-md bg-white text-gray-900 rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)] animate-in zoom-in duration-500">
                    {/* Dynamic Status Header */}
                    <div className={`${ticketStatus === 'valid' ? 'bg-green-500' : 'bg-orange-500'} p-6 text-white text-center font-black flex items-center justify-center gap-3 text-xl tracking-wide shadow-lg`}>
                        {ticketStatus === 'valid' ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
                        {ticketStatus === 'valid' ? 'TICKET VERIFIED' : 'TICKET EXPIRED'}
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Passenger Details */}
                        <div className="flex items-start gap-5 border-b border-gray-100 pb-6">
                            <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><User size={28} /></div>
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Passenger Name</p>
                                <p className="font-bold text-2xl text-gray-800 leading-tight">{ticketData.customerName || "N/A"}</p>
                                <p className="text-gray-500 font-medium mt-1">{ticketData.customerEmail}</p>
                            </div>
                        </div>

                        {/* Bus & Route Details */}
                        <div className="flex items-start gap-5 border-b border-gray-100 pb-6">
                            <div className="bg-orange-50 p-4 rounded-2xl text-orange-600"><Bus size={28} /></div>
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Bus Details</p>
                                <p className="font-bold text-xl text-gray-800 mb-2">{ticketData.busId?.name || "EnteBus Standard"}</p>
                                <div className="flex items-center gap-3 text-indigo-600 font-black text-lg">
                                    <span>{ticketData.busId?.from || "Source"}</span>
                                    <span className="text-gray-300 font-normal">→</span>
                                    <span>{ticketData.busId?.to || "Destination"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Travel Meta Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 group hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <Calendar size={16} /> 
                                    <span className="text-[10px] font-black uppercase tracking-wider">Travel Date</span>
                                </div>
                                <p className="font-black text-gray-900 text-lg">{ticketData.travelDate}</p>
                            </div>
                            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 group hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <MapPin size={16} /> 
                                    <span className="text-[10px] font-black uppercase tracking-wider">Seats</span>
                                </div>
                                <p className="font-black text-gray-900 text-lg">{ticketData.seatNumbers?.join(', ') || "N/A"}</p>
                            </div>
                        </div>

                        {/* Primary Web Actions */}
                        <div className="pt-6 space-y-4">
                            <button 
                                onClick={() => downloadTicket(ticketData._id)} 
                                disabled={downloading} 
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-70"
                            >
                                {downloading ? <Loader className="animate-spin" size={24} /> : <Download size={24} />}
                                {downloading ? 'Preparing Image...' : 'Download Ticket Image'}
                            </button>
                            
                            <button 
                                onClick={resetScanner} 
                                className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold hover:bg-gray-200 hover:text-gray-800 transition-all flex items-center justify-center gap-2"
                            >
                                Verify Another Ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}