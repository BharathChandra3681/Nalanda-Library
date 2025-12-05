const mongoose = require('mongoose');

const borrowingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required']
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book is required']
    },
    borrowDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: true
    },
    returnDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['borrowed', 'returned', 'overdue'],
      default: 'borrowed'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
borrowingSchema.index({ user: 1, status: 1 });
borrowingSchema.index({ book: 1, status: 1 });
borrowingSchema.index({ borrowDate: -1 });
borrowingSchema.index({ dueDate: 1 });

// Set default due date (14 days from borrow date)
borrowingSchema.pre('save', function (next) {
  if (!this.dueDate) {
    const dueDate = new Date(this.borrowDate);
    dueDate.setDate(dueDate.getDate() + 14);
    this.dueDate = dueDate;
  }
  next();
});

// Static method to check and update overdue status
borrowingSchema.statics.updateOverdueRecords = async function () {
  const now = new Date();
  await this.updateMany(
    {
      status: 'borrowed',
      dueDate: { $lt: now }
    },
    {
      status: 'overdue'
    }
  );
};

module.exports = mongoose.model('Borrowing', borrowingSchema);