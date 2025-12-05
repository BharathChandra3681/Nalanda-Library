const bookService = require('../services/bookService');
const ApiResponse = require('../utils/apiResponse');

// POST /api/books - Create book (Admin only)
const createBook = async (req, res, next) => {
  try {
    const book = await bookService.createBook(req.body, req.user._id);
    return ApiResponse.success(res, { book }, 'Book created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// GET /api/books - Get all books with pagination and filters
const getAllBooks = async (req, res, next) => {
  try {
    const { page, limit, genre, author, search, available } = req.query;
    
    const result = await bookService.getAllBooks({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      genre,
      author,
      search,
      available
    });

    return ApiResponse.paginated(
      res,
      result.books,
      result.pagination,
      'Books retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/books/:id - Get single book
const getBookById = async (req, res, next) => {
  try {
    const book = await bookService.getBookById(req.params.id);
    return ApiResponse.success(res, { book }, 'Book retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// PUT /api/books/:id - Update book (Admin only)
const updateBook = async (req, res, next) => {
  try {
    const book = await bookService.updateBook(req.params.id, req.body);
    return ApiResponse.success(res, { book }, 'Book updated successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/books/:id - Delete book (Admin only)
const deleteBook = async (req, res, next) => {
  try {
    const result = await bookService.deleteBook(req.params.id);
    return ApiResponse.success(res, result, 'Book deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook
};