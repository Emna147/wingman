import VisaDocument from '@/lib/db/models/VisaDocument';
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

    const document = await VisaDocument.findById(id).lean();

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(document);
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching document:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch document' },
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

    const document = await VisaDocument.findById(id);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update allowed fields
    const allowedFields = [
      'type',
      'country',
      'countryCode',
      'documentNumber',
      'issueDate',
      'expiryDate',
      'visaType',
      'maxStayDays',
      'cost',
      'currency',
      'attachments',
      'notes',
      'reminders',
      'metadata',
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        (document as Record<string, unknown>)[field] = body[field];
      }
    });

    await document.save(); // This will trigger pre-save hook to recalculate days

    return NextResponse.json(document);
  } catch (error) {
    const err = error as Error;
    console.error('Error updating document:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update document' },
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

    const document = await VisaDocument.findById(id);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await VisaDocument.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    const err = error as Error;
    console.error('Error deleting document:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
}
