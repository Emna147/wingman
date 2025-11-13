import mongoose, { Document, Schema } from 'mongoose';

export interface IItineraryStop {
  city: string;
  country: string;
  arrivalDate: Date;
  departureDate: Date;
  accommodation?: string;
  notes?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface ITransportLeg {
  from: string;
  to: string;
  mode: 'flight' | 'train' | 'bus' | 'car' | 'boat' | 'other';
  date: Date;
  cost?: number;
  duration?: number; // in minutes
  confirmationNumber?: string;
  notes?: string;
}

export interface IItinerary extends Document {
  userId: string;
  tripId?: string;
  name: string;
  stops: IItineraryStop[];
  transport: ITransportLeg[];
  totalEstimatedCost: number;
  status: 'draft' | 'confirmed' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const itineraryStopSchema = new Schema<IItineraryStop>(
  {
    city: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    arrivalDate: {
      type: Date,
      required: true,
    },
    departureDate: {
      type: Date,
      required: true,
    },
    accommodation: String,
    notes: String,
    location: {
      lat: Number,
      lng: Number,
    },
  },
  { _id: false }
);

const transportLegSchema = new Schema<ITransportLeg>(
  {
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      enum: ['flight', 'train', 'bus', 'car', 'boat', 'other'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    cost: Number,
    duration: Number,
    confirmationNumber: String,
    notes: String,
  },
  { _id: false }
);

const itinerarySchema = new Schema<IItinerary>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    tripId: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    stops: {
      type: [itineraryStopSchema],
      default: [],
    },
    transport: {
      type: [transportLegSchema],
      default: [],
    },
    totalEstimatedCost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'confirmed', 'completed'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

// Indexes
itinerarySchema.index({ userId: 1, status: 1 });
itinerarySchema.index({ tripId: 1 });

const Itinerary =
  mongoose.models.Itinerary ||
  mongoose.model<IItinerary>('Itinerary', itinerarySchema);

export default Itinerary;
