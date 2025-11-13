import CountryRequirement from '@/lib/db/models/CountryRequirement';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

async function ensureConnection() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureConnection();

    const body = await req.json();
    const { countryCodes } = body;

    if (!Array.isArray(countryCodes) || countryCodes.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 countries required for comparison' },
        { status: 400 }
      );
    }

    const requirements = await CountryRequirement.find({
      countryCode: { $in: countryCodes.map((code: string) => code.toUpperCase()) },
    }).lean();

    if (requirements.length < 2) {
      return NextResponse.json(
        { error: 'Not enough countries found' },
        { status: 404 }
      );
    }

    // Calculate winners
    const cheapest = requirements.reduce((prev, curr) =>
      prev.cost < curr.cost ? prev : curr
    );

    const longestStay = requirements.reduce((prev, curr) =>
      prev.maxStay > curr.maxStay ? prev : curr
    );

    const easiest = requirements.reduce((prev, curr) =>
      prev.complexityScore < curr.complexityScore ? prev : curr
    );

    const fastest = requirements.reduce((prev, curr) =>
      prev.processingTime < curr.processingTime ? prev : curr
    );

    return NextResponse.json({
      countries: requirements,
      winners: {
        cheapest: cheapest.countryCode,
        longestStay: longestStay.countryCode,
        easiest: easiest.countryCode,
        fastest: fastest.countryCode,
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error comparing countries:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to compare countries' },
      { status: 500 }
    );
  }
}
