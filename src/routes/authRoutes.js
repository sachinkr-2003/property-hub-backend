const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, getMe, updateProfile, adminLogin, phoneLogin, googleLogin, emailLogin, emailRegister, sendEmailOtp, verifyEmailOtp } = require('../controllers/authController');

// JWT middleware (light-touch inline for GET /me and PATCH /profile)
const jwt = require('jsonwebtoken');
const authMiddleware = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: 'Authorization token required' });
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'property_hub_super_secret_jwt_key_2026_xyz');
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// ─── Public Routes ────────────────────────────────────────────────────────────
router.post('/send-otp',    sendOtp);       // Step 1: Send OTP
router.post('/verify-otp',  verifyOtp);     // Step 2: Verify OTP + login/register
router.post('/phone-login', phoneLogin);    // Legacy alias
router.post('/admin-login', adminLogin);    // Admin panel login
router.post('/google-login', googleLogin);  // Google login
router.post('/login-email', emailLogin);    // Email login
router.post('/register-email', emailRegister); // Email register
router.post('/send-email-otp', sendEmailOtp); // Send Email OTP
router.post('/verify-email-otp', verifyEmailOtp); // Verify Email OTP

// ─── Protected Routes ─────────────────────────────────────────────────────────
router.get('/me',           authMiddleware, getMe);           // Get current user
router.patch('/profile',    authMiddleware, updateProfile);   // Update profile

module.exports = router;
