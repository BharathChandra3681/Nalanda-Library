const Book = require('../../models/Book');
const User = require('../../models/User');
const { isAuthenticated, isAdmin } = require('../context');

const bookResolver = {
  Query: {
    // Get all books with filtering and pagination
    books: async (_, { filter = {}, pagination = {} }, context) => {
      isAuthenticated(context);

      const { page = 1, limit = 10 } = pagination;
      const { genre, author, search, available } = filter;
      const skip = (page - 1) * limit;

      // Build filter query
      const query = {};

      if (genre) {
        query.genre = genre.toLowerCase();
      }

      if (author) {
        query.author = { $regex: author, $options: 'i' };
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { author: { $regex: search, $options: 'i' } }
        ];
      }

      if (available === true) {
        query.availableCopies = { $gt: 0 };
      } else if (available === false) {
        query.availableCopies = 0;
      }

      const [books, totalCount] = await Promise.all([
        Book.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Book.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        books,
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

    // Get single book by ID
    book: async (_, { id }, context) => {
      isAuthenticated(context);

      const book = await Book.findById(id);
      if (!book) {
        throw new Error('Book not found');
      }

      return book;
    }
  },

  Mutation: {
    // Create book (Admin only)
    createBook: async (_, { input }, context) => {
      const admin = isAdmin(context);

      const { title, author, isbn, publicationDate, genre, totalCopies } = input;

      // Check if ISBN exists
      const existingBook = await Book.findOne({ isbn });
      if (existingBook) {
        throw new Error('A book with this ISBN already exists');
      }

      const book = await Book.create({
        title,
        author,
        isbn,
        publicationDate,
        genre,
        totalCopies,
        availableCopies: totalCopies,
        addedBy: admin._id
      });

      return book;
    },

    // Update book (Admin only)
    updateBook: async (_, { id, input }, context) => {
      isAdmin(context);

      const book = await Book.findById(id);
      if (!book) {
        throw new Error('Book not found');
      }

      // Check ISBN uniqueness if being updated
      if (input.isbn && input.isbn !== book.isbn) {
        const existingBook = await Book.findOne({ isbn: input.isbn });
        if (existingBook) {
          throw new Error('A book with this ISBN already exists');
        }
      }

      // Handle totalCopies update
      if (input.totalCopies !== undefined) {
        const difference = input.totalCopies - book.totalCopies;
        const newAvailableCopies = book.availableCopies + difference;

        if (newAvailableCopies < 0) {
          throw new Error('Cannot reduce total copies below currently borrowed amount');
        }

        input.availableCopies = newAvailableCopies;
      }

      // Update fields
      Object.keys(input).forEach(key => {
        if (input[key] !== undefined) {
          book[key] = input[key];
        }
      });

      await book.save();
      return book;
    },

    // Delete book (Admin only)
    deleteBook: async (_, { id }, context) => {
      isAdmin(context);

      const book = await Book.findById(id);
      if (!book) {
        throw new Error('Book not found');
      }

      const borrowedCopies = book.totalCopies - book.availableCopies;
      if (borrowedCopies > 0) {
        throw new Error(`Cannot delete book. ${borrowedCopies} copies are currently borrowed`);
      }

      await Book.findByIdAndDelete(id);
      return true;
    }
  },

  // Field resolver for Book type
  Book: {
    isAvailable: (parent) => {
      return parent.availableCopies > 0;
    },

    addedBy: async (parent) => {
      if (!parent.addedBy) return null;
      return await User.findById(parent.addedBy);
    }
  }
};

module.exports = bookResolver;