import VisaPost from '@/lib/db/models/VisaPost';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

async function ensureConnection() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
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
    const { action } = body; // 'helpful' or 'comment'

    const post = await VisaPost.findById(id);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (action === 'helpful') {
      // Toggle helpful
      const index = post.helpfulBy.indexOf(userId);
      if (index > -1) {
        // Remove helpful
        post.helpfulBy.splice(index, 1);
        post.helpful = Math.max(0, post.helpful - 1);
      } else {
        // Add helpful
        post.helpfulBy.push(userId);
        post.helpful += 1;
      }
    } else if (action === 'comment') {
      // Add comment
      if (!body.content) {
        return NextResponse.json(
          { error: 'Comment content is required' },
          { status: 400 }
        );
      }

      post.comments.push({
        userId,
        userName: body.userName || 'Anonymous',
        content: body.content,
        helpful: 0,
        helpfulBy: [],
        createdAt: new Date(),
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await post.save();

    return NextResponse.json(post);
  } catch (error) {
    const err = error as Error;
    console.error('Error updating visa post:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update visa post' },
      { status: 500 }
    );
  }
}
