import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { ThemeProvider } from './context/ThemeContext'; 
import { ToastProvider } from './context/ToastContext'; 

// Style & UI Feedback Imports
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

// Global Components
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

// Public & User Pages
import Landing from './pages/Landing';
import SearchBuses from './pages/SearchBuses';
import BusResults from './pages/BusResults';
import SeatSelection from './pages/SeatSelection';
import Login from './pages/Login';
import Register from './pages/Register';

import AboutUs from './pages/AboutUs';
import TicketPrices from './pages/TicketPrices';
import PaymentHistory from './pages/PaymentHistory';
import BusSchedule from './pages/BusSchedule';
import SwitchUserWarning from './pages/SwitchUserWarning';
import BookingSuccess from './pages/BookingSuccess';
import Payment from './pages/Payment';
import Complaint from './pages/Complaint';
import TicketVerifier from './pages/TicketVerifier';
import ResetPassword from './pages/ResetPassword';

// Admin Pages
import Admin from './pages/Admin';
import AdminTripHistory from './pages/AdminTripHistory';
import AdminComplaints from './pages/AdminComplaints';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider> 
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-white transition-colors duration-300 relative pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
            
            <Navbar />
            
            <ToastContainer 
              position="top-center" 
              autoClose={3000} 
              theme="colored" 
              hideProgressBar={false}
              closeOnClick
              pauseOnHover
              draggable
            />

            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/search" element={<SearchBuses />} />
              <Route path="/buses" element={<BusResults />} />
              
              {/* Seat Selection Route */}
              <Route path="/seats/:busId" element={<SeatSelection />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Redirect old Admin Login URL to the new combined Login page */}
              <Route path="/admin/login" element={<Navigate to="/login" replace />} />
              
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/switch-user" element={<SwitchUserWarning />} />
              
              {/* Info & User Routes */}
              <Route path="/about" element={<AboutUs />} />
              <Route path="/prices" element={<TicketPrices />} />
              <Route path="/schedule" element={<BusSchedule />} />
              <Route path="/history" element={<PaymentHistory />} />
              <Route path="/payment-history" element={<PaymentHistory />} />
              <Route path="/verify" element={<TicketVerifier />} />
              <Route path="/complaint" element={<Complaint />} />
              
              {/* Payment & Success Routes */}
              <Route path="/payment" element={<Payment />} />
              <Route path="/booking-success/:id" element={<BookingSuccess />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/history" element={<AdminTripHistory />} />
              <Route path="/admin/complaints" element={<AdminComplaints />} />
            </Routes>

            <BottomNav />
          </div>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}