import Itinerary from '@/lib/db/models/Itinerary';
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

    const itinerary = await Itinerary.findById(id).lean();

    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(itinerary);
  } catch (error) {
    console.error('Error fetching itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itinerary' },
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

    const itinerary = await Itinerary.findById(id);

    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (itinerary.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update fields
    const allowedFields = [
      'name',
      'tripId',
      'stops',
      'transport',
      'totalEstimatedCost',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        (itinerary as Record<string, unknown>)[field] = body[field];
      }
    });

    await itinerary.save();

    return NextResponse.json(itinerary);
  } catch (error) {
    const err = error as Error;
    console.error('Error updating itinerary:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update itinerary' },
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

    const itinerary = await Itinerary.findById(id);

    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      );
    }

    if (itinerary.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await Itinerary.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Itinerary deleted successfully' });
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to delete itinerary' },
      { status: 500 }
    );
  }
}
