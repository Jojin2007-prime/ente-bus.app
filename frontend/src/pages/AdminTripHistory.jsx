import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader, IndianRupee, MapPinned, CalendarDays, Bus } from 'lucide-react';

const AdminTripHistory = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = "https://ente-bus-app-api.onrender.com";

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/admin/history`);
        setTrips(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("History Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-10">

        {/* ================= HEADER ================= */}
        <div className="flex items-center gap-5 mb-10">
          <button
            onClick={() => navigate('/admin')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700
                       shadow-sm hover:shadow-md transition active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase italic text-gray-900 dark:text-white">
              Full Trip History
            </h1>
            <p className="mt-1 text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400">
              Complete Revenue & Passenger Database
            </p>
          </div>
        </div>

        {/* ================= TABLE CARD ================= */}
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-32 flex flex-col items-center gap-4">
                <Loader size={40} className="animate-spin text-indigo-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Syncing Database
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[720px] border-collapse">
                <thead className="bg-gray-50 dark:bg-slate-900/60 border-b border-gray-100 dark:border-slate-700">
                  <tr className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">
                    <th className="p-6 text-left flex items-center gap-2">
                      <CalendarDays size={14} /> Trip Date
                    </th>
                    <th className="p-6 text-left">
                      <Bus size={14} className="inline mr-2" />
                      Bus Service Name
                    </th>
                    <th className="p-6 text-left">
                      <MapPinned size={14} className="inline mr-2" />
                      Route Details
                    </th>
                    <th className="p-6 text-left">
                      <IndianRupee size={14} className="inline mr-2" />
                      Total Revenue
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                  {trips.map((trip, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50/60 dark:hover:bg-slate-700/30 transition"
                    >
                      {/* DATE */}
                      <td className="p-6 text-sm font-black italic text-gray-700 dark:text-white whitespace-nowrap">
                        {trip.date}
                      </td>

                      {/* BUS */}
                      <td className="p-6">
                        <p className="font-bold uppercase tracking-tight text-gray-900 dark:text-gray-100">
                          {trip.bus?.name || 'Unknown Service'}
                        </p>
                        <p className="mt-1 text-[10px] font-mono lowercase text-gray-400 opacity-70">
                          {trip.bus?.registrationNumber || 'no-reg-id'}
                        </p>
                      </td>

                      {/* ROUTE */}
                      <td className="p-6 text-xs">
                        <div className="flex items-center gap-3 font-bold text-gray-600 dark:text-slate-400">
                          <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-slate-700">
                            {trip.bus?.from}
                          </span>
                          <span className="text-indigo-500 font-black">→</span>
                          <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-slate-700">
                            {trip.bus?.to}
                          </span>
                        </div>
                      </td>

                      {/* REVENUE */}
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="text-xl font-black italic text-green-600 dark:text-green-400">
                            ₹{trip.revenue?.toLocaleString()}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            {trip.passengers} Passengers
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ================= EMPTY STATE ================= */}
          {!loading && trips.length === 0 && (
            <div className="py-32 text-center">
              <div className="inline-flex p-6 rounded-full bg-gray-50 dark:bg-slate-900 mb-4">
                <Bus size={48} className="text-gray-200 dark:text-slate-700" />
              </div>
              <p className="text-sm font-black uppercase italic tracking-widest text-gray-300 dark:text-slate-600">
                No historical records found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTripHistory;