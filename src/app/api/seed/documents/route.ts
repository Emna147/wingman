import VisaDocument from '@/lib/db/models/VisaDocument';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

async function ensureConnection() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

const sampleDocuments = [
  {
    userId: 'user-default-123',
    type: 'passport',
    country: 'United States',
    countryCode: 'US',
    documentNumber: 'N1234567',
    issueDate: new Date('2020-03-15'),
    expiryDate: new Date('2030-03-15'),
    status: 'valid',
  },
  {
    userId: 'user-default-123',
    type: 'visa',
    country: 'Thailand',
    countryCode: 'TH',
    documentNumber: 'TH987654',
    issueDate: new Date('2025-11-01'),
    expiryDate: new Date('2025-11-30'),
    status: 'expiring',
    visaType: 'Tourist (TR)',
    maxStayDays: 60,
    cost: 1900,
    currency: 'THB',
    notes: 'Extended once at Chiang Mai immigration office. Bring 2 passport photos.',
  },
  {
    userId: 'user-default-123',
    type: 'visa',
    country: 'Vietnam',
    countryCode: 'VN',
    documentNumber: 'VN123456',
    issueDate: new Date('2025-10-15'),
    expiryDate: new Date('2026-01-15'),
    status: 'valid',
    visaType: 'E-Visa',
    maxStayDays: 90,
    cost: 25,
    currency: 'USD',
    notes: 'Applied online, approved in 2 days. Remember to print!',
  },
  {
    userId: 'user-default-123',
    type: 'insurance',
    country: 'Global',
    countryCode: 'WW',
    issueDate: new Date('2025-01-01'),
    expiryDate: new Date('2026-01-01'),
    status: 'valid',
    cost: 480,
    currency: 'USD',
    notes: 'SafetyWing Nomad Insurance - covers COVID-19',
    metadata: {
      insuranceProvider: 'SafetyWing',
    },
  },
  {
    userId: 'user-default-123',
    type: 'vaccination',
    country: 'Global',
    countryCode: 'WW',
    issueDate: new Date('2024-06-01'),
    expiryDate: new Date('2034-06-01'),
    status: 'valid',
    notes: 'Yellow Fever vaccination certificate for travel to South America',
    metadata: {
      vaccineType: 'Yellow Fever',
    },
  },
  {
    userId: 'user-default-123',
    type: 'ticket',
    country: 'Thailand',
    countryCode: 'TH',
    expiryDate: new Date('2025-12-20'),
    status: 'valid',
    cost: 45,
    currency: 'USD',
    notes: 'Bangkok to Chiang Mai flight',
    metadata: {
      ticketType: 'Flight',
      flightNumber: 'DD123',
      departureCity: 'Bangkok',
      arrivalCity: 'Chiang Mai',
    },
  },
];

export async function POST() {
  try {
    await ensureConnection();

    // Delete existing test data
    await VisaDocument.deleteMany({ userId: 'user-default-123' });

    // Insert sample data
    const inserted = await VisaDocument.insertMany(sampleDocuments);

    return NextResponse.json({
      message: 'Sample documents created successfully',
      count: inserted.length,
      documents: inserted.map((d) => ({
        type: d.type,
        country: d.country,
        status: d.status,
        daysRemaining: d.daysRemaining,
      })),
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error seeding documents:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to seed documents' },
      { status: 500 }
    );
  }
}
