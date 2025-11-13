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
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const country = searchParams.get('country');

    const query: Record<string, unknown> = { userId };

    if (type) query.type = type;
    if (status) query.status = status;
    if (country) query.country = country;

    console.log('📄 GET /api/documents - Fetching for userId:', userId);
    console.log('📄 Query:', query);

    const documents = await VisaDocument.find(query)
      .sort({ expiryDate: 1 }) // Soonest expiry first
      .lean();

    console.log('📄 Found documents:', documents.length);

    // Calculate documents needing attention (< 90 days)
    const needingAttention = documents.filter(
      (doc) => (doc.daysRemaining || 0) < 90 && (doc.daysRemaining || 0) >= 0
    ).length;

    return NextResponse.json({
      documents,
      stats: {
        total: documents.length,
        needingAttention,
        expired: documents.filter((doc) => doc.status === 'expired').length,
        expiring: documents.filter((doc) => doc.status === 'expiring').length,
        valid: documents.filter((doc) => doc.status === 'valid').length,
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching documents:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureConnection();

    const userId = req.headers.get('x-user-id') || 'user-default-123';
    const body = await req.json();

    console.log('➕ POST /api/documents - Creating for userId:', userId);
    console.log('➕ Document data:', { ...body, userId });

    const document = await VisaDocument.create({
      ...body,
      userId,
    });

    console.log('✅ Document created:', document._id);

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    const err = error as Error;
    console.error('Error creating document:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create document' },
      { status: 500 }
    );
  }
}
