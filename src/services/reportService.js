const Borrowing = require('../models/Borrowing');
const Book = require('../models/Book');
const User = require('../models/User');

class ReportService {
  // Get most borrowed books
  async getMostBorrowedBooks(limit = 10) {
    const result = await Borrowing.aggregate([
      // Group by book and count borrowings
      {
        $group: {
          _id: '$book',
          borrowCount: { $sum: 1 }
        }
      },
      // Sort by borrow count descending
      {
        $sort: { borrowCount: -1 }
      },
      // Limit results
      {
        $limit: limit
      },
      // Lookup book details
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'bookDetails'
        }
      },
      // Unwind book details
      {
        $unwind: '$bookDetails'
      },
      // Project final shape
      {
        $project: {
          _id: 0,
          bookId: '$_id',
          borrowCount: 1,
          title: '$bookDetails.title',
          author: '$bookDetails.author',
          isbn: '$bookDetails.isbn',
          genre: '$bookDetails.genre'
        }
      }
    ]);

    return result;
  }

  // Get most active members
  async getActiveMembers(limit = 10) {
    const result = await Borrowing.aggregate([
      // Group by user and count borrowings
      {
        $group: {
          _id: '$user',
          borrowCount: { $sum: 1 },
          lastBorrowed: { $max: '$borrowDate' }
        }
      },
      // Sort by borrow count descending
      {
        $sort: { borrowCount: -1 }
      },
      // Limit results
      {
        $limit: limit
      },
      // Lookup user details
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      // Unwind user details
      {
        $unwind: '$userDetails'
      },
      // Project final shape
      {
        $project: {
          _id: 0,
          userId: '$_id',
          borrowCount: 1,
          lastBorrowed: 1,
          name: '$userDetails.name',
          email: '$userDetails.email',
          role: '$userDetails.role'
        }
      }
    ]);

    return result;
  }

  // Get book availability summary
  async getAvailabilitySummary() {
    const [bookStats, borrowingStats] = await Promise.all([
      // Book statistics
      Book.aggregate([
        {
          $group: {
            _id: null,
            totalBooks: { $sum: '$totalCopies' },
            availableBooks: { $sum: '$availableCopies' },
            uniqueTitles: { $sum: 1 }
          }
        }
      ]),
      // Borrowing statistics
      Borrowing.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const stats = bookStats[0] || {
      totalBooks: 0,
      availableBooks: 0,
      uniqueTitles: 0
    };

    // Process borrowing stats
    const borrowingByStatus = {};
    borrowingStats.forEach(item => {
      borrowingByStatus[item._id] = item.count;
    });

    return {
      books: {
        totalCopies: stats.totalBooks,
        availableCopies: stats.availableBooks,
        borrowedCopies: stats.totalBooks - stats.availableBooks,
        uniqueTitles: stats.uniqueTitles
      },
      borrowings: {
        currentlyBorrowed: borrowingByStatus.borrowed || 0,
        overdue: borrowingByStatus.overdue || 0,
        returned: borrowingByStatus.returned || 0,
        total: Object.values(borrowingByStatus).reduce((a, b) => a + b, 0)
      }
    };
  }

  // Get genre-wise distribution
  async getGenreDistribution() {
    const result = await Book.aggregate([
      {
        $group: {
          _id: '$genre',
          count: { $sum: 1 },
          totalCopies: { $sum: '$totalCopies' },
          availableCopies: { $sum: '$availableCopies' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $project: {
          _id: 0,
          genre: { $ifNull: ['$_id', 'Uncategorized'] },
          titleCount: '$count',
          totalCopies: 1,
          availableCopies: 1
        }
      }
    ]);

    return result;
  }
}

module.exports = new ReportService();