const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const { authenticate, adminOnly, memberOnly } = require('../middlewares/auth');
const {
  borrowBookValidation,
  objectIdValidation,
  paginationValidation
} = require('../middlewares/validate');

// Member routes
router.post(
  '/',
  authenticate,
  memberOnly,
  borrowBookValidation,
  borrowController.borrowBook
);

router.post(
  '/return/:id',
  authenticate,
  memberOnly,
  objectIdValidation('id'),
  borrowController.returnBook
);

router.get(
  '/history',
  authenticate,
  paginationValidation,
  borrowController.getMyBorrowHistory
);

router.get(
  '/current',
  authenticate,
  borrowController.getCurrentBorrowings
);

// Admin routes
router.get(
  '/all',
  authenticate,
  adminOnly,
  paginationValidation,
  borrowController.getAllBorrowings
);

router.get(
  '/history/:userId',
  authenticate,
  adminOnly,
  objectIdValidation('userId'),
  borrowController.getUserBorrowHistory
);

module.exports = router;