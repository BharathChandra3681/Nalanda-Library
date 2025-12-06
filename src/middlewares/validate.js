const { body, param, query, validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

// Middleware to check validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    return ApiResponse.error(res, 'Validation failed', 400, errorMessages);
  }
  
  next();
};

// User registration validation
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  
  body('role')
    .optional()
    .isIn(['admin', 'member']).withMessage('Role must be admin or member'),
  
  handleValidationErrors
];

// User login validation
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors
];

// MongoDB ObjectId validation
const objectIdValidation = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage(`Invalid ${paramName} format`),
  
  handleValidationErrors
];

// Pagination validation
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  handleValidationErrors
];

// Book validation for creating a new book
const createBookValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  
  body('author')
    .trim()
    .notEmpty().withMessage('Author is required')
    .isLength({ max: 100 }).withMessage('Author name cannot exceed 100 characters'),
  
  body('isbn')
    .trim()
    .notEmpty().withMessage('ISBN is required')
    .isLength({ min: 10, max: 17 }).withMessage('ISBN must be 10-17 characters'),
  
  body('publicationDate')
    .optional()
    .isISO8601().withMessage('Invalid date format. Use YYYY-MM-DD'),
  
  body('genre')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Genre cannot exceed 50 characters'),
  
  body('totalCopies')
    .notEmpty().withMessage('Total copies is required')
    .isInt({ min: 1 }).withMessage('Total copies must be at least 1'),
  
  handleValidationErrors
];

// Book validation for updating a book
const updateBookValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  
  body('author')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Author name must be 1-100 characters'),
  
  body('isbn')
    .optional()
    .trim()
    .isLength({ min: 10, max: 17 }).withMessage('ISBN must be 10-17 characters'),
  
  body('publicationDate')
    .optional()
    .isISO8601().withMessage('Invalid date format. Use YYYY-MM-DD'),
  
  body('genre')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Genre cannot exceed 50 characters'),
  
  body('totalCopies')
    .optional()
    .isInt({ min: 0 }).withMessage('Total copies cannot be negative'),
  
  body('availableCopies')
    .optional()
    .isInt({ min: 0 }).withMessage('Available copies cannot be negative'),
  
  handleValidationErrors
];

// Borrow book validation
const borrowBookValidation = [
  body('bookId')
    .notEmpty().withMessage('Book ID is required')
    .isMongoId().withMessage('Invalid book ID format'),
  
  handleValidationErrors
];

// Book listing query validation
const bookQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('genre')
    .optional()
    .trim()
    .toLowerCase(),
  
  query('author')
    .optional()
    .trim(),
  
  query('search')
    .optional()
    .trim(),
  
  query('available')
    .optional()
    .isBoolean().withMessage('Available must be true or false')
    .toBoolean(),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  objectIdValidation,
  paginationValidation,
  createBookValidation,
  updateBookValidation,
  borrowBookValidation,
  bookQueryValidation
};