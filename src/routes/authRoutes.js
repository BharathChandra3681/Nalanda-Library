const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, adminOnly } = require('../middlewares/auth');
const { 
  registerValidation, 
  loginValidation, 
  objectIdValidation,
  paginationValidation
} = require('../middlewares/validate');

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);

// Protected routes (any authenticated user)
router.get('/me', authenticate, authController.getProfile);

// Admin only routes
router.get(
  '/users', 
  authenticate, 
  adminOnly, 
  paginationValidation, 
  authController.getAllUsers
);

router.patch(
  '/users/:id/role', 
  authenticate, 
  adminOnly, 
  objectIdValidation('id'), 
  authController.updateUserRole
);

router.delete(
  '/users/:id', 
  authenticate, 
  adminOnly, 
  objectIdValidation('id'), 
  authController.deactivateUser
);

module.exports = router;