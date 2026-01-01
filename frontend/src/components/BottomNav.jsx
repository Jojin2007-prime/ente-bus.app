import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  History,
  MessageSquareWarning,
  Calendar,
  Tag,
  Info,
} from 'lucide-react';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  const navItems = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'Search', icon: Search, path: '/search' },
    { name: 'Schedule', icon: Calendar, path: '/schedule' },
    { name: 'Price', icon: Tag, path: '/prices' },
    { name: 'History', icon: History, path: '/history' },
    { name: 'About', icon: Info, path: '/about' },
    { name: 'Help', icon: MessageSquareWarning, path: '/complaint' },
  ];

  if (!user) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 border-t border-gray-100 dark:border-slate-800 z-50 backdrop-blur-xl shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
      <div className="flex justify-between items-center gap-1 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center justify-center flex-1 min-w-[52px] transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30'
                    : 'bg-transparent'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>

              {/* ✅ FONT MATCHED TO Landing.jsx */}
              <span
                className={`text-[10px] mt-1 font-bold truncate w-full text-center transition-opacity ${
                  isActive ? 'opacity-100' : 'opacity-70'
                }`}
              >
                {item.name}
              </span>

              {/* Active dot */}
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
