const borrowService = require('../services/borrowService');
const ApiResponse = require('../utils/apiResponse');

// POST /api/borrow - Borrow a book
const borrowBook = async (req, res, next) => {
  try {
    const { bookId } = req.body;
    const borrowing = await borrowService.borrowBook(req.user._id, bookId);
    return ApiResponse.success(res, { borrowing }, 'Book borrowed successfully', 201);
  } catch (error) {
    next(error);
  }
};

// POST /api/borrow/return/:id - Return a book
const returnBook = async (req, res, next) => {
  try {
    const borrowing = await borrowService.returnBook(req.user._id, req.params.id);
    return ApiResponse.success(res, { borrowing }, 'Book returned successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/borrow/history - Get own borrow history
const getMyBorrowHistory = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await borrowService.getUserBorrowHistory(req.user._id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status
    });
    return ApiResponse.paginated(
      res,
      result.borrowings,
      result.pagination,
      'Borrow history retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/borrow/current - Get currently borrowed books
const getCurrentBorrowings = async (req, res, next) => {
  try {
    const borrowings = await borrowService.getCurrentBorrowings(req.user._id);
    return ApiResponse.success(
      res,
      { borrowings, count: borrowings.length },
      'Current borrowings retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/borrow/history/:userId - Admin: Get user's borrow history
const getUserBorrowHistory = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await borrowService.getUserBorrowHistoryAdmin(req.params.userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status
    });
    return ApiResponse.paginated(
      res,
      result.borrowings,
      result.pagination,
      'User borrow history retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/borrow/all - Admin: Get all borrowings
const getAllBorrowings = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await borrowService.getAllBorrowings({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status
    });
    return ApiResponse.paginated(
      res,
      result.borrowings,
      result.pagination,
      'All borrowings retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  borrowBook,
  returnBook,
  getMyBorrowHistory,
  getCurrentBorrowings,
  getUserBorrowHistory,
  getAllBorrowings
};