import Itinerary from '@/lib/db/models/Itinerary';
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

    const userId = req.headers.get('x-user-id') || 'user-default-123';
    const tripId = req.nextUrl.searchParams.get('tripId');
    const status = req.nextUrl.searchParams.get('status');

    const query: Record<string, string> = { userId };

    if (tripId) {
      query.tripId = tripId;
    }

    if (status) {
      query.status = status;
    }

    const itineraries = await Itinerary.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ itineraries });
  } catch (error) {
    console.error('Error fetching itineraries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itineraries' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureConnection();

    const userId = req.headers.get('x-user-id') || 'user-default-123';
    const body = await req.json();

    const { name, tripId, stops, transport, totalEstimatedCost, status } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Itinerary name is required' },
        { status: 400 }
      );
    }

    const itinerary = await Itinerary.create({
      userId,
      name,
      tripId: tripId || undefined,
      stops: stops || [],
      transport: transport || [],
      totalEstimatedCost: totalEstimatedCost || 0,
      status: status || 'draft',
    });

    return NextResponse.json(itinerary, { status: 201 });
  } catch (error) {
    const err = error as Error;
    console.error('Error creating itinerary:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create itinerary' },
      { status: 500 }
    );
  }
}
