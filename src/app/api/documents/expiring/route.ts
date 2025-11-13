import VisaDocument from '@/lib/db/models/VisaDocument';
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
    const { searchParams } = new URL(req.url);
    const daysThreshold = parseInt(searchParams.get('days') || '90', 10);

    // Find documents expiring within threshold
    const documents = await VisaDocument.find({
      userId,
      daysRemaining: { $gte: 0, $lte: daysThreshold },
    })
      .sort({ daysRemaining: 1 }) // Most urgent first
      .lean();

    // Group by urgency
    const urgent = documents.filter((doc) => (doc.daysRemaining || 0) <= 7);
    const soon = documents.filter(
      (doc) => (doc.daysRemaining || 0) > 7 && (doc.daysRemaining || 0) <= 30
    );
    const upcoming = documents.filter((doc) => (doc.daysRemaining || 0) > 30);

    return NextResponse.json({
      total: documents.length,
      urgent: {
        count: urgent.length,
        documents: urgent,
      },
      soon: {
        count: soon.length,
        documents: soon,
      },
      upcoming: {
        count: upcoming.length,
        documents: upcoming,
      },
      allDocuments: documents,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching expiring documents:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch expiring documents' },
      { status: 500 }
    );
  }
}
