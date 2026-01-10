import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, Clock } from 'lucide-react';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);

  // ✅ Centralized Localhost URL (Matches your Admin.jsx)
  const API_URL = "https://ente-bus-app-api.onrender.com";

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/complaints/all`);
      setComplaints(res.data);
    } catch (err) {
      console.error("Error fetching complaints:", err);
    }
  };

  const markResolved = async (id) => {
    try {
      await axios.put(`${API_URL}/api/complaints/resolve/${id}`);
      fetchComplaints(); // Refresh list
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">User Complaints</h2>
      
      <div className="grid gap-4">
        {complaints.map((c) => (
          <div key={c._id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${c.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {c.status}
                </span>
                <span className="text-sm text-gray-500">{new Date(c.date).toLocaleDateString()}</span>
              </div>
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">{c.category}</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{c.message}</p>
              <p className="text-xs text-gray-400 mt-2">By: {c.name} ({c.email})</p>
            </div>

            {c.status === 'Pending' && (
              <button 
                onClick={() => markResolved(c._id)}
                className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700"
              >
                <CheckCircle size={14} /> Resolve
              </button>
            )}
          </div>
        ))}

        {complaints.length === 0 && <p className="text-gray-500">No complaints found.</p>}
      </div>
    </div>
  );
}