const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true }, // e.g., "AC Sleeper", "Non-AC"
    source: { type: String, required: true },
    destination: { type: String, required: true },
    date: { type: String, required: true }, // Stored as YYYY-MM-DD
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    price: { type: Number, required: true },
    seats: [
        {
            number: { type: Number },
            isBooked: { type: Boolean, default: false }
        }
    ]
});

module.exports = mongoose.model('Bus', busSchema);