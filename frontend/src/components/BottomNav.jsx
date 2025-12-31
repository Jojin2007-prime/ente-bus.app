import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, History, MessageSquareWarning, Calendar, Tag, Info } from 'lucide-react';

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
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center py-2 z-50 backdrop-blur-lg bg-opacity-95 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-1">
      {navItems.map((item) => {
        const isActive = item.path === '/' 
          ? location.pathname === '/' 
          : location.pathname.startsWith(item.path);

        return (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center flex-1 min-w-0 transition-all ${
              isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
            }`}
          >
            {/* Reduced size to 18 to fit all 7 icons comfortably */}
            <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            <span 
              className={`text-[8px] mt-1 font-medium truncate w-full text-center ${
                isActive ? 'opacity-100' : 'opacity-70'
              }`}
            >
              {item.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;