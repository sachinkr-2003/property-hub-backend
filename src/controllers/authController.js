const generateToken = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Admin & Staff Login
// @route   POST /api/auth/admin-login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Default master admin credential check (or database lookup)
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

// @desc    Mobile User Phone OTP Verification / Login
// @route   POST /api/auth/phone-login
// @access  Public
const phoneLogin = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile) {
      return errorResponse(res, 400, 'Please provide a valid phone number');
    }

    // Default test OTP check
    if (otp && otp !== '1234') {
      return errorResponse(res, 400, 'Invalid verification OTP');
    }

    const token = generateToken({
      mobile,
      role: 'Tenant',
    });

    return successResponse(res, 200, 'Phone login verified successfully', {
      token,
      user: {
        mobile,
        role: 'Tenant',
        name: 'Verified User',
      },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  adminLogin,
  phoneLogin,
};
