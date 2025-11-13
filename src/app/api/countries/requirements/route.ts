import CountryRequirement from '@/lib/db/models/CountryRequirement';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

async function ensureConnection() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureConnection();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const visaFree = searchParams.get('visaFree');
    const maxCost = searchParams.get('maxCost');
    const processingType = searchParams.get('processingType');
    const extendable = searchParams.get('extendable');
    const sort = searchParams.get('sort') || 'name';

    const query: Record<string, unknown> = {};

    // Search
    if (search) {
      query.$or = [
        { country: { $regex: search, $options: 'i' } },
        { visaType: { $regex: search, $options: 'i' } },
      ];
    }

    // Filters
    if (visaFree === 'true') {
      query.visaRequired = false;
    }

    if (maxCost) {
      query.cost = { $lte: parseFloat(maxCost) };
    }

    if (processingType) {
      query.processingType = processingType;
    }

    if (extendable === 'true') {
      query.extendable = true;
    }

    // Build sort object
    let sortObj: Record<string, 1 | -1> = {};
    switch (sort) {
      case 'name':
        sortObj = { country: 1 };
        break;
      case 'cost':
        sortObj = { cost: 1 };
        break;
      case 'processing':
        sortObj = { processingTime: 1 };
        break;
      case 'visa-free':
        sortObj = { visaRequired: 1, cost: 1 };
        break;
      default:
        sortObj = { country: 1 };
    }

    const requirements = await CountryRequirement.find(query)
      .sort(sortObj)
      .lean();

    return NextResponse.json({
      total: requirements.length,
      requirements,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching country requirements:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch country requirements' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureConnection();

    const body = await req.json();

    const requirement = await CountryRequirement.create(body);

    return NextResponse.json(requirement, { status: 201 });
  } catch (error) {
    const err = error as Error;
    console.error('Error creating country requirement:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create country requirement' },
      { status: 500 }
    );
  }
}
