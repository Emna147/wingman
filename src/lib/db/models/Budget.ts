import mongoose from 'mongoose';

const budgetCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['Accommodation', 'Food', 'Transport', 'Social', 'Miscellaneous'],
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    totalMonthly: {
      type: Number,
      required: true,
      min: 0,
    },
    template: {
      type: String,
      enum: ['Backpacker', 'Digital Nomad', 'Comfortable', 'Custom'],
      required: true,
    },
    categories: {
      type: [budgetCategorySchema],
      required: true,
      validate: {
        validator: function(categories: any[]) {
          return categories.length === 5;
        },
        message: 'Budget must have exactly 5 categories',
      },
    },
    month: {
      type: Date,
      required: true,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries
budgetSchema.index({ userId: 1, month: -1, active: 1 });

// Validate that percentages sum to 100
budgetSchema.pre('save', function(next) {
  const total = this.categories.reduce((sum, cat) => sum + cat.percentage, 0);
  if (Math.abs(total - 100) > 0.01) {
    next(new Error('Category percentages must sum to 100'));
  } else {
    next();
  }
});

const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);

export default Budget;