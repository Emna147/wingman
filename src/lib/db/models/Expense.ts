import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IExpense extends Document {
  userId: string; // References BetterAuth user
  amount: number;
  category: string;
  description: string;
  date: Date;
  location?: string;
  tags: string[];
  paymentMethod: string;
  receiptImage?: string;
  synced: boolean;
  tripId?: string; // Optional: link to a trip
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true, // Fast lookups by user
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['food', 'transport', 'accommodation', 'activities', 'shopping', 'other'],
        message: '{VALUE} is not a valid category',
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    location: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'digital_wallet'],
      default: 'card',
    },
    receiptImage: {
      type: String, // URL or path to image
    },
    synced: {
      type: Boolean,
      default: true,
    },
    tripId: {
      type: String, // Will reference Trip model
      index: true,
    },
  },
  {
    timestamps: true, // Auto-adds createdAt and updatedAt
  }
);

// Indexes for performance
ExpenseSchema.index({ userId: 1, date: -1 }); // User's expenses sorted by date
ExpenseSchema.index({ userId: 1, category: 1 }); // Expenses by category
ExpenseSchema.index({ tripId: 1 }); // All expenses for a trip

// Virtual field: formatted amount with currency
ExpenseSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Method: Check if expense is recent (within 24 hours)
ExpenseSchema.methods.isRecent = function() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.date > oneDayAgo;
};

// Static method: Get user's total expenses
ExpenseSchema.statics.getTotalByUser = async function(userId: string) {
  const result = await this.aggregate([
    { $match: { userId } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result[0]?.total || 0;
};

// Prevent model recompilation in development
const Expense = models.Expense || model<IExpense>('Expense', ExpenseSchema);

export default Expense;