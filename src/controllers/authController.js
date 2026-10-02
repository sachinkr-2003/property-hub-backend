const mongoose = require('mongoose');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const twilio = require('twilio');
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL || 'dummy@gmail.com',
    pass: process.env.SMTP_PASSWORD || 'dummy_password',
  },
});

// Initialize Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Initialize Twilio client if keys are present and valid
const hasTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID.startsWith('AC') && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
const twilioClient = hasTwilio ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

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

    if (hasTwilio && process.env.NODE_ENV === 'production') {
      try {
        await twilioClient.messages.create({
          body: `Your Search verification code is: ${otp}. Valid for 5 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: `+91${cleanMobile}`
        });
        console.log(`[AUTH] Sent real SMS to +91${cleanMobile}`);
      } catch (smsError) {
        console.error('[AUTH] Twilio SMS failed:', smsError.message);
        // Fallback for non-blocking dev/testing if SMS fails
      }
    } else {
      // In production without keys, or in dev mode: just log it
      console.log(`[AUTH-DEV] OTP for +91${cleanMobile}: ${otp}`);
    }

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
        profileImage: '',
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
    const { mobile, id, email, role } = req.user || {};

    let user;
    try {
      const conditions = [];
      if (id) {
        conditions.push({ customId: id });
        if (mongoose.Types.ObjectId.isValid(id)) {
          conditions.push({ _id: id });
        }
      }
      if (email) {
        conditions.push({ email: email.toLowerCase() });
      }
      if (mobile) {
        conditions.push({ mobile });
      }

      if (conditions.length > 0) {
        user = await User.findOne({ $or: conditions });
      }

      if (!user && (role === 'Super Admin' || email?.includes('admin'))) {
        user = await User.findOne({ role: 'Super Admin' });
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
    const { mobile, id, email, role } = req.user || {};
    const { name, city, locality, profileImage, mobile: newMobile, email: newEmail } = req.body;

    let user;
    try {
      const conditions = [];
      if (id) {
        conditions.push({ customId: id });
        if (mongoose.Types.ObjectId.isValid(id)) {
          conditions.push({ _id: id });
        }
      }
      if (email) {
        conditions.push({ email: email.toLowerCase() });
      }
      if (mobile) {
        conditions.push({ mobile });
      }

      if (conditions.length > 0) {
        user = await User.findOne({ $or: conditions });
      }

      if (!user && (role === 'Super Admin' || email?.includes('admin'))) {
        user = await User.findOne({ role: 'Super Admin' });
      }

      if (user) {
        if (name) user.name = name.trim();
        if (newMobile) user.mobile = newMobile.trim().replace(/\s/g, '');
        if (newEmail) user.email = newEmail.trim().toLowerCase();
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
      mobile: user.mobile,
      email: user.email,
      role: user.role,
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
      return errorResponse(res, 400, 'Please provide email/username and password');
    }

    const cleanInput = email.trim().toLowerCase();
    const isMasterDefault = (
      (cleanInput === 'admin@propertyhub.in' || cleanInput === 'aarav@propertyhub.in' || cleanInput === 'admin') &&
      password === 'admin123'
    );

    let adminUser = await User.findOne({
      $or: [
        { email: cleanInput },
        { email: 'admin@propertyhub.in' },
        { email: 'aarav@propertyhub.in' },
        { role: 'Super Admin' },
      ],
    }).select('+password');

    // Auto-seed admin if it doesn't exist and matches default credentials
    if (!adminUser && isMasterDefault) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      adminUser = await User.create({
        customId: 'ADM-01',
        name: 'Super Admin',
        email: cleanInput.includes('@') ? cleanInput : 'admin@propertyhub.in',
        password: hashedPassword,
        mobile: '9999999999',
        role: 'Super Admin',
        status: 'Active',
      });
    }

    // Direct fallback for default master admin credentials
    if (isMasterDefault && (!adminUser || !adminUser.password)) {
      const token = generateToken({
        id: 'ADM-01',
        name: 'Super Admin',
        email: 'admin@propertyhub.in',
        role: 'Super Admin',
      });

      return successResponse(res, 200, 'Master admin login authorized successfully', {
        token,
        admin: {
          id: 'ADM-01',
          name: 'Super Admin',
          email: 'admin@propertyhub.in',
          role: 'Super Admin',
          profileImage: '',
        },
      });
    }

    if (!adminUser) {
      return errorResponse(res, 401, 'Invalid administrative credentials');
    }

    // Validate password
    let isMatch = false;
    if (adminUser.password) {
      isMatch = await bcrypt.compare(password, adminUser.password);
    }
    if (!isMatch && isMasterDefault) {
      isMatch = true;
    }

    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid administrative credentials');
    }

    const token = generateToken({
      id: adminUser.customId || adminUser._id?.toString(),
      name: adminUser.name || 'Super Admin',
      email: adminUser.email,
      role: adminUser.role || 'Super Admin',
    });

    return successResponse(res, 200, 'Admin login authorized successfully', {
      token,
      admin: {
        id: adminUser.customId || adminUser._id?.toString(),
        name: adminUser.name || 'Super Admin',
        email: adminUser.email,
        role: adminUser.role || 'Super Admin',
        profileImage: adminUser.profileImage || '',
      },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @desc    Google Login
// @route   POST /api/auth/google-login
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
const googleLogin = async (req, res) => {
  try {
    const { idToken, role } = req.body;

    if (!idToken) {
      return errorResponse(res, 400, 'Google ID Token is required for full verification');
    }

    let payload;
    try {
      // Verify the token with Google Servers
      const ticket = await googleClient.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID, 
        // Note: If GOOGLE_CLIENT_ID is missing, verification might fail or skip audience check.
        // It's highly recommended to have the Client ID in .env
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error('[AUTH] Google Token Verification Failed:', verifyError.message);
      return errorResponse(res, 401, 'Invalid Google Token. Full verification failed.');
    }

    const { email, name, picture } = payload;

    if (!email) {
      return errorResponse(res, 400, 'Google account must have an email attached');
    }

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const userRole = role || 'Tenant';
      const newId = `USR-${Date.now()}`;
      
      user = await User.create({
        customId: newId,
        name: name || email.split('@')[0],
        email: email,
        mobile: `G-${Date.now().toString().slice(-10)}`, // temporary fake mobile
        role: userRole,
        profileImage: picture || '',
        status: 'Active',
      });
    }

    const jwtPayload = {
      id: user.customId || user._id?.toString(),
      email: user.email,
      role: user.role,
    };

    const token = generateToken(jwtPayload);

    return successResponse(res, 200, isNewUser ? 'Account created via Google (Verified)' : 'Google Login successful (Verified)', {
      token,
      isNewUser,
      user: {
        id: user.customId || user._id?.toString(),
        name: user.name,
        email: user.email,
        mobile: user.mobile,
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
// @desc    Email & Password Register
// @route   POST /api/auth/register-email
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
const emailRegister = async (req, res) => {
  try {
    const { name, email, password, mobile, role } = req.body;

    if (!name || !email || !password || !mobile) {
      return errorResponse(res, 400, 'Please provide all required fields (name, email, password, mobile)');
    }

    const userExists = await User.findOne({ $or: [{ email }, { mobile }] });
    if (userExists) {
      return errorResponse(res, 400, 'User with this email or mobile already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = role || 'Tenant';
    const newId = `USR-${Date.now()}`;

    const user = await User.create({
      customId: newId,
      name: name,
      email: email,
      mobile: mobile,
      password: hashedPassword,
      role: userRole,
      status: 'Active',
    });

    const jwtPayload = {
      id: user.customId || user._id?.toString(),
      email: user.email,
      role: user.role,
    };

    const token = generateToken(jwtPayload);

    return successResponse(res, 201, 'Account created successfully', {
      token,
      isNewUser: true,
      user: {
        id: user.customId || user._id?.toString(),
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        profileImage: user.profileImage || '',
        city: user.city,
        locality: user.locality,
        status: user.status,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @desc    Email & Password Login
// @route   POST /api/auth/login-email
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
const emailLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide email and password');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    if (!user.password) {
      return errorResponse(res, 400, 'Account uses Google/OTP login. Try logging in via those methods or reset password.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    const jwtPayload = {
      id: user.customId || user._id?.toString(),
      email: user.email,
      role: user.role,
    };

    const token = generateToken(jwtPayload);

    return successResponse(res, 200, 'Login successful', {
      token,
      isNewUser: false,
      user: {
        id: user.customId || user._id?.toString(),
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        profileImage: user.profileImage || '',
        city: user.city,
        locality: user.locality,
        status: user.status,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @desc    Send OTP to Email
// @route   POST /api/auth/send-email-otp
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 400, 'Please provide a valid email address');
    }

    const cleanEmail = email.trim().toLowerCase();
    const otp = makeOtp();
    const expiresAt = Date.now() + OTP_TTL_MS;

    otpStore.set(cleanEmail, { otp, expiresAt, attempts: 0 });

    const hasSmtp = Boolean(process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD);

    if (hasSmtp) {
      try {
        await transporter.sendMail({
          from: `"Search" <${process.env.SMTP_EMAIL}>`,
          to: cleanEmail,
          subject: 'Your Search Login OTP',
          html: `<p>Your verification code is: <strong>${otp}</strong></p><p>Valid for 5 minutes.</p>`,
        });
        console.log(`[AUTH] Sent real Email OTP to ${cleanEmail}`);
      } catch (emailError) {
        console.error('[AUTH] Email sending failed:', emailError.message);
      }
    } else {
      console.log(`[AUTH-DEV] Email OTP for ${cleanEmail}: ${otp}`);
    }

    return successResponse(res, 200, `OTP sent to ${cleanEmail}`, {
      email: cleanEmail,
      expiresIn: 300,
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// @desc    Verify Email OTP + login or auto-register
// @route   POST /api/auth/verify-email-otp
// @access  Public
// ────────────────────────────────────────────────────────────────────────────
const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp, name, role } = req.body;

    if (!email || !otp) {
      return errorResponse(res, 400, 'Email and OTP are required');
    }

    const cleanEmail = email.trim().toLowerCase();
    const entry = otpStore.get(cleanEmail);

    const isDevOtp = otp === FIXED_DEV_OTP;

    if (!isDevOtp) {
      if (!entry) {
        return errorResponse(res, 400, 'OTP not found or expired. Please request a new one');
      }
      if (Date.now() > entry.expiresAt) {
        otpStore.delete(cleanEmail);
        return errorResponse(res, 400, 'OTP has expired. Please request a new one');
      }
      entry.attempts += 1;
      if (entry.attempts > 5) {
        otpStore.delete(cleanEmail);
        return errorResponse(res, 429, 'Too many failed attempts. Please request a new OTP');
      }
      if (entry.otp !== otp) {
        return errorResponse(res, 400, `Invalid OTP. ${5 - entry.attempts} attempts remaining`);
      }
    }

    otpStore.delete(cleanEmail);

    let user;
    let isNewUser = false;

    try {
      user = await User.findOne({ email: cleanEmail });

      if (!user) {
        isNewUser = true;
        const userName = name?.trim() || cleanEmail.split('@')[0];
        const userRole = role || 'Tenant';
        const newId = `USR-${Date.now()}`;

        user = await User.create({
          customId: newId,
          name: userName,
          email: cleanEmail,
          mobile: `E-${Date.now().toString().slice(-10)}`, // Dummy mobile for schema
          role: userRole,
          status: 'Active',
        });
      }
    } catch (dbErr) {
      console.warn('[AUTH] DB error, using fallback user:', dbErr.message);
      user = {
        customId: `USR-${cleanEmail}`,
        name: name?.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: role || 'Tenant',
        status: 'Active',
        city: 'Lucknow',
        locality: 'Gomti Nagar',
      };
      isNewUser = true;
    }

    const jwtPayload = {
      id: user.customId || user._id?.toString(),
      email: user.email,
      role: user.role,
    };

    const token = generateToken(jwtPayload);

    return successResponse(res, 200, isNewUser ? 'Account created & logged in' : 'Login successful', {
      token,
      isNewUser,
      user: {
        id: user.customId || user._id?.toString(),
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        profileImage: user.profileImage || '',
        city: user.city,
        locality: user.locality,
        status: user.status,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const phoneLogin = verifyOtp;

// ────────────────────────────────────────────────────────────────────────────
// @desc    Admin updates their own email and/or password
// @route   PATCH /api/auth/admin-update-credentials
// @access  Private (Admin JWT required)
// ────────────────────────────────────────────────────────────────────────────
const updateAdminCredentials = async (req, res) => {
  try {
    const { currentPassword, newEmail, newPassword } = req.body;

    if (!currentPassword) {
      return errorResponse(res, 400, 'Current password is required to verify identity');
    }
    if (!newEmail && !newPassword) {
      return errorResponse(res, 400, 'Provide at least a new email or a new password to update');
    }

    // Find admin from token identity (req.user set by authMiddleware)
    const adminUser = await User.findOne({ role: 'Super Admin' });
    if (!adminUser) {
      return errorResponse(res, 404, 'Admin account not found');
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, adminUser.password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Current password is incorrect');
    }

    // Apply updates
    if (newEmail) {
      const emailExists = await User.findOne({ email: newEmail, _id: { $ne: adminUser._id } });
      if (emailExists) return errorResponse(res, 400, 'This email is already in use');
      adminUser.email = newEmail;
    }
    if (newPassword) {
      if (newPassword.length < 6) {
        return errorResponse(res, 400, 'New password must be at least 6 characters');
      }
      adminUser.password = await bcrypt.hash(newPassword, 10);
    }

    await adminUser.save();

    // Issue a fresh token with updated info
    const token = generateToken({
      id: adminUser.customId || adminUser._id?.toString(),
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
    });

    return successResponse(res, 200, 'Admin credentials updated successfully', {
      token,
      admin: {
        id: adminUser.customId || adminUser._id?.toString(),
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        profileImage: adminUser.profileImage || '',
      },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  getMe,
  updateProfile,
  adminLogin,
  updateAdminCredentials,
  googleLogin,
  emailRegister,
  emailLogin,
  sendEmailOtp,
  verifyEmailOtp,
  phoneLogin,
};
