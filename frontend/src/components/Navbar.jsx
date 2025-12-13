import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bus, User, LogOut, ScanLine, History, Calendar, Home, LayoutDashboard, Search, IndianRupee, Info, ChevronRight } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const user = JSON.parse(localStorage.getItem('user'));
  const admin = localStorage.getItem('admin'); 

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('admin'); 
    navigate('/');
    window.location.reload();
  };

  // Nav Item Component
  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
          ${isActive 
            ? 'bg-indigo-600 text-white shadow-md' // ACTIVE: Indigo Color
            : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-600' // INACTIVE
          }`}
      >
        <Icon size={18} className={isActive ? "text-white" : "text-gray-400"} /> 
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4 py-3">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* 1. LOGO */}
          <div className="flex justify-between items-center">
            <Link to="/" className="text-2xl font-black text-gray-900 flex items-center gap-2 tracking-tight">
              <div className="bg-gradient-to-tr from-indigo-600 to-purple-400 text-white p-2 rounded-xl shadow-md">
                <Bus size={26} />
              </div>
              <span className="text-indigo-600">
                    Ente
                 <span className="text-yellow-300">Bus</span>
                      </span>

            </Link>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
               {user ? (
                 <button onClick={handleLogout} className="p-2 bg-gray-100 rounded-lg text-gray-500"><LogOut size={20}/></button>
               ) : (
                 <Link to="/login" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold">Login</Link>
               )}
            </div>
          </div>

          {/* 2. MAIN NAVIGATION */}
          <div className="flex flex-wrap justify-center gap-2">
            <NavItem to="/" icon={Home} label="Home" />
            
            {user && (
              <NavItem to="/search" icon={Search} label="Search" />
            )}

            <NavItem to="/schedule" icon={Calendar} label="Schedule" />
            
            {/* UPDATED: Uses IndianRupee Icon */}
            <NavItem to="/prices" icon={IndianRupee} label="Prices" />
            
            <NavItem to="/about" icon={Info} label="About" />
          </div>

          {/* 3. RIGHT SIDE: AUTH & SCANNER */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* SCAN TICKET BUTTON */}
            <Link 
              to="/verify" 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border transition-all mr-2
                ${location.pathname === '/verify'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
                }`}
            >
              <ScanLine size={18} />
              <span>Scan Ticket</span>
            </Link>

            <div className="w-px h-8 bg-gray-200 mx-1"></div>

            {admin ? (
              // ADMIN VIEW
              <div className="flex items-center gap-2">
                <Link to="/admin" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <button onClick={handleLogout} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
                  <LogOut size={20} />
                </button>
              </div>
            ) : user ? (
              // USER VIEW
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-bold uppercase">Welcome</p>
                  <p className="text-sm font-bold text-gray-900 leading-none">{user.name.split(' ')[0]}</p>
                </div>
                <Link to="/history" className="p-2.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition">
                  <History size={20} />
                </Link>
                <button onClick={handleLogout} className="p-2.5 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-xl transition">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              // GUEST VIEW
              <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                <Link to="/admin-login" className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-900 transition">
                  Admin
                </Link>
                <Link to="/login" className="flex items-center gap-1 px-5 py-2 bg-white rounded-lg text-sm font-bold text-gray-900 shadow-sm hover:shadow-md transition">
                  Login <ChevronRight size={14} className="text-indigo-600"/>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}