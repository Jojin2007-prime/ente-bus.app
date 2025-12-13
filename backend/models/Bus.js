const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  name: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  price: { type: Number, required: true },
  seats: { type: [Number], default: [] } // Stores booked seat numbers
});

module.exports = mongoose.model('Bus', busSchema);