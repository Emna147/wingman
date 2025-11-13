import { Schema, model, models } from 'mongoose';

export interface ICountryRequirement {
  country: string;
  countryCode: string; // ISO 2-letter code
  flag: string;
  visaRequired: boolean;
  maxStay: number; // in days
  visaType?: string;
  cost: number;
  currency: string;
  processingTime: number; // in days
  processingType: 'visa-free' | 'on-arrival' | 'e-visa' | 'embassy';
  extendable: boolean;
  extensionCost?: number;
  extensionDays?: number;
  requiredDocuments: string[];
  entryRequirements: {
    name: string;
    description: string;
  }[];
  applicationProcess: {
    step: number;
    title: string;
    description: string;
    daysRequired?: number;
  }[];
  officialWebsite?: string;
  communityTips?: {
    tip: string;
    author: string;
    helpful: number;
  }[];
  warnings?: string[];
  complexityScore: number; // 1-5
  createdAt: Date;
  updatedAt: Date;
}

const countryRequirementSchema = new Schema<ICountryRequirement>(
  {
    country: { type: String, required: true, unique: true },
    countryCode: { type: String, required: true, unique: true },
    flag: { type: String, required: true },
    visaRequired: { type: Boolean, default: true },
    maxStay: { type: Number, required: true },
    visaType: { type: String },
    cost: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    processingTime: { type: Number, default: 0 },
    processingType: {
      type: String,
      enum: ['visa-free', 'on-arrival', 'e-visa', 'embassy'],
      required: true,
    },
    extendable: { type: Boolean, default: false },
    extensionCost: { type: Number },
    extensionDays: { type: Number },
    requiredDocuments: [{ type: String }],
    entryRequirements: [
      {
        name: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
    applicationProcess: [
      {
        step: { type: Number, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        daysRequired: { type: Number },
      },
    ],
    officialWebsite: { type: String },
    communityTips: [
      {
        tip: { type: String },
        author: { type: String },
        helpful: { type: Number, default: 0 },
      },
    ],
    warnings: [{ type: String }],
    complexityScore: { type: Number, min: 1, max: 5, default: 3 },
  },
  { timestamps: true }
);

// Indexes for search and filter
countryRequirementSchema.index({ country: 'text', visaType: 'text' });
countryRequirementSchema.index({ cost: 1 });
countryRequirementSchema.index({ processingType: 1 });
countryRequirementSchema.index({ extendable: 1 });

const CountryRequirement =
  models.CountryRequirement ||
  model<ICountryRequirement>('CountryRequirement', countryRequirementSchema);

export default CountryRequirement;
