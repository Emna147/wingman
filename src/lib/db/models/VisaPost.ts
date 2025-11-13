import { Schema, model, models } from 'mongoose';

export interface IVisaPost {
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  content: string;
  category:
    | 'visa-free'
    | 'visa-required'
    | 'e-visa'
    | 'visa-on-arrival'
    | 'rejection'
    | 'tips';
  country: string;
  countryCode?: string;
  tags?: string[];
  images?: string[];
  helpful: number;
  helpfulBy: string[]; // userIds who marked as helpful
  comments: {
    userId: string;
    userName: string;
    content: string;
    helpful: number;
    helpfulBy: string[];
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const visaPostSchema = new Schema<IVisaPost>(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    title: { type: String, required: true, minlength: 10, maxlength: 100 },
    content: { type: String, required: true, minlength: 50, maxlength: 2000 },
    category: {
      type: String,
      enum: [
        'visa-free',
        'visa-required',
        'e-visa',
        'visa-on-arrival',
        'rejection',
        'tips',
      ],
      required: true,
    },
    country: { type: String, required: true },
    countryCode: { type: String },
    tags: [{ type: String }],
    images: [{ type: String }],
    helpful: { type: Number, default: 0 },
    helpfulBy: [{ type: String }],
    comments: [
      {
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        content: { type: String, required: true },
        helpful: { type: Number, default: 0 },
        helpfulBy: [{ type: String }],
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Indexes for filtering and search
visaPostSchema.index({ category: 1 });
visaPostSchema.index({ country: 1 });
visaPostSchema.index({ createdAt: -1 });
visaPostSchema.index({ helpful: -1 });
visaPostSchema.index({ tags: 1 });

const VisaPost = models.VisaPost || model<IVisaPost>('VisaPost', visaPostSchema);

export default VisaPost;
