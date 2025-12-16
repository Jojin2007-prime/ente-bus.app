const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Travel Experience', 'Payment Issue', 'Staff Behavior', 'Bus Condition', 'Other'] 
  },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Resolved'] }
});

module.exports = mongoose.model('Complaint', complaintSchema);