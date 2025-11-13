import VisaDocument from '@/lib/db/models/VisaDocument';
import VisaPost from '@/lib/db/models/VisaPost';
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

    // Count user's documents
    const documentsCount = await VisaDocument.countDocuments({ userId });

    // Count user's posts
    const postsCount = await VisaPost.countDocuments({ userId });

    // Count how many times user marked posts as helpful
    const helpfulGiven = await VisaPost.countDocuments({
      helpfulBy: userId
    });

    return NextResponse.json({
      stats: {
        documents: documentsCount,
        posts: postsCount,
        helpfulGiven,
      }
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching user stats:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
