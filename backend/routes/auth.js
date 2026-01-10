const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
router.post('/register', async (req, res) => {
  try {
    if (req.body.password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Convert email to lowercase before checking and saving
    const emailLower = req.body.email.toLowerCase();
    const userExists = await User.findOne({ email: emailLower });
    
    if (userExists) return res.status(400).json({ message: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const user = new User({
      name: req.body.name,
      email: emailLower, // Save as lowercase
      password: hashedPassword,
    });
    
    await user.save();
    console.log('✅ New User Registered:', user.email);
    res.json({ message: 'User Registered Successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    // Find user using lowercase email
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Email not found' });

    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ _id: user._id, email: user.email }, 'SECRET_KEY');
    res.header('auth-token', token).json({ 
      token, 
      user: { name: user.name, email: user.email } 
    });
    console.log('✅ User Logged In:', user.email);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BULLETPROOF RESET PASSWORD ENDPOINT ---
router.post('/reset-password', async (req, res) => {
  try {
    // 🔍 LOGGING: See exactly what the frontend is sending
    console.log("📥 Received Reset Request:", req.body);

    // 1. Get Data (Handle BOTH 'password' and 'newPassword' to be safe)
    const email = req.body.email;
    const password = req.body.password || req.body.newPassword; 

    // 2. Safety Checks (Prevent Crashes)
    if (!email) {
      return res.status(400).json({ message: "Email is missing from request" });
    }
    if (!password) {
      console.log("❌ Error: Password field is missing or empty");
      return res.status(400).json({ message: "Password is required" });
    }

    // 3. Find User
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log("❌ Error: Email not found in DB");
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // 4. Validate Length
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // 5. Hash & Save
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    await user.save();

    console.log('✅ Password Reset Successfully for:', email);
    res.json({ message: 'Password updated successfully!' });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err.message);
    res.status(500).json({ error: "Server error during password reset" });
  }
});