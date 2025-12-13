import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, LogOut, ArrowRight } from 'lucide-react';

export default function SwitchUserWarning() {
  const navigate = useNavigate();

  const handleLogoutAndSwitch = () => {
    // Clear Admin Session
    localStorage.removeItem('admin');
    // Go to User Login
    navigate('/login');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border-t-8 border-red-500">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full text-red-600">
            <AlertTriangle size={48} />
          </div>
        </div>
        
        <h1 className="text-2xl font-black text-gray-900 mb-4">Admin Session Active</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          You are currently logged in as an <strong>Administrator</strong>. 
          To sign in as a User, you must log out of the Admin panel first.
        </p>

        <div className="space-y-3">
          <button 
            onClick={handleLogoutAndSwitch}
            className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-lg shadow-red-200"
          >
            <LogOut size={20} /> Logout & Go to User Login
          </button>
          
          <button 
            onClick={() => navigate('/admin')}
            className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition"
          >
            Stay as Admin
          </button>
        </div>
      </div>
    </div>
  );
}