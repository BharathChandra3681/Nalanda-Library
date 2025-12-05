const reportService = require('../services/reportService');
const ApiResponse = require('../utils/apiResponse');

// GET /api/reports/most-borrowed - Get most borrowed books
const getMostBorrowedBooks = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const books = await reportService.getMostBorrowedBooks(limit);
    return ApiResponse.success(
      res,
      { books, count: books.length },
      'Most borrowed books retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/active-members - Get most active members
const getActiveMembers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const members = await reportService.getActiveMembers(limit);
    return ApiResponse.success(
      res,
      { members, count: members.length },
      'Active members retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/availability - Get book availability summary
const getAvailabilitySummary = async (req, res, next) => {
  try {
    const summary = await reportService.getAvailabilitySummary();
    return ApiResponse.success(
      res,
      { summary },
      'Availability summary retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/genre-distribution - Get genre-wise distribution
const getGenreDistribution = async (req, res, next) => {
  try {
    const distribution = await reportService.getGenreDistribution();
    return ApiResponse.success(
      res,
      { distribution },
      'Genre distribution retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMostBorrowedBooks,
  getActiveMembers,
  getAvailabilitySummary,
  getGenreDistribution
};