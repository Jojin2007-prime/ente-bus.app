const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

const app = express();

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// --- DATABASE CONNECTION ---
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ DB Connection Error: ${error.message}`);
    process.exit(1);
  }
};
connectDB();

// --- RAZORPAY CONFIG ---
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_Rp42r0Aqd3EZrY', 
  key_secret: process.env.RAZORPAY_KEY_SECRET || '10FbavAMxpgDor4tQk1ARVGc',
});

// --- MODELS ---
const User = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}));

const Bus = mongoose.model('Bus', new mongoose.Schema({
  name: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  departureTime: { type: String, required: true },
  price: { type: Number, required: true },
  driverName: String,
  driverContact: String,
}));

const Booking = mongoose.model('Booking', new mongoose.Schema({
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  seatNumbers: [Number],
  customerEmail: String,
  customerName: String,
  customerPhone: String,
  bookingDate: { type: Date, default: Date.now },
  travelDate: String, 
  paymentId: String,
  orderId: String,
  amount: Number,
  status: { type: String, default: 'Pending' } 
}));

const Complaint = mongoose.model('Complaint', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String }, 
  category: { type: String, required: true },
  tripDetails: { type: String }, 
  message: { type: String, required: true },
  status: { type: String, default: 'Pending' }, 
  date: { type: Date, default: Date.now }
}));

// --- ROUTES ---

// Auth
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (password.length < 8) return res.status(400).json({ message: 'Password must be 8+ characters' });
    
    const userExists = await User.findOne({ 
      email: { $regex: new RegExp("^" + email.trim() + "$", "i") } 
    });
    
    if (userExists) return res.status(400).json({ message: 'Email already registered' });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = new User({ name, email: email.toLowerCase().trim(), password: hashedPassword });
    await user.save();
    res.json({ message: 'Success' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await User.findOne({ 
      email: { $regex: new RegExp("^" + req.body.email.trim() + "$", "i") } 
    });

    if (!user) return res.status(400).json({ message: 'Account not found' });
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ _id: user._id }, 'SECRET_KEY');
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ 
      email: { $regex: new RegExp("^" + email.trim() + "$", "i") } 
    });

    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    if (password.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body; 
  const ADMIN_ID = "admin";
  const ADMIN_PASS = "admin123";
  if (email.trim() === ADMIN_ID && password.trim() === ADMIN_PASS) {
    const token = jwt.sign({ role: 'admin' }, 'SECRET_KEY');
    return res.json({ success: true, token, message: "Welcome Boss!" });
  }
  return res.status(401).json({ success: false, message: "Invalid Credentials" });
});

// Admin Data
app.get('/api/admin/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ bookingDate: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/manifest', async (req, res) => {
  try {
    const { busId, date } = req.query;
    const bookings = await Booking.find({ 
      busId, 
      travelDate: date, 
      status: { $in: ['Paid', 'Boarded'] } 
    });
    res.json(bookings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/revenue-stats', async (req, res) => {
  try {
    const { busId, date } = req.query;
    if (busId && date) {
      const specificData = await Booking.aggregate([
        { 
          $match: { 
            busId: new mongoose.Types.ObjectId(busId), 
            travelDate: date,
            status: { $in: ['Paid', 'Boarded'] } 
          } 
        },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      return res.json({ filteredRevenue: specificData[0]?.total || 0 });
    }
    const overallData = await Booking.aggregate([
      { $match: { status: { $in: ['Paid', 'Boarded'] } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);
    const busStats = await Bus.aggregate([
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "busId",
          as: "all_bookings"
        }
      },
      {
        $project: {
          name: 1,
          registrationNumber: 1,
          revenue: {
            $sum: {
              $map: {
                input: "$all_bookings",
                as: "b",
                in: { 
                  $cond: [
                    { $in: ["$$b.status", ["Paid", "Boarded"]] },
                    "$$b.amount",
                    0
                  ]
                }
              }
            }
          }
        }
      },
      { 
        $project: {
          _id: 1,
          revenue: 1,
          details: { name: "$name", registrationNumber: "$registrationNumber" }
        }
      }
    ]);
    res.json({ 
        overallTotal: overallData[0]?.total || 0, 
        totalBookings: overallData[0]?.count || 0, 
        busStats 
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bus Management
app.get('/api/buses', async (req, res) => {
  try { 
    const { from, to } = req.query;
    let query = {};
    if (from && to) {
      query.from = { $regex: new RegExp("^" + from + "$", "i") };
      query.to = { $regex: new RegExp("^" + to + "$", "i") };
    }
    res.json(await Bus.find(query)); 
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/buses', async (req, res) => {
  try {
    const bus = new Bus(req.body);
    await bus.save();
    res.status(201).json({ success: true, bus });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

app.put('/api/buses/:id', async (req, res) => {
  try {
    const updatedBus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, bus: updatedBus });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/buses/:id', async (req, res) => {
  try { await Bus.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Booking & Payment
app.get('/api/bookings/occupied', async (req, res) => {
  try {
    const { busId, date } = req.query;
    const bookings = await Booking.find({ busId, travelDate: date, status: { $in: ['Paid', 'Boarded'] } });
    res.json(bookings.flatMap(b => b.seatNumbers));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bookings/init', async (req, res) => {
  try {
    const booking = new Booking({ ...req.body, status: 'Pending' });
    await booking.save();
    res.json({ success: true, bookingId: booking._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/payment/order', async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(req.body.amount * 100),
      currency: "INR",
      receipt: "rcp_" + Date.now()
    });
    res.json(order);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bookings/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || '10FbavAMxpgDor4tQk1ARVGc';
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
    
    if (expectedSignature === razorpay_signature) {
      await Booking.findByIdAndUpdate(bookingId, { 
        status: 'Paid', paymentId: razorpay_payment_id, orderId: razorpay_order_id 
      });
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/bookings/user/:email', async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      customerEmail: { $regex: new RegExp("^" + req.params.email.trim() + "$", "i") } 
    }).populate('busId').sort({ bookingDate: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin Features
app.post('/api/admin/refund/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking || !booking.paymentId) return res.status(404).json({ message: "No payment found" });
    await razorpay.payments.refund(booking.paymentId, { amount: booking.amount * 100 });
    booking.status = 'Refunded';
    await booking.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ✅ ADDED: USER-INITIATED AUTOMATIC REFUND (30 MIN WINDOW)
app.post('/api/bookings/cancel/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.status !== 'Paid') {
      return res.status(400).json({ success: false, message: "Only paid tickets can be cancelled" });
    }

    // Security: Check if 30 minutes have passed since bookingDate
    const now = new Date();
    const bookingTime = new Date(booking.bookingDate);
    const diffInMinutes = (now - bookingTime) / (1000 * 60);

    if (diffInMinutes > 30) {
      return res.status(400).json({ 
        success: false, 
        message: "Cancellation window (30 mins) has expired." 
      });
    }

    // Trigger Razorpay Refund
    if (booking.paymentId) {
      await razorpay.payments.refund(booking.paymentId, {
        amount: booking.amount * 100, // amount in paise
        speed: 'optimum'
      });
    }

    // Update Database Status
    booking.status = 'Refunded';
    await booking.save();

    res.json({ 
      success: true, 
      message: "Ticket cancelled and refund initiated successfully." 
    });

  } catch (err) {
    console.error("Refund Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ UPDATED: Ticket Verification Route with Expired/Future logic
app.get('/api/admin/verify-ticket/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate('busId');
    if (!booking) return res.status(404).json({ message: "Invalid Ticket", status: "invalid" });

    const today = new Date().toISOString().split('T')[0];
    const travelDate = booking.travelDate; // Format: YYYY-MM-DD

    // 1. Check if already Refunded
    if (booking.status === 'Refunded') {
      return res.json({ message: "Ticket Refunded", status: "refunded", booking });
    }

    // 2. Check if already Boarded
    if (booking.status === 'Boarded') {
      return res.json({ message: "Already Boarded", status: "boarded_already", booking });
    }

    // 3. Date Logic
    if (travelDate < today) {
      return res.json({ message: "Ticket Expired", status: "expired", booking });
    } else if (travelDate > today) {
      return res.json({ message: "Future Trip", status: "future", booking });
    } else {
      // It is today and status is 'Paid'
      return res.json({ message: "Valid Ticket: Paid", status: "success", booking });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/confirm-board/:bookingId', async (req, res) => {
  try {
    await Booking.findByIdAndUpdate(req.params.bookingId, { status: 'Boarded' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Complaints
app.post('/api/complaints/add', async (req, res) => {
  try { const c = new Complaint(req.body); await c.save(); res.json({ message: 'Submitted' }); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/complaints/all', async (req, res) => {
  try { res.json(await Complaint.find().sort({ date: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/complaints/resolve/:id', async (req, res) => {
  try {
    await Complaint.findByIdAndUpdate(req.params.id, { status: 'Resolved' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ✅ RENDER PORT BINDING
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Final Case-Insensitive Server on Port ${PORT}`));