const Book = require('../models/Book');

class BookService {
  // Create a new book (Admin only)
  async createBook(bookData, adminId) {
    const { title, author, isbn, publicationDate, genre, totalCopies } = bookData;

    // Check if ISBN already exists
    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      const error = new Error('A book with this ISBN already exists');
      error.statusCode = 400;
      throw error;
    }

    const book = await Book.create({
      title,
      author,
      isbn,
      publicationDate,
      genre,
      totalCopies,
      availableCopies: totalCopies,
      addedBy: adminId
    });

    return book;
  }

  // Get all books with pagination and filtering
  async getAllBooks(queryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      genre,
      author,
      search,
      available
    } = queryOptions;

    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};

    if (genre) {
      filter.genre = genre.toLowerCase();
    }

    if (author) {
      filter.author = { $regex: author, $options: 'i' };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    if (available === true) {
      filter.availableCopies = { $gt: 0 };
    } else if (available === false) {
      filter.availableCopies = 0;
    }

    const [books, totalCount] = await Promise.all([
      Book.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('addedBy', 'name email'),
      Book.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      books,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  // Get single book by ID
  async getBookById(bookId) {
    const book = await Book.findById(bookId).populate('addedBy', 'name email');

    if (!book) {
      const error = new Error('Book not found');
      error.statusCode = 404;
      throw error;
    }

    return book;
  }

  // Update book (Admin only)
  async updateBook(bookId, updateData) {
    const book = await Book.findById(bookId);

    if (!book) {
      const error = new Error('Book not found');
      error.statusCode = 404;
      throw error;
    }

    // If ISBN is being updated, check for duplicates
    if (updateData.isbn && updateData.isbn !== book.isbn) {
      const existingBook = await Book.findOne({ isbn: updateData.isbn });
      if (existingBook) {
        const error = new Error('A book with this ISBN already exists');
        error.statusCode = 400;
        throw error;
      }
    }

    // Handle totalCopies update - adjust availableCopies accordingly
    if (updateData.totalCopies !== undefined) {
      const difference = updateData.totalCopies - book.totalCopies;
      const newAvailableCopies = book.availableCopies + difference;
      
      if (newAvailableCopies < 0) {
        const error = new Error('Cannot reduce total copies below currently borrowed amount');
        error.statusCode = 400;
        throw error;
      }
      
      updateData.availableCopies = newAvailableCopies;
    }

    // Update allowed fields
    const allowedFields = ['title', 'author', 'isbn', 'publicationDate', 'genre', 'totalCopies', 'availableCopies'];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        book[field] = updateData[field];
      }
    });

    await book.save();
    return book;
  }

  // Delete book (Admin only)
  async deleteBook(bookId) {
    const book = await Book.findById(bookId);

    if (!book) {
      const error = new Error('Book not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if any copies are currently borrowed
    const borrowedCopies = book.totalCopies - book.availableCopies;
    if (borrowedCopies > 0) {
      const error = new Error(`Cannot delete book. ${borrowedCopies} copies are currently borrowed`);
      error.statusCode = 400;
      throw error;
    }

    await Book.findByIdAndDelete(bookId);
    return { message: 'Book deleted successfully' };
  }
}

module.exports = new BookService();