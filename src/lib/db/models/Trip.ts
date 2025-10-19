import mongoose, { Schema, model, models, Document } from 'mongoose';

interface TripActivity {
  name: string;
  time?: string;
  estimatedCost?: number;
  notes?: string;
}

interface TripDay {
  date: Date;
  activities: TripActivity[];
  dailyBudget?: number;
}

export interface ITrip extends Document {
  creatorId: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  budgetEstimate?: number;
  collaboratorIds: string[];
  itinerary: TripDay[];
  visibility: 'private' | 'friends' | 'public';
  status: 'planning' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<ITrip>(
  {
    creatorId: {
      type: String,
      required: true,
      index: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function(this: ITrip, value: Date) {
          return value >= this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    budgetEstimate: {
      type: Number,
      min: 0,
    },
    collaboratorIds: {
      type: [String],
      default: [],
    },
    itinerary: [
      {
        date: Date,
        activities: [
          {
            name: String,
            time: String,
            estimatedCost: Number,
            notes: String,
          },
        ],
        dailyBudget: Number,
      },
    ],
    visibility: {
      type: String,
      enum: ['private', 'friends', 'public'],
      default: 'private',
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed'],
      default: 'planning',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TripSchema.index({ creatorId: 1, status: 1 });
TripSchema.index({ collaboratorIds: 1 });
TripSchema.index({ startDate: -1 });

// Virtual: trip duration in days
TripSchema.virtual('durationDays').get(function() {
  const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method: Check if user can edit
TripSchema.methods.canEdit = function(userId: string) {
  return this.creatorId === userId || this.collaboratorIds.includes(userId);
};

const Trip = models.Trip || model<ITrip>('Trip', TripSchema);

export default Trip;