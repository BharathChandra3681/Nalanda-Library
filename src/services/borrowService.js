const Borrowing = require('../models/Borrowing');
const Book = require('../models/Book');

class BorrowService {
  // Borrow a book (Member only)
  async borrowBook(userId, bookId) {
    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      const error = new Error('Book not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if book is available
    if (book.availableCopies <= 0) {
      const error = new Error('No copies available for borrowing');
      error.statusCode = 400;
      throw error;
    }

    // Check if user already has this book borrowed (not returned)
    const existingBorrow = await Borrowing.findOne({
      user: userId,
      book: bookId,
      status: { $in: ['borrowed', 'overdue'] }
    });

    if (existingBorrow) {
      const error = new Error('You have already borrowed this book');
      error.statusCode = 400;
      throw error;
    }

    // Calculate due date (14 days from now)
    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // Create borrowing record
    const borrowing = await Borrowing.create({
      user: userId,
      book: bookId,
      borrowDate,
      dueDate,
      status: 'borrowed'
    });

    // Decrease available copies
    book.availableCopies -= 1;
    await book.save();

    // Populate and return
    await borrowing.populate('book', 'title author isbn');
    await borrowing.populate('user', 'name email');

    return borrowing;
  }

  // Return a book (Member only)
  async returnBook(userId, borrowId) {
    const borrowing = await Borrowing.findById(borrowId);

    if (!borrowing) {
      const error = new Error('Borrowing record not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if this borrowing belongs to the user
    if (borrowing.user.toString() !== userId.toString()) {
      const error = new Error('This borrowing record does not belong to you');
      error.statusCode = 403;
      throw error;
    }

    // Check if already returned
    if (borrowing.status === 'returned') {
      const error = new Error('This book has already been returned');
      error.statusCode = 400;
      throw error;
    }

    // Update borrowing record
    borrowing.returnDate = new Date();
    borrowing.status = 'returned';
    await borrowing.save();

    // Increase available copies
    const book = await Book.findById(borrowing.book);
    if (book) {
      book.availableCopies += 1;
      await book.save();
    }

    // Populate and return
    await borrowing.populate('book', 'title author isbn');
    await borrowing.populate('user', 'name email');

    return borrowing;
  }

  // Get user's borrowing history
  async getUserBorrowHistory(userId, options = {}) {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    const filter = { user: userId };
    if (status) {
      filter.status = status;
    }

    const [borrowings, totalCount] = await Promise.all([
      Borrowing.find(filter)
        .sort({ borrowDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('book', 'title author isbn genre'),
      Borrowing.countDocuments(filter)
    ]);

    return {
      borrowings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      }
    };
  }

  // Get user's currently borrowed books
  async getCurrentBorrowings(userId) {
    // Update overdue status first
    await Borrowing.updateOverdueRecords();

    const borrowings = await Borrowing.find({
      user: userId,
      status: { $in: ['borrowed', 'overdue'] }
    })
      .sort({ dueDate: 1 })
      .populate('book', 'title author isbn genre');

    return borrowings;
  }

  // Admin: Get any user's borrow history
  async getUserBorrowHistoryAdmin(userId, options = {}) {
    return this.getUserBorrowHistory(userId, options);
  }

  // Admin: Get all borrowings
  async getAllBorrowings(options = {}) {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const [borrowings, totalCount] = await Promise.all([
      Borrowing.find(filter)
        .sort({ borrowDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('book', 'title author isbn')
        .populate('user', 'name email'),
      Borrowing.countDocuments(filter)
    ]);

    return {
      borrowings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      }
    };
  }
}

module.exports = new BorrowService();