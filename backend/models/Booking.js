const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Reference to the Bus being booked
  busId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Bus', 
    required: true 
  },
  // Array of seat numbers selected by the user
  seatNumbers: { 
    type: [Number], 
    required: true 
  },
  // User identification
  customerEmail: { 
    type: String, 
    required: true 
  },
  customerName: { 
    type: String, 
    required: true 
  },
  // ✅ ADDED: Matches Admin Manifest and Registration logic
  customerPhone: { 
    type: String, 
    required: false 
  },
  // ✅ ESSENTIAL FOR EXPIRY LOGIC: The date of travel (e.g., "2026-01-05")
  travelDate: { 
    type: String, 
    required: true 
  },
  // ✅ UPDATED ENUM: Added 'Expired' and 'Refund Pending' to match server.js logic
  status: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Boarded', 'Cancelled', 'Expired', 'Refund Pending'], 
    default: 'Pending' 
  },
  // Financial details for Razorpay 
  amount: { 
    type: Number, 
    required: true 
  },
  // Razorpay Transaction IDs
  paymentId: String,
  orderId: String,
  // Audit trail
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Booking', bookingSchema);