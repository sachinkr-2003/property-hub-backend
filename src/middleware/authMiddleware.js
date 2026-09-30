const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/apiResponse');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, 401, 'Unauthorized: Access token missing');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'property_hub_super_secret_jwt_key_2026_xyz');
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 401, 'Unauthorized: Invalid or expired token');
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(res, 403, `Forbidden: User role '${req.user?.role}' is not authorized to access this route`);
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
