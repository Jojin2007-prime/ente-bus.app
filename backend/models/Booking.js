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
  // Added to prevent data loss when server saves phone numbers
  customerPhone: { 
    type: String 
  },
  // Date of travel (String format: YYYY-MM-DD)
  travelDate: { 
    type: String, 
    required: true 
  },
  // Statuses: Pending, Paid, Boarded, Expired, Cancelled
  status: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Boarded', 'Cancelled', 'Expired'], 
    default: 'Pending' 
  },
  // Financial details
  amount: { 
    type: Number, 
    required: true 
  },
  // Razorpay IDs
  paymentId: { type: String },
  orderId: { type: String },
  // Audit trail
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Booking', bookingSchema);