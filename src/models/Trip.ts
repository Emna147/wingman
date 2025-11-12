import mongoose, { Schema, Document } from 'mongoose';

// Destination Schema
const DestinationSchema = new Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  averageDailyCost: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  weather: {
    season: String,
    averageTemp: Number
  },
  visa: {
    type: String,
    requirements: String
  },
  popularAreas: [String]
});

// Activity Schema
const ActivitySchema = new Schema({
  title: { type: String, required: true },
  time: { 
    type: String, 
    enum: ['morning', 'afternoon', 'evening'], 
    required: true 
  },
  cost: { type: Number, default: 0 },
  description: String,
  addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  addedAt: { type: Date, default: Date.now }
});

// Day Itinerary Schema
const DayItinerarySchema = new Schema({
  date: { type: Date, required: true },
  activities: [ActivitySchema],
  notes: String,
  totalCost: { type: Number, default: 0 }
});

// Budget Schema
const BudgetSchema = new Schema({
  accommodation: {
    amount: { type: Number, required: true },
    details: String
  },
  food: {
    amount: { type: Number, required: true },
    perDay: Number
  },
  transport: {
    amount: { type: Number, required: true },
    details: String
  },
  activities: {
    amount: { type: Number, required: true },
    breakdown: [{
      title: String,
      cost: Number
    }]
  },
  total: { type: Number, required: true },
  currency: { type: String, default: 'USD' }
});

// Collaborator Schema
const CollaboratorSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'declined'], 
    default: 'pending' 
  },
  role: { 
    type: String, 
    enum: ['owner', 'editor', 'viewer'], 
    required: true 
  },
  joinedAt: { type: Date }
});

// Attachment Schema
const AttachmentSchema = new Schema({
  type: { 
    type: String, 
    enum: ['note', 'link', 'file'], 
    required: true 
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  addedAt: { type: Date, default: Date.now }
});

// Main Trip Schema
const TripSchema = new Schema({
  destination: { type: DestinationSchema, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed'],
    default: 'planning'
  },
  travelStyle: { 
    type: String, 
    enum: ['Backpacker', 'Digital Nomad', 'Comfortable', 'Premium'], 
    required: true 
  },
  summary: {
    overview: { type: String, default: '' },
    highlights: { type: [String], default: [] }
  },
  budget: { type: BudgetSchema, required: true },
  itinerary: [DayItinerarySchema],
  collaborators: [CollaboratorSchema],
  attachments: [AttachmentSchema],
  visibility: { 
    type: String, 
    enum: ['private', 'shared', 'public'], 
    default: 'private' 
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true // This will automatically manage createdAt and updatedAt
});

// Indexes for better query performance
TripSchema.index({ createdBy: 1, startDate: -1 });
TripSchema.index({ 'collaborators.userId': 1 });
TripSchema.index({ visibility: 1 });

// Interface for Trip Document
export interface ITripDocument extends Document {
  destination: {
    name: string;
    country: string;
    averageDailyCost: {
      min: number;
      max: number;
    };
    weather?: {
      season: string;
      averageTemp: number;
    };
    visa?: {
      type: string;
      requirements: string;
    };
    popularAreas: string[];
  };
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'completed';
  travelStyle: 'Backpacker' | 'Digital Nomad' | 'Comfortable' | 'Premium';
  summary?: {
    overview: string;
    highlights: string[];
  };
  budget: {
    accommodation: {
      amount: number;
      details?: string;
    };
    food: {
      amount: number;
      perDay?: number;
    };
    transport: {
      amount: number;
      details?: string;
    };
    activities: {
      amount: number;
      breakdown: Array<{ title: string; cost: number }>;
    };
    total: number;
    currency: string;
  };
  itinerary: Array<{
    date: Date;
    activities: Array<{
      title: string;
      time: 'morning' | 'afternoon' | 'evening';
      cost: number;
      description?: string;
      addedBy: mongoose.Types.ObjectId;
      addedAt: Date;
    }>;
    notes?: string;
    totalCost: number;
  }>;
  collaborators: Array<{
    userId: mongoose.Types.ObjectId;
    name: string;
    email: string;
    status: 'pending' | 'accepted' | 'declined';
    role: 'owner' | 'editor' | 'viewer';
    joinedAt?: Date;
  }>;
  attachments: Array<{
    type: 'note' | 'link' | 'file';
    title: string;
    content: string;
    addedBy: mongoose.Types.ObjectId;
    addedAt: Date;
  }>;
  visibility: 'private' | 'shared' | 'public';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Static methods
interface TripModel extends mongoose.Model<ITripDocument> {
  findByUser(userId: string): Promise<ITripDocument[]>;
}

TripSchema.statics.findByUser = function(userId: string): Promise<ITripDocument[]> {
  return this.find({
    $or: [
      { createdBy: userId },
      { 'collaborators.userId': userId }
    ]
  }).sort({ startDate: -1 });
};

// Instance methods
interface ITripMethods {
  isCollaborator(userId: string): boolean;
  calculateTotalCost(): number;
}

TripSchema.methods.isCollaborator = function(this: ITripDocument, userId: string): boolean {
  return this.collaborators.some((c: { userId: mongoose.Types.ObjectId }) => 
    c.userId.toString() === userId.toString()
  );
};

TripSchema.methods.calculateTotalCost = function(this: ITripDocument): number {
  const budget = this.budget;
  return budget.accommodation.amount + 
         budget.food.amount + 
         budget.transport.amount + 
         budget.activities.amount;
};

// Middleware
TripSchema.pre('save', function(this: ITripDocument, next: (err?: any) => void) {
  if (this.isModified('itinerary')) {
    // Recalculate total costs when itinerary changes
    this.itinerary.forEach((day: { activities: Array<{ cost: number }>; totalCost: number }) => {
      day.totalCost = day.activities.reduce((sum: number, activity: { cost: number }) => 
        sum + activity.cost, 0
      );
    });
  }
  next();
});

// Create and export the model
export type ITripModel = mongoose.Model<ITripDocument, {}, ITripMethods> & TripModel;
export const Trip = (mongoose.models.Trip as ITripModel) || 
  mongoose.model<ITripDocument, ITripModel>('Trip', TripSchema);
export default Trip;