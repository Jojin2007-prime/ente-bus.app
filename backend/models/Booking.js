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
  // ✅ ESSENTIAL FOR EXPIRY LOGIC: The date of travel (e.g., "2026-01-05")
  travelDate: { 
    type: String, 
    required: true 
  },
  // ✅ LOGIC BARRIER: Controls if 'Pay Now' or 'Ticket PDF' shows
  status: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Boarded', 'Cancelled'], 
    default: 'Pending' 
  },
  // Financial details for Razorpay retry
  amount: { 
    type: Number, 
    required: true 
  },
  // Audit trail for when the booking was initiated
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Booking', bookingSchema);