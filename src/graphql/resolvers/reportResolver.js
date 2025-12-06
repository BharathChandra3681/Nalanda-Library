const Borrowing = require('../../models/Borrowing');
const Book = require('../../models/Book');
const { isAdmin } = require('../context');

const reportResolver = {
  Query: {
    // Most borrowed books (Admin only)
    mostBorrowedBooks: async (_, { limit = 10 }, context) => {
      isAdmin(context);

      const result = await Borrowing.aggregate([
        {
          $group: {
            _id: '$book',
            borrowCount: { $sum: 1 }
          }
        },
        {
          $sort: { borrowCount: -1 }
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'bookDetails'
          }
        },
        {
          $unwind: '$bookDetails'
        },
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
    },

    // Most active members (Admin only)
    activeMembers: async (_, { limit = 10 }, context) => {
      isAdmin(context);

      const result = await Borrowing.aggregate([
        {
          $group: {
            _id: '$user',
            borrowCount: { $sum: 1 },
            lastBorrowed: { $max: '$borrowDate' }
          }
        },
        {
          $sort: { borrowCount: -1 }
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userDetails'
          }
        },
        {
          $unwind: '$userDetails'
        },
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
    },

    // Book availability summary (Admin only)
    availabilitySummary: async (_, __, context) => {
      isAdmin(context);

      const [bookStats, borrowingStats] = await Promise.all([
        Book.aggregate([
          {
            $group: {
              _id: null,
              totalCopies: { $sum: '$totalCopies' },
              availableCopies: { $sum: '$availableCopies' },
              uniqueTitles: { $sum: 1 }
            }
          }
        ]),
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
        totalCopies: 0,
        availableCopies: 0,
        uniqueTitles: 0
      };

      const borrowingByStatus = {};
      borrowingStats.forEach(item => {
        borrowingByStatus[item._id] = item.count;
      });

      return {
        books: {
          totalCopies: stats.totalCopies,
          availableCopies: stats.availableCopies,
          borrowedCopies: stats.totalCopies - stats.availableCopies,
          uniqueTitles: stats.uniqueTitles
        },
        borrowings: {
          currentlyBorrowed: borrowingByStatus.borrowed || 0,
          overdue: borrowingByStatus.overdue || 0,
          returned: borrowingByStatus.returned || 0,
          total: Object.values(borrowingByStatus).reduce((a, b) => a + b, 0)
        }
      };
    },

    // Genre distribution (Admin only)
    genreDistribution: async (_, __, context) => {
      isAdmin(context);

      const result = await Book.aggregate([
        {
          $group: {
            _id: '$genre',
            titleCount: { $sum: 1 },
            totalCopies: { $sum: '$totalCopies' },
            availableCopies: { $sum: '$availableCopies' }
          }
        },
        {
          $sort: { titleCount: -1 }
        },
        {
          $project: {
            _id: 0,
            genre: { $ifNull: ['$_id', 'Uncategorized'] },
            titleCount: 1,
            totalCopies: 1,
            availableCopies: 1
          }
        }
      ]);

      return result;
    }
  }
};

module.exports = reportResolver;