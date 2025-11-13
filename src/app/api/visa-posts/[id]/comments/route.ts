import VisaPost from '@/lib/db/models/VisaPost';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

async function ensureConnection() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

// Get comments for a post
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureConnection();

    const { id } = await params;

    const post = await VisaPost.findById(id).select('comments');
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ comments: post.comments });
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching comments:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// Add a comment to a post
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureConnection();

    const { id } = await params;
    const userId = req.headers.get('x-user-id') || 'user-default-123';
    const body = await req.json();

    // Validate
    if (!body.content || body.content.trim().length < 1) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (body.content.length > 500) {
      return NextResponse.json(
        { error: 'Comment must be less than 500 characters' },
        { status: 400 }
      );
    }

    // Find the post
    const post = await VisaPost.findById(id);
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Add comment
    const newComment = {
      userId,
      userName: body.userName || 'Anonymous',
      content: body.content.trim(),
      helpful: 0,
      helpfulBy: [],
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    return NextResponse.json({
      comment: newComment,
      total: post.comments.length,
    }, { status: 201 });
  } catch (error) {
    const err = error as Error;
    console.error('Error adding comment:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to add comment' },
      { status: 500 }
    );
  }
}
