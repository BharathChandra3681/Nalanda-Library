const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticate, adminOnly } = require('../middlewares/auth');
const {
  createBookValidation,
  updateBookValidation,
  objectIdValidation,
  bookQueryValidation
} = require('../middlewares/validate');

// Public routes (but still need authentication)
router.get(
  '/',
  authenticate,
  bookQueryValidation,
  bookController.getAllBooks
);

router.get(
  '/:id',
  authenticate,
  objectIdValidation('id'),
  bookController.getBookById
);

// Admin only routes
router.post(
  '/',
  authenticate,
  adminOnly,
  createBookValidation,
  bookController.createBook
);

router.put(
  '/:id',
  authenticate,
  adminOnly,
  objectIdValidation('id'),
  updateBookValidation,
  bookController.updateBook
);

router.delete(
  '/:id',
  authenticate,
  adminOnly,
  objectIdValidation('id'),
  bookController.deleteBook
);

module.exports = router;