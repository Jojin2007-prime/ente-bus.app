import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify'; // ✅ IMPORT TOAST
import { User, Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://entebus-api.onrender.com/api/auth/register', { name, email, password });
      
      // ✅ BEAUTIFUL SUCCESS POPUP
      toast.success("Registration Successful! Please Login."); 
      
      navigate('/login');
    } catch (err) {
      // ❌ BEAUTIFUL ERROR POPUP
      toast.error(err.response?.data?.message || "Registration Failed! Email might already exist.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-black text-gray-900 mb-2">Create Account</h2>
        <p className="text-gray-500 mb-8">Join us to book your journey instantly.</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3">
            <div className="text-gray-400"><User size={20} /></div>
            <input 
              placeholder="Full Name" 
              className="bg-transparent w-full outline-none font-medium text-gray-900"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3">
            <div className="text-gray-400"><Mail size={20} /></div>
            <input 
              type="email" 
              placeholder="Email Address" 
              className="bg-transparent w-full outline-none font-medium text-gray-900"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3">
            <div className="text-gray-400"><Lock size={20} /></div>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              className="bg-transparent w-full outline-none font-medium text-gray-900"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
            Register Now
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500">
          Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}