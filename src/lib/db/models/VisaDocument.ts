import { Schema, model, models } from 'mongoose';

export interface IVisaDocument {
  userId: string;
  type: 'passport' | 'visa' | 'insurance' | 'vaccination' | 'ticket' | 'other';
  country: string;
  countryCode: string;
  documentNumber?: string;
  issueDate?: Date;
  expiryDate: Date;
  status: 'valid' | 'expiring' | 'expired';
  daysRemaining?: number;
  visaType?: string; // Tourist, Business, Working Holiday, etc.
  maxStayDays?: number;
  cost?: number;
  currency?: string;
  attachments?: string[]; // URLs to uploaded files
  notes?: string;
  reminders?: {
    days: number;
    sent: boolean;
  }[];
  metadata?: {
    insuranceProvider?: string;
    vaccineType?: string;
    ticketType?: string;
    flightNumber?: string;
    departureCity?: string;
    arrivalCity?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const visaDocumentSchema = new Schema<IVisaDocument>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['passport', 'visa', 'insurance', 'vaccination', 'ticket', 'other'],
      required: true,
    },
    country: { type: String, required: true },
    countryCode: { type: String, required: true },
    documentNumber: { type: String },
    issueDate: { type: Date },
    expiryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['valid', 'expiring', 'expired'],
      default: 'valid',
    },
    daysRemaining: { type: Number },
    visaType: { type: String },
    maxStayDays: { type: Number },
    cost: { type: Number },
    currency: { type: String, default: 'USD' },
    attachments: [{ type: String }],
    notes: { type: String },
    reminders: [
      {
        days: { type: Number },
        sent: { type: Boolean, default: false },
      },
    ],
    metadata: {
      insuranceProvider: { type: String },
      vaccineType: { type: String },
      ticketType: { type: String },
      flightNumber: { type: String },
      departureCity: { type: String },
      arrivalCity: { type: String },
    },
  },
  { timestamps: true }
);

// Index for efficient queries
visaDocumentSchema.index({ userId: 1, expiryDate: 1 });
visaDocumentSchema.index({ userId: 1, status: 1 });
visaDocumentSchema.index({ userId: 1, type: 1 });

// Calculate days remaining before save
visaDocumentSchema.pre('save', function (next) {
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  this.daysRemaining = diffDays;

  // Auto-update status
  if (diffDays < 0) {
    this.status = 'expired';
  } else if (diffDays <= 30) {
    this.status = 'expiring';
  } else {
    this.status = 'valid';
  }

  next();
});

const VisaDocument =
  models.VisaDocument || model<IVisaDocument>('VisaDocument', visaDocumentSchema);

export default VisaDocument;
