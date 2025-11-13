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

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const country = searchParams.get('country');
    const sort = searchParams.get('sort') || 'recent';

    const query: Record<string, unknown> = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (country) {
      query.country = country;
    }

    // Build sort object
    let sortObj: Record<string, 1 | -1> = {};
    switch (sort) {
      case 'recent':
        sortObj = { createdAt: -1 };
        break;
      case 'helpful':
        sortObj = { helpful: -1 };
        break;
      case 'comments':
        sortObj = { 'comments.length': -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    const posts = await VisaPost.find(query).sort(sortObj).lean();

    return NextResponse.json({
      total: posts.length,
      posts,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching visa posts:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch visa posts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureConnection();

    const userId = req.headers.get('x-user-id') || 'user-default-123';
    const body = await req.json();

    // Validate title
    if (!body.title || body.title.length < 10 || body.title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be between 10 and 100 characters' },
        { status: 400 }
      );
    }

    // Validate content
    if (!body.content || body.content.length < 50 || body.content.length > 2000) {
      return NextResponse.json(
        { error: 'Content must be between 50 and 2000 characters' },
        { status: 400 }
      );
    }

    // Validate category
    if (!body.category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    // Validate country
    if (!body.country) {
      return NextResponse.json(
        { error: 'Country is required' },
        { status: 400 }
      );
    }

    const post = await VisaPost.create({
      userId,
      userName: body.userName || 'Anonymous',
      title: body.title,
      content: body.content,
      category: body.category,
      country: body.country,
      countryCode: body.countryCode,
      tags: body.tags || [],
      images: body.images || [],
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    const err = error as Error;
    console.error('Error creating visa post:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create visa post' },
      { status: 500 }
    );
  }
}
