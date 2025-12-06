const { verifyToken } = require('../utils/encryption');
const User = require('../models/User');

const createContext = async ({ req }) => {
  const context = {
    user: null
  };

  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const encryptedToken = authHeader.split(' ')[1];
      const decoded = verifyToken(encryptedToken);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        context.user = user;
      }
    }
  } catch (error) {
    // Token invalid or expired - user remains null
    console.log('GraphQL Auth Error:', error.message);
  }

  return context;
};

// Helper functions for resolvers
const isAuthenticated = (context) => {
  if (!context.user) {
    throw new Error('Authentication required. Please login.');
  }
  return context.user;
};

const isAdmin = (context) => {
  const user = isAuthenticated(context);
  if (user.role !== 'admin') {
    throw new Error('Access denied. Admin privileges required.');
  }
  return user;
};

const isMember = (context) => {
  const user = isAuthenticated(context);
  if (user.role !== 'member') {
    throw new Error('Access denied. Member privileges required.');
  }
  return user;
};

module.exports = { 
  createContext, 
  isAuthenticated, 
  isAdmin, 
  isMember 
};