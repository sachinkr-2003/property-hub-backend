const mongoose = require('mongoose');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// In-memory OTP store (in production: use Redis)
const otpStore = new Map(); // mobile → { otp, expiresAt, attempts }

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FIXED_DEV_OTP = '1234'; // dev shortcut

/**
 * Generate a random 4-digit OTP
 */
function makeOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ────────────────────────────────────────────────────────────────────────────
// @desc    Send OTP to mobile number (Step 1 of phone-login)
// @route   POST /api/auth/send-otp
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
const sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || !/^\d{10}$/.test(mobile.replace(/\s/g, ''))) {
      return errorResponse(res, 400, 'Please provide a valid 10-digit mobile number');
    }

    const cleanMobile = mobile.replace(/\s/g, '');
    const otp = makeOtp();
    const expiresAt = Date.now() + OTP_TTL_MS;

    otpStore.set(cleanMobile, { otp, expiresAt, attempts: 0 });

    // In production: integrate SMS provider (Twilio, MSG91, Fast2SMS, etc.)
    // For now we log it for dev use and always accept FIXED_DEV_OTP = '1234'
    console.log(`[AUTH] OTP for +91${cleanMobile}: ${otp}`);

    return successResponse(res, 200, `OTP sent to +91${cleanMobile}`, {
      mobile: cleanMobile,
      expiresIn: 300, // seconds
      // ONLY expose otp in non-production for developer testing
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @desc    Verify OTP + login or auto-register (Step 2 of phone-login)
// @route   POST /api/auth/verify-otp
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  try {
    const { mobile, otp, name, role } = req.body;

    if (!mobile || !otp) {
      return errorResponse(res, 400, 'Mobile number and OTP are required');
    }

    const cleanMobile = mobile.replace(/\s/g, '');
    const entry = otpStore.get(cleanMobile);

    // Allow fixed dev OTP '1234' to bypass store check
    const isDevOtp = otp === FIXED_DEV_OTP;

    if (!isDevOtp) {
      if (!entry) {
        return errorResponse(res, 400, 'OTP not found or expired. Please request a new one');
      }
      if (Date.now() > entry.expiresAt) {
        otpStore.delete(cleanMobile);
        return errorResponse(res, 400, 'OTP has expired. Please request a new one');
      }
      entry.attempts += 1;
      if (entry.attempts > 5) {
        otpStore.delete(cleanMobile);
        return errorResponse(res, 429, 'Too many failed attempts. Please request a new OTP');
      }
      if (entry.otp !== otp) {
        return errorResponse(res, 400, `Invalid OTP. ${5 - entry.attempts} attempts remaining`);
      }
    }

    // OTP verified — clear from store
    otpStore.delete(cleanMobile);

    // Find or auto-register user in MongoDB
    let user;
    let isNewUser = false;

    try {
      user = await User.findOne({ mobile: cleanMobile });

      if (!user) {
        // Auto-register with provided name or a placeholder
        isNewUser = true;
        const userName = name?.trim() || `User_${cleanMobile.slice(-4)}`;
        const userRole = role || 'Tenant';
        const newId = `USR-${Date.now()}`;

        user = await User.create({
          customId: newId,
          name: userName,
          email: `${cleanMobile}@propertyhub.temp`,
          mobile: cleanMobile,
          role: userRole,
          status: 'Active',
        });
      }
    } catch (dbErr) {
      // Fallback: create a session-only user if DB is unavailable
      console.warn('[AUTH] DB error, using fallback user:', dbErr.message);
      user = {
        customId: `USR-${cleanMobile}`,
        name: name?.trim() || `User_${cleanMobile.slice(-4)}`,
        mobile: cleanMobile,
        role: role || 'Tenant',
        status: 'Active',
        city: 'Lucknow',
        locality: 'Gomti Nagar',
        profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      };
      isNewUser = true;
    }

    const payload = {
      id: user.customId || user._id?.toString(),
      mobile: cleanMobile,
      role: user.role,
    };

    const token = generateToken(payload);

    return successResponse(res, 200, isNewUser ? 'Account created & logged in' : 'Login successful', {
      token,
      isNewUser,
      user: {
        id: user.customId || user._id?.toString(),
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage || '',
        city: user.city || 'Lucknow',
        locality: user.locality || 'Gomti Nagar',
        status: user.status,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @desc    Get logged-in user's profile (by token)
// @route   GET /api/auth/me
// @access  Private (requires Authorization: Bearer <token>)
// ────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const { mobile, id } = req.user || {};

    let user;
    try {
      if (mobile) {
        user = await User.findOne({ mobile });
      } else if (id) {
        user = await User.findOne({
          $or: [{ customId: id }, ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])],
        });
      }
    } catch (dbErr) {
      console.warn('[AUTH] getMe DB error:', dbErr.message);
    }

    if (!user) {
      return errorResponse(res, 404, 'User profile not found');
    }

    return successResponse(res, 200, 'Profile fetched', {
      id: user.customId || user._id?.toString(),
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage || '',
      city: user.city || 'Lucknow',
      locality: user.locality || 'Gomti Nagar',
      status: user.status,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @desc    Update user profile (name, city, locality, profileImage)
// @route   PATCH /api/auth/profile
// @access  Private
// ────────────────────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { mobile, id } = req.user || {};
    const { name, city, locality, profileImage } = req.body;

    let user;
    try {
      if (mobile) {
        user = await User.findOne({ mobile });
      } else if (id) {
        user = await User.findOne({ customId: id });
      }

      if (user) {
        if (name) user.name = name.trim();
        if (city) user.city = city.trim();
        if (locality) user.locality = locality.trim();
        if (profileImage) user.profileImage = profileImage;
        await user.save();
      }
    } catch (dbErr) {
      console.warn('[AUTH] updateProfile DB error:', dbErr.message);
      return errorResponse(res, 500, 'Could not update profile in database');
    }

    if (!user) return errorResponse(res, 404, 'User not found');

    return successResponse(res, 200, 'Profile updated successfully', {
      id: user.customId || user._id?.toString(),
      name: user.name,
      city: user.city,
      locality: user.locality,
      profileImage: user.profileImage,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @desc    Admin Login (email + password hardcoded for now)
// @route   POST /api/auth/admin-login
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide email and password');
    }

    if (email === 'aarav@propertyhub.in' && password === 'admin123') {
      const token = generateToken({
        id: 'ADM-01',
        name: 'Aarav Singhania',
        email: 'aarav@propertyhub.in',
        role: 'Super Admin',
      });

      return successResponse(res, 200, 'Admin login authorized successfully', {
        token,
        admin: {
          id: 'ADM-01',
          name: 'Aarav Singhania',
          email: 'aarav@propertyhub.in',
          role: 'Super Administrator',
        },
      });
    }

    return errorResponse(res, 401, 'Invalid administrative credentials');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Legacy alias kept for backwards compatibility
const phoneLogin = verifyOtp;

module.exports = {
  sendOtp,
  verifyOtp,
  getMe,
  updateProfile,
  adminLogin,
  phoneLogin,
};
