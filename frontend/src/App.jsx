import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 👇 THESE ARE CRITICAL FOR THE STYLE
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import SearchBuses from './pages/SearchBuses';
import BusResults from './pages/BusResults';
import SeatSelection from './pages/SeatSelection';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import Login from './pages/Login';
import Register from './pages/Register';
import TicketVerifier from './pages/TicketVerifier';
import AboutUs from './pages/AboutUs';
import TicketPrices from './pages/TicketPrices';
import PaymentHistory from './pages/PaymentHistory';
import BusSchedule from './pages/BusSchedule';
import SwitchUserWarning from './pages/SwitchUserWarning';
import BookingSuccess from './pages/BookingSuccess';
import AdminTripHistory from './pages/AdminTripHistory';
import Payment from './pages/Payment';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <Navbar />
        
        {/* 👇 THIS COMPONENT SHOWS THE POPUP */}
        <ToastContainer position="top-center" autoClose={3000} theme="colored" />

        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/search" element={<SearchBuses />} />
          <Route path="/buses" element={<BusResults />} />
          <Route path="/seats/:busId" element={<SeatSelection />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/prices" element={<TicketPrices />} />
          <Route path="/schedule" element={<BusSchedule />} />
          <Route path="/history" element={<PaymentHistory />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/verify" element={<TicketVerifier />} />
          <Route path="/switch-user" element={<SwitchUserWarning />} />
          <Route path="/booking-success/:id" element={<BookingSuccess />} />
          <Route path="/admin/history" element={<AdminTripHistory />} />
          <Route path="/payment" element={<Payment />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}