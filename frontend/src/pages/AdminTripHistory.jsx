import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AdminTripHistory = () => {
  const [trips, setTrips] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('https://entebus-api.onrender.com/api/admin/history')
      .then(res => setTrips(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleViewManifest = (busId, date) => {
    navigate(`/admin/manifest?busId=${busId}&date=${date}`);
  };

  return (
    // Responsive Padding: p-4 for mobile, p-10 for desktop
    // max-w-7xl mx-auto: ensures it doesn't get too wide on ultrawide monitors
    <div className="p-4 md:p-10 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
      
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate('/admin')} 
            className="p-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-white rounded shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trip History</h1>
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
          
          {/* SCROLL WRAPPER: 
              This 'overflow-x-auto' div is key for mobile. 
              It prevents the whole page from shaking/scrolling horizontally 
          */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
              {/* Table Head */}
              <thead className="bg-gray-100 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Bus Name</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">Revenue</th>
                </tr>
              </thead>
              
              {/* Table Body */}
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                {trips.map((trip, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition cursor-pointer"
                    onClick={() => handleViewManifest(trip.bus?._id, trip.date)}
                  >
                    {/* whitespace-nowrap keeps the date/revenue on one line on mobile */}
                    <td className="p-4 font-bold text-gray-700 dark:text-white whitespace-nowrap">
                      {trip.date}
                    </td>
                    <td className="p-4 text-gray-900 dark:text-gray-300">
                      {trip.bus?.name}
                    </td>
                    <td className="p-4 text-sm text-gray-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <span>{trip.bus?.from}</span>
                        <span className="text-indigo-500">➝</span>
                        <span>{trip.bus?.to}</span>
                      </div>
                    </td>
                    <td className="p-4 text-green-600 dark:text-green-400 font-bold whitespace-nowrap">
                      ₹{trip.revenue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Empty State */}
          {trips.length === 0 && (
            <div className="p-12 text-center text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-800">
              <div className="mb-2 flex justify-center opacity-20">
                {/* Optional icon placeholder if you want it to look more 'aligned' */}
              </div>
              No past trips found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTripHistory;