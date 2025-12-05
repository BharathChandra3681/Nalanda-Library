const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, adminOnly } = require('../middlewares/auth');

// All report routes are admin only
router.get(
  '/most-borrowed',
  authenticate,
  adminOnly,
  reportController.getMostBorrowedBooks
);

router.get(
  '/active-members',
  authenticate,
  adminOnly,
  reportController.getActiveMembers
);

router.get(
  '/availability',
  authenticate,
  adminOnly,
  reportController.getAvailabilitySummary
);

router.get(
  '/genre-distribution',
  authenticate,
  adminOnly,
  reportController.getGenreDistribution
);

module.exports = router;