const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  seatNumbers: [Number],
  customerEmail: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);