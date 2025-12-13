import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000); // Auto remove after 3 seconds
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (msg) => addToast(msg, 'success');
  const error = (msg) => addToast(msg, 'error');

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      
      {/* TOAST CONTAINER (Fixed at Top Right) */}
      <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border min-w-[300px] backdrop-blur-md ${
                toast.type === 'success' 
                  ? 'bg-white/95 border-green-500 text-green-800' 
                  : 'bg-white/95 border-red-500 text-red-800'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle className="text-green-500" size={24} /> : <XCircle className="text-red-500" size={24} />}
              <p className="font-bold text-sm flex-1">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};