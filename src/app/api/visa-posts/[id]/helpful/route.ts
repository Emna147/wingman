import VisaPost from '@/lib/db/models/VisaPost';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

async function ensureConnection() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureConnection();

    const { id } = await params;
    const userId = req.headers.get('x-user-id') || 'user-default-123';

    // Find the post
    const post = await VisaPost.findById(id);
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user already marked as helpful
    const alreadyHelpful = post.helpfulBy.includes(userId);

    if (alreadyHelpful) {
      // Remove helpful (unlike)
      post.helpful = Math.max(0, post.helpful - 1);
      post.helpfulBy = post.helpfulBy.filter((id: string) => id !== userId);
    } else {
      // Add helpful (like)
      post.helpful += 1;
      post.helpfulBy.push(userId);
    }

    await post.save();

    return NextResponse.json({
      helpful: post.helpful,
      isHelpfulByMe: !alreadyHelpful,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error toggling helpful:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to toggle helpful' },
      { status: 500 }
    );
  }
}
