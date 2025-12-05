const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const bookRoutes = require('./bookRoutes');
const borrowRoutes = require('./borrowRoutes');
const reportRoutes = require('./reportRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/borrow', borrowRoutes);
router.use('/reports', reportRoutes);

// API info
router.get('/', (req, res) => {
  res.json({
    message: 'Nalanda Library Management System API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/me': 'Get current user profile',
        'GET /api/auth/users': 'Get all users (Admin)',
        'PATCH /api/auth/users/:id/role': 'Update user role (Admin)',
        'DELETE /api/auth/users/:id': 'Deactivate user (Admin)'
      },
      books: {
        'GET /api/books': 'Get all books (with filters)',
        'GET /api/books/:id': 'Get book by ID',
        'POST /api/books': 'Add new book (Admin)',
        'PUT /api/books/:id': 'Update book (Admin)',
        'DELETE /api/books/:id': 'Delete book (Admin)'
      },
      borrow: {
        'POST /api/borrow': 'Borrow a book (Member)',
        'POST /api/borrow/return/:id': 'Return a book (Member)',
        'GET /api/borrow/history': 'Get own borrow history',
        'GET /api/borrow/current': 'Get currently borrowed books',
        'GET /api/borrow/all': 'Get all borrowings (Admin)',
        'GET /api/borrow/history/:userId': 'Get user borrow history (Admin)'
      },
      reports: {
        'GET /api/reports/most-borrowed': 'Most borrowed books (Admin)',
        'GET /api/reports/active-members': 'Most active members (Admin)',
        'GET /api/reports/availability': 'Book availability summary (Admin)',
        'GET /api/reports/genre-distribution': 'Genre distribution (Admin)'
      }
    }
  });
});

module.exports = router;