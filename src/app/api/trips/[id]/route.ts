import Trip from '@/lib/db/models/Trip';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

async function ensureConnection() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureConnection();
    const { id } = await params;

    const trip = await Trip.findById(id).lean();

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json(trip);
  } catch (error) {
    console.error('Error fetching trip:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureConnection();
    const { id } = await params;

    const userId = req.headers.get('x-user-id') || 'user-default-123';
    const body = await req.json();

    const trip = await Trip.findById(id);

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Check permissions
    if (
      trip.creatorId !== userId &&
      !trip.collaboratorIds.includes(userId)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update fields
    const allowedFields = [
      'destination',
      'startDate',
      'endDate',
      'budgetEstimate',
      'collaboratorIds',
      'itinerary',
      'visibility',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        (trip as Record<string, unknown>)[field] = body[field];
      }
    });

    await trip.save();

    return NextResponse.json(trip);
  } catch (error) {
    const err = error as Error;
    console.error('Error updating trip:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update trip' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureConnection();
    const { id } = await params;

    const userId = req.headers.get('x-user-id') || 'user-default-123';

    const trip = await Trip.findById(id);

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Only creator can delete
    if (trip.creatorId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await Trip.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    );
  }
}
