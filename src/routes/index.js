const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');

// Mount routes
router.use('/auth', authRoutes);

// API info
router.get('/', (req, res) => {
  res.json({
    message: 'Nalanda Library Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      books: '/api/books',
      borrow: '/api/borrow',
      reports: '/api/reports'
    }
  });
});

module.exports = router;