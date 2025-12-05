const { verifyToken } = require('../utils/encryption');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

// Middleware to verify JWT token and attach user to request
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.error(res, 'Access denied. No token provided', 401);
    }

    const encryptedToken = authHeader.split(' ')[1];

    // Verify and decrypt token
    const decoded = verifyToken(encryptedToken);

    // Find user and attach to request
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return ApiResponse.error(res, 'User not found', 401);
    }

    if (!user.isActive) {
      return ApiResponse.error(res, 'User account is deactivated', 401);
    }

    req.user = user;
    req.token = encryptedToken;
    next();
  } catch (error) {
    return ApiResponse.error(res, error.message || 'Invalid token', 401);
  }
};

// Middleware for role-based access control
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(
        res, 
        `Access denied. Required role: ${allowedRoles.join(' or ')}`, 
        403
      );
    }

    next();
  };
};

// Shorthand middleware for admin only routes
const adminOnly = authorize('admin');

// Shorthand middleware for member only routes
const memberOnly = authorize('member');

// Middleware for both admin and member (any authenticated user)
const authenticated = authorize('admin', 'member');

module.exports = {
  authenticate,
  authorize,
  adminOnly,
  memberOnly,
  authenticated
};