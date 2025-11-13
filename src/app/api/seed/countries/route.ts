import CountryRequirement from '@/lib/db/models/CountryRequirement';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

async function ensureConnection() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

const sampleCountries = [
  {
    country: 'Thailand',
    countryCode: 'TH',
    flag: '🇹🇭',
    visaRequired: false,
    maxStay: 30,
    visaType: 'Visa Exemption',
    cost: 0,
    currency: 'USD',
    processingTime: 0,
    processingType: 'visa-free',
    extendable: true,
    extensionCost: 60,
    extensionDays: 30,
    requiredDocuments: ['Valid passport', 'Proof of accommodation', 'Return ticket'],
    entryRequirements: [
      {
        name: 'Valid passport',
        description: 'Passport valid for at least 6 months',
      },
      {
        name: 'Proof of accommodation',
        description: 'Hotel booking or invitation letter',
      },
      {
        name: 'Return ticket',
        description: 'Proof of onward travel',
      },
    ],
    applicationProcess: [
      {
        step: 1,
        title: 'Arrive at airport',
        description: 'Get 30-day stamp on arrival',
        daysRequired: 0,
      },
      {
        step: 2,
        title: 'Extension (optional)',
        description: 'Visit immigration office 7 days before expiry',
        daysRequired: 1,
      },
    ],
    communityTips: [
      {
        tip: 'Bring 2 passport photos for visa extension. Cost is 1,900 THB.',
        author: 'John Doe',
        helpful: 12,
      },
    ],
    warnings: ['Overstaying results in 500 THB fine per day'],
    complexityScore: 1,
  },
  {
    country: 'Portugal',
    countryCode: 'PT',
    flag: '🇵🇹',
    visaRequired: false,
    maxStay: 90,
    visaType: 'Schengen',
    cost: 0,
    currency: 'EUR',
    processingTime: 0,
    processingType: 'visa-free',
    extendable: false,
    requiredDocuments: [
      'Valid passport',
      'Proof of accommodation',
      'Proof of sufficient funds',
      'Return ticket',
    ],
    entryRequirements: [
      {
        name: 'Valid passport',
        description: 'Passport valid for at least 3 months beyond stay',
      },
      {
        name: 'Proof of accommodation',
        description: 'Hotel bookings or rental agreement',
      },
      {
        name: 'Proof of sufficient funds',
        description: 'Bank statements showing adequate funds',
      },
    ],
    applicationProcess: [
      {
        step: 1,
        title: 'Enter Schengen area',
        description: 'Get entry stamp at any Schengen border',
        daysRequired: 0,
      },
    ],
    communityTips: [
      {
        tip: 'Immigration at Lisbon airport may ask for proof of accommodation. Have bookings ready!',
        author: 'Sarah Miller',
        helpful: 28,
      },
    ],
    warnings: [
      '90 days in any 180-day period across all Schengen countries',
      'Overstaying can result in ban from Schengen area',
    ],
    complexityScore: 2,
  },
  {
    country: 'Indonesia (Bali)',
    countryCode: 'ID',
    flag: '🇮🇩',
    visaRequired: true,
    maxStay: 30,
    visaType: 'Visa on Arrival',
    cost: 35,
    currency: 'USD',
    processingTime: 0,
    processingType: 'on-arrival',
    extendable: true,
    extensionCost: 50,
    extensionDays: 30,
    requiredDocuments: [
      'Valid passport',
      'Return ticket',
      'Proof of accommodation',
    ],
    entryRequirements: [
      {
        name: 'Valid passport',
        description: 'Passport valid for at least 6 months',
      },
      {
        name: 'Visa fee',
        description: '$35 USD cash or card at arrival',
      },
    ],
    applicationProcess: [
      {
        step: 1,
        title: 'Pay at airport',
        description: 'Pay $35 USD at visa counter on arrival',
        daysRequired: 0,
      },
      {
        step: 2,
        title: 'Extension',
        description: 'Visit immigration office in Bali for extension',
        daysRequired: 3,
      },
    ],
    officialWebsite: 'https://molina.imigrasi.go.id',
    communityTips: [
      {
        tip: 'Bring cash! Some airports only accept cash for visa on arrival.',
        author: 'Mike Chen',
        helpful: 45,
      },
    ],
    warnings: ['Overstaying results in heavy fines and possible deportation'],
    complexityScore: 2,
  },
  {
    country: 'Vietnam',
    countryCode: 'VN',
    flag: '🇻🇳',
    visaRequired: true,
    maxStay: 90,
    visaType: 'E-Visa',
    cost: 25,
    currency: 'USD',
    processingTime: 3,
    processingType: 'e-visa',
    extendable: true,
    extensionCost: 100,
    extensionDays: 30,
    requiredDocuments: [
      'Valid passport',
      'Passport photo',
      'Travel itinerary',
      'Proof of accommodation',
    ],
    entryRequirements: [
      {
        name: 'E-visa',
        description: 'Apply online at least 3 days before arrival',
      },
      {
        name: 'Printed e-visa',
        description: 'Print and show at immigration',
      },
    ],
    applicationProcess: [
      {
        step: 1,
        title: 'Apply online',
        description: 'Complete e-visa application form',
        daysRequired: 1,
      },
      {
        step: 2,
        title: 'Wait for approval',
        description: 'Receive e-visa via email',
        daysRequired: 3,
      },
      {
        step: 3,
        title: 'Print visa',
        description: 'Print and bring to airport',
        daysRequired: 0,
      },
    ],
    officialWebsite: 'https://evisa.xuatnhapcanh.gov.vn',
    communityTips: [
      {
        tip: 'E-visa is usually approved in 1-2 days, but apply 3 days early to be safe.',
        author: 'Emma Wilson',
        helpful: 34,
      },
    ],
    complexityScore: 3,
  },
  {
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸',
    visaRequired: true,
    maxStay: 90,
    visaType: 'B1/B2 Visa',
    cost: 160,
    currency: 'USD',
    processingTime: 14,
    processingType: 'embassy',
    extendable: true,
    extensionCost: 370,
    extensionDays: 180,
    requiredDocuments: [
      'Valid passport',
      'DS-160 form',
      'Visa photo',
      'Proof of ties to home country',
      'Bank statements',
      'Interview appointment',
    ],
    entryRequirements: [
      {
        name: 'Valid visa',
        description: 'B1/B2 tourist/business visa',
      },
      {
        name: 'Proof of return',
        description: 'Return ticket and proof of accommodation',
      },
    ],
    applicationProcess: [
      {
        step: 1,
        title: 'Complete DS-160',
        description: 'Fill out online visa application form',
        daysRequired: 1,
      },
      {
        step: 2,
        title: 'Pay visa fee',
        description: 'Pay $160 non-refundable visa fee',
        daysRequired: 1,
      },
      {
        step: 3,
        title: 'Schedule interview',
        description: 'Book appointment at US embassy',
        daysRequired: 7,
      },
      {
        step: 4,
        title: 'Attend interview',
        description: 'Interview with consular officer',
        daysRequired: 1,
      },
      {
        step: 5,
        title: 'Wait for passport',
        description: 'Passport with visa sent by courier',
        daysRequired: 5,
      },
    ],
    officialWebsite: 'https://travel.state.gov',
    warnings: [
      'Interview wait times vary by country (check embassy website)',
      'Visa approval is not guaranteed',
    ],
    complexityScore: 5,
  },
];

export async function POST() {
  try {
    await ensureConnection();

    // Delete existing data
    await CountryRequirement.deleteMany({});

    // Insert sample data
    const inserted = await CountryRequirement.insertMany(sampleCountries);

    return NextResponse.json({
      message: 'Seed data created successfully',
      count: inserted.length,
      countries: inserted.map((c) => c.country),
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error seeding data:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to seed data' },
      { status: 500 }
    );
  }
}
