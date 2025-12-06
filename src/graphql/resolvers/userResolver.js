const User = require('../../models/User');
const Borrowing = require('../../models/Borrowing');
const { generateToken } = require('../../utils/encryption');
const { isAuthenticated, isAdmin } = require('../context');

const userResolver = {
  Query: {
    // Get current user profile
    me: async (_, __, context) => {
      const user = isAuthenticated(context);
      return user;
    },

    // Get all users (Admin only)
    users: async (_, { pagination = {} }, context) => {
      isAdmin(context);
      
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      const [users, totalCount] = await Promise.all([
        User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments()
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        users,
        pageInfo: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    },

    // Get user by ID (Admin only)
    user: async (_, { id }, context) => {
      isAdmin(context);
      
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }
  },

  Mutation: {
    // Register new user
    register: async (_, { input }) => {
      const { name, email, password, role } = input;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        role: role || 'member'
      });

      // Generate token
      const token = generateToken({
        userId: user._id,
        role: user.role
      });

      return { token, user };
    },

    // Login user
    login: async (_, { input }) => {
      const { email, password } = input;

      // Find user with password
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated. Please contact admin.');
      }

      // Verify password
      const isValid = await user.comparePassword(password);
      if (!isValid) {
        throw new Error('Invalid email or password');
      }

      // Generate token
      const token = generateToken({
        userId: user._id,
        role: user.role
      });

      return { token, user };
    },

    // Update user role (Admin only)
    updateUserRole: async (_, { userId, role }, context) => {
      isAdmin(context);

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.role = role;
      await user.save();

      return user;
    },

    // Deactivate user (Admin only)
    deactivateUser: async (_, { userId }, context) => {
      const admin = isAdmin(context);

      if (userId === admin._id.toString()) {
        throw new Error('Cannot deactivate your own account');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.isActive = false;
      await user.save();

      return user;
    }
  },

  // Field resolver for User type
  User: {
    borrowHistory: async (parent) => {
      return await Borrowing.find({ user: parent._id })
        .sort({ borrowDate: -1 })
        .populate('book');
    }
  }
};

module.exports = userResolver;