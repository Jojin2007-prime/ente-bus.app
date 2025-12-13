import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

// Kerala Districts & Major Cities for Autocomplete
const KERALA_LOCATIONS = [
  "Trivandrum", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", 
  "Idukki", "Ernakulam", "Kochi", "Thrissur", "Palakkad", 
  "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasargod",
  "Bangalore", "Chennai", "Coimbatore"
];

export default function SearchBuses() {
  const [search, setSearch] = useState({ from: '', to: '' });
  const [suggestions, setSuggestions] = useState({ from: [], to: [] });
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) navigate('/');
  }, []);

  // Handle Autocomplete Typing
  const handleInputChange = (field, value) => {
    setSearch({ ...search, [field]: value });
    if (value.length > 0) {
      const filtered = KERALA_LOCATIONS.filter(loc => 
        loc.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions({ ...suggestions, [field]: filtered });
    } else {
      setSuggestions({ ...suggestions, [field]: [] });
    }
  };

  const selectSuggestion = (field, value) => {
    setSearch({ ...search, [field]: value });
    setSuggestions({ ...suggestions, [field]: [] }); // Hide dropdown
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Navigate without date. Date is selected on the next page.
    navigate(`/buses?from=${search.from}&to=${search.to}`);
  };

  return (
    <div className="min-h-[90vh] bg-gray-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white rounded-[2rem] shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row min-h-[500px]"
      >
        
        {/* Left Side: Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Find Your <br/><span className="text-indigo-600">Route.</span></h1>
          <p className="text-gray-500 mb-8 mt-2">Search for active bus routes across Kerala.</p>

          <form onSubmit={handleSearch} className="space-y-6">
            
            {/* FROM INPUT */}
            <div className="relative">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3 focus-within:ring-2 ring-indigo-100 transition-all">
                <MapPin className="text-indigo-500" />
                <input 
                  type="text" 
                  placeholder="From (e.g. Ernakulam)" 
                  className="bg-transparent w-full outline-none font-medium text-gray-700 placeholder-gray-400" 
                  value={search.from}
                  onChange={e => handleInputChange('from', e.target.value)} 
                  required 
                  autoComplete="off"
                />
              </div>
              {/* Dropdown List */}
              {suggestions.from.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-100 shadow-lg rounded-xl mt-2 max-h-40 overflow-y-auto">
                  {suggestions.from.map((loc) => (
                    <li 
                      key={loc} 
                      onClick={() => selectSuggestion('from', loc)}
                      className="p-3 hover:bg-indigo-50 cursor-pointer text-gray-700 font-medium border-b border-gray-50 last:border-0"
                    >
                      {loc}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* TO INPUT */}
            <div className="relative">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3 focus-within:ring-2 ring-indigo-100 transition-all">
                <Navigation className="text-orange-500" />
                <input 
                  type="text" 
                  placeholder="To (e.g. Bangalore)" 
                  className="bg-transparent w-full outline-none font-medium text-gray-700 placeholder-gray-400" 
                  value={search.to}
                  onChange={e => handleInputChange('to', e.target.value)} 
                  required 
                  autoComplete="off"
                />
              </div>
               {/* Dropdown List */}
               {suggestions.to.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-100 shadow-lg rounded-xl mt-2 max-h-40 overflow-y-auto">
                  {suggestions.to.map((loc) => (
                    <li 
                      key={loc} 
                      onClick={() => selectSuggestion('to', loc)}
                      className="p-3 hover:bg-indigo-50 cursor-pointer text-gray-700 font-medium border-b border-gray-50 last:border-0"
                    >
                      {loc}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
              <Search size={20} /> Find Buses
            </button>
          </form>
        </div>

        {/* Right Side: Decorative */}
        <div className="md:w-1/2 bg-indigo-900 p-8 md:p-12 text-white flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full opacity-20 blur-3xl translate-x-1/2 -translate-y-1/2"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full opacity-20 blur-3xl -translate-x-1/2 translate-y-1/2"></div>
             <h3 className="text-3xl font-bold mb-4 relative z-10">Smart Booking</h3>
             <p className="text-indigo-200 relative z-10">Select your route first, then choose your travel date. We make daily commuting easier.</p>
        </div>

      </motion.div>
    </div>
  );
}