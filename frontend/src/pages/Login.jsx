import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify'; 
import { User, Lock, Eye, EyeOff, ShieldCheck, LifeBuoy, AlertTriangle, LogOut } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Toggle between User and Admin mode
  const [isAdminMode, setIsAdminMode] = useState(false);

  const navigate = useNavigate();
  const API_URL = "https://ente-bus-app-api.onrender.com";

  // ✅ UPDATED CHECK: Check for 'adminToken' too so the blocker works consistently
  const isAdminLoggedIn = localStorage.getItem('admin') || localStorage.getItem('adminToken');

  // --- AUTO-FILL EMAIL AFTER RESET ---
  useEffect(() => {
    const savedEmail = localStorage.getItem('resetEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      localStorage.removeItem('resetEmail'); 
    }
  }, []);

  // Handle Logout for the Blocker Screen
  const handleAdminSwitch = () => {
    localStorage.removeItem('admin'); 
    // ✅ CLEAR EVERYTHING related to admin
    localStorage.removeItem('adminToken'); 
    localStorage.removeItem('token'); 
    window.location.reload(); 
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = isAdminMode 
      ? `${API_URL}/api/admin/login` 
      : `${API_URL}/api/auth/login`;

    try {
      const res = await axios.post(endpoint, { 
        email: email.trim(), 
        password 
      });
      
      if (isAdminMode) {
        // --- ADMIN LOGIN SUCCESS ---
        localStorage.removeItem('user'); 
        
        localStorage.setItem('admin', JSON.stringify(res.data.admin || res.data.user)); 
        
        // ⚡️⚡️ CRITICAL FIX HERE ⚡️⚡️
        // We save the token TWICE: once as 'token' (generic) and once as 'adminToken'
        // This ensures your Dashboard page (which likely checks for adminToken) lets you in.
        localStorage.setItem('adminToken', res.data.token); 
        localStorage.setItem('token', res.data.token);
        
        toast.success(`Welcome Admin!`);
        navigate('/admin'); 

      } else {
        // --- USER LOGIN SUCCESS ---
        localStorage.removeItem('admin'); 
        localStorage.removeItem('adminToken'); // Clean up admin leftovers
        
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('token', res.data.token);
        
        toast.success(`Welcome back, ${res.data.user.name}!`);
        navigate('/'); 
      }

      // Small delay to ensure storage is set before reload
      setTimeout(() => {
        window.location.reload(); 
      }, 500); 
      
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Login Failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const isEmailEntered = email.includes('@') && email.includes('.');

  // 🔴 SCENARIO 1: ADMIN IS LOGGED IN (Blocker View)
  if (isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-red-50 dark:bg-red-950/30 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border-t-8 border-red-500">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-full text-red-600 dark:text-red-400">
              <AlertTriangle size={48} />
            </div>
          </div>
          
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Admin Session Active</h1>
          <p className="text-gray-600 dark:text-slate-300 mb-8 leading-relaxed">
            You are currently logged in as an <strong>Administrator</strong>. 
            To sign in as a User, you must switch accounts.
          </p>

          <button 
            onClick={handleAdminSwitch}
            className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-lg shadow-red-200"
          >
            <LogOut size={20} /> Logout Admin & Login as User
          </button>
          
          <button 
            onClick={() => navigate('/admin')}
            className="w-full mt-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 py-4 rounded-xl font-bold hover:bg-gray-200"
          >
            Cancel (Go to Dashboard)
          </button>
        </div>
      </div>
    );
  }

  // 🔵 SCENARIO 2: NOT LOGGED IN (Show Form with Toggle)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl w-full max-w-md border border-transparent dark:border-slate-700 transition-colors relative">
        
        {/* Header */}
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
          {isAdminMode ? "Admin Portal" : "Welcome Back"}
        </h2>
        <p className="text-gray-500 dark:text-slate-400 mb-8 font-medium">
          {isAdminMode ? "Enter admin credentials to manage fleet." : "Please enter your details to sign in."}
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* ✅ FIXED INPUT: Allows 'text' for Admin, enforces 'email' for Users */}
          <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
            <div className={`transition-colors ${isAdminMode ? 'text-red-500' : 'text-gray-400 dark:text-slate-500'}`}>
              {isAdminMode ? <ShieldCheck size={20} /> : <User size={20} />}
            </div>
            <input 
              type={isAdminMode ? "text" : "email"} 
              placeholder={isAdminMode ? "Admin Username" : "Email Address"}
              className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
            <div className="text-gray-400 dark:text-slate-500">
              <Lock size={20} />
            </div>
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="Password" 
              className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="text-gray-400 dark:text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Forgot Password Link (Only show for Users) */}
          {!isAdminMode && (
            <div className="flex justify-end px-1">
              {isEmailEntered ? (
                <Link 
                  to="/reset-password" 
                  state={{ email }} 
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors flex items-center gap-1"
                >
                  <LifeBuoy size={14} /> Forgot Password?
                </Link>
              ) : (
                <span 
                  className="text-xs font-bold text-gray-300 dark:text-slate-600 cursor-not-allowed flex items-center gap-1"
                  title="Type your email first to enable password reset"
                >
                  <LifeBuoy size={14} /> Forgot Password?
                </span>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button 
            disabled={loading}
            className={`w-full text-white py-3.5 rounded-xl font-bold transition shadow-lg active:scale-[0.98] disabled:opacity-50
              ${isAdminMode 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                : 'bg-gray-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-500 shadow-gray-200'
              }`}
          >
            {loading ? "Signing in..." : (isAdminMode ? "Login to Dashboard" : "Sign In")}
          </button>

          {/* Mode Switcher */}
          <div className="pt-4 text-center border-t border-gray-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                setEmail('');
                setPassword('');
              }}
              className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              {isAdminMode ? "← Back to User Login" : "Login as Admin"}
            </button>
          </div>

        </form>

        {/* Sign Up Link (Only show for Users) */}
        {!isAdminMode && (
          <p className="text-center mt-6 text-gray-500 dark:text-slate-400 font-medium">
            Don't have an account? <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline transition-all">Sign up</Link>
          </p>
        )}
      </div>
    </div>
  );
}