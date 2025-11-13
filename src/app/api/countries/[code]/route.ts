import CountryRequirement from '@/lib/db/models/CountryRequirement';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

async function ensureConnection() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await ensureConnection();
    const { code } = await params;

    const requirement = await CountryRequirement.findOne({
      countryCode: code.toUpperCase(),
    }).lean();

    if (!requirement) {
      return NextResponse.json(
        { error: 'Country not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(requirement);
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching country requirement:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch country requirement' },
      { status: 500 }
    );
  }
}
