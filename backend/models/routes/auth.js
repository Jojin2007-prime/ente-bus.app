const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
router.post('/register', async (req, res) => {
  try {
    // Check if user already exists
    const userExists = await User.findOne({ email: req.body.email });
    if (userExists) return res.status(400).json({ message: 'Email already exists' });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create new user
    const user = new User({
      name: req.body.name,
      email: req.body.email,
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
    // Check if user exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ message: 'Email not found' });

    // Validate password
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).json({ message: 'Invalid password' });

    // Create and assign token
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

// CRITICAL EXPORT LINE
module.exports = router;