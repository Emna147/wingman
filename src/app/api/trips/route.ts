import { getDb } from '@/db';
import Trip from '@/lib/db/models/Trip';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

// Ensure mongoose connection
async function ensureConnection() {
  if (mongoose.connection.readyState === 0) {
    await getDb();
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureConnection();

    const userId = req.headers.get('x-user-id') || 'user-default-123';
    const status = req.nextUrl.searchParams.get('status');

    const query: Record<string, unknown> = {
      $or: [
        { creatorId: userId },
        { collaboratorIds: userId },
      ],
    };

    if (status) {
      query.status = status;
    }

    const trips = await Trip.find(query).sort({ startDate: -1 }).lean();

    return NextResponse.json({ trips });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureConnection();

    const userId = req.headers.get('x-user-id') || 'user-default-123';
    const body = await req.json();

    const {
      destination,
      startDate,
      endDate,
      budgetEstimate,
      collaboratorIds,
      visibility,
      status,
    } = body;

    if (!destination || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Destination, start date, and end date are required' },
        { status: 400 }
      );
    }

    const trip = await Trip.create({
      creatorId: userId,
      destination,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budgetEstimate: budgetEstimate || 0,
      collaboratorIds: collaboratorIds || [],
      itinerary: [],
      visibility: visibility || 'private',
      status: status || 'planning',
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    const err = error as Error;
    console.error('Error creating trip:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create trip' },
      { status: 500 }
    );
  }
}
