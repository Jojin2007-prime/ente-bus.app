import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify'; 
import { User, Lock, Mail, Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react';

// ✅ CUSTOM BUS LOGO COMPONENT
const BusLogo = () => (
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
    <path 
      d="M -10 75 Q 50 55 110 80" 
      fill="none" 
      stroke="#1f2937" 
      strokeWidth="6" 
      strokeLinecap="round"
    />
    <path 
      d="M -10 75 Q 50 55 110 80" 
      fill="none" 
      stroke="#fbbf24" 
      strokeWidth="2" 
      strokeLinecap="round"
      strokeDasharray="10,5"
    />
    <path 
      d="M 10 30 L 80 20 Q 95 18 95 40 L 95 55 Q 95 65 85 65 L 15 65 Q 5 65 5 55 L 5 40 Q 5 30 10 30 Z" 
      fill="url(#busGradient)" 
      stroke="white" 
      strokeWidth="1"
    />
    <path d="M 15 35 L 50 30 L 50 45 L 15 48 Z" fill="#e0f2fe" opacity="0.8" />
    <path d="M 55 29 L 85 26 Q 90 26 90 40 L 90 45 L 55 45 Z" fill="#e0f2fe" opacity="0.8" />
    <circle cx="25" cy="65" r="6" fill="#1f2937" stroke="gray" strokeWidth="1" />
    <circle cx="75" cy="65" r="6" fill="#1f2937" stroke="gray" strokeWidth="1" />
  </svg>
);

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = "https://ente-bus-app-api.onrender.com";

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long!'); 
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/auth/register`,
        { name, email, password }
      );

      toast.success('Registration Successful! Please Login.');
      navigate('/login');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Registration Failed! Email might already exist.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl w-full max-w-md transition-colors border border-transparent dark:border-slate-700">

        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-indigo-500 font-bold text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Login
        </Link>

        {/* ✅ UPDATED BUS LOGO */}
        <div className="bg-indigo-100 dark:bg-indigo-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 overflow-visible">
          <BusLogo />
        </div>

        {/* Header */}
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
          Create Account
        </h2>
        <p className="text-gray-500 dark:text-slate-400 mb-8">
          Join us to book your journey instantly.
        </p>

        <form onSubmit={handleRegister} className="space-y-4">

          {/* Name */}
          <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 transition-colors">
            <div className="text-gray-400 dark:text-slate-500">
              <User size={20} />
            </div>
            <input
              placeholder="Full Name"
              className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 transition-colors">
            <div className="text-gray-400 dark:text-slate-500">
              <Mail size={20} />
            </div>
            <input
              type="email"
              placeholder="Email Address"
              className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-3 transition-colors">
            <div className="text-gray-400 dark:text-slate-500">
              <Lock size={20} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="bg-transparent w-full outline-none font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Submit */}
          <button
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Register Now <UserPlus size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center mt-6 text-gray-500 dark:text-slate-400">
          Already have an account?
          <Link
            to="/login"
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline ml-2"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}