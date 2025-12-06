const Borrowing = require('../../models/Borrowing');
const Book = require('../../models/Book');
const User = require('../../models/User');
const { isAuthenticated, isAdmin, isMember } = require('../context');

const borrowResolver = {
  Query: {
    // Get current user's borrow history
    myBorrowHistory: async (_, { status, pagination = {} }, context) => {
      const user = isAuthenticated(context);

      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      const query = { user: user._id };
      if (status) {
        query.status = status;
      }

      const [borrowings, totalCount] = await Promise.all([
        Borrowing.find(query)
          .sort({ borrowDate: -1 })
          .skip(skip)
          .limit(limit)
          .populate('book')
          .populate('user'),
        Borrowing.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        borrowings,
        pageInfo: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    },

    // Get current user's active borrowings
    myCurrentBorrowings: async (_, __, context) => {
      const user = isAuthenticated(context);

      // Update overdue records
      await Borrowing.updateOverdueRecords();

      const borrowings = await Borrowing.find({
        user: user._id,
        status: { $in: ['borrowed', 'overdue'] }
      })
        .sort({ dueDate: 1 })
        .populate('book')
        .populate('user');

      return borrowings;
    },

    // Get all borrowings (Admin only)
    allBorrowings: async (_, { status, pagination = {} }, context) => {
      isAdmin(context);

      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      const query = {};
      if (status) {
        query.status = status;
      }

      const [borrowings, totalCount] = await Promise.all([
        Borrowing.find(query)
          .sort({ borrowDate: -1 })
          .skip(skip)
          .limit(limit)
          .populate('book')
          .populate('user'),
        Borrowing.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        borrowings,
        pageInfo: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    },

    // Get specific user's borrow history (Admin only)
    userBorrowHistory: async (_, { userId, status, pagination = {} }, context) => {
      isAdmin(context);

      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      const query = { user: userId };
      if (status) {
        query.status = status;
      }

      const [borrowings, totalCount] = await Promise.all([
        Borrowing.find(query)
          .sort({ borrowDate: -1 })
          .skip(skip)
          .limit(limit)
          .populate('book')
          .populate('user'),
        Borrowing.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        borrowings,
        pageInfo: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    }
  },

  Mutation: {
    // Borrow a book (Member only)
    borrowBook: async (_, { bookId }, context) => {
      const user = isMember(context);

      // Check if book exists
      const book = await Book.findById(bookId);
      if (!book) {
        throw new Error('Book not found');
      }

      // Check availability
      if (book.availableCopies <= 0) {
        throw new Error('No copies available for borrowing');
      }

      // Check if user already has this book
      const existingBorrow = await Borrowing.findOne({
        user: user._id,
        book: bookId,
        status: { $in: ['borrowed', 'overdue'] }
      });

      if (existingBorrow) {
        throw new Error('You have already borrowed this book');
      }

      // Calculate due date (14 days)
      const borrowDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      // Create borrowing record
      const borrowing = await Borrowing.create({
        user: user._id,
        book: bookId,
        borrowDate,
        dueDate,
        status: 'borrowed'
      });

      // Decrease available copies
      book.availableCopies -= 1;
      await book.save();

      // Populate and return
      await borrowing.populate('book');
      await borrowing.populate('user');

      return borrowing;
    },

    // Return a book (Member only)
    returnBook: async (_, { borrowId }, context) => {
      const user = isMember(context);

      const borrowing = await Borrowing.findById(borrowId);
      if (!borrowing) {
        throw new Error('Borrowing record not found');
      }

      // Check ownership
      if (borrowing.user.toString() !== user._id.toString()) {
        throw new Error('This borrowing record does not belong to you');
      }

      // Check if already returned
      if (borrowing.status === 'returned') {
        throw new Error('This book has already been returned');
      }

      // Update borrowing
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
      await borrowing.populate('book');
      await borrowing.populate('user');

      return borrowing;
    }
  },

  // Field resolvers for Borrowing type
  Borrowing: {
    user: async (parent) => {
      if (parent.user && parent.user.name) return parent.user;
      return await User.findById(parent.user);
    },

    book: async (parent) => {
      if (parent.book && parent.book.title) return parent.book;
      return await Book.findById(parent.book);
    }
  }
};

module.exports = borrowResolver;