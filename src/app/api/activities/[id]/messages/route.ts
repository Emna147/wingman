// src/app/api/activities/[id]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/db';
import { ObjectId } from 'mongodb';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: req.headers });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getDb();
    const { id: activityId } = await params;
    const userId = session.user.id;

    // Validate ObjectId
    let _id: ObjectId;
    try {
      _id = new ObjectId(activityId);
    } catch {
      return NextResponse.json(
        { error: 'Invalid activity id' },
        { status: 400 }
      );
    }

    // Verify activity exists and user is a participant or host
    const activity = await db.collection('activities').findOne({ _id });
    
    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    const isParticipant = activity.participants?.includes(userId) || activity.hostId === userId;
    
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant of this activity' },
        { status: 403 }
      );
    }

    // Get limit from query params (default 100)
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Fetch messages for the activity
    const messages = await db.collection('activitymessages').find({ 
      activityId: _id 
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .toArray();

    // Convert ObjectIds to strings for JSON serialization
    const formattedMessages = messages.map(msg => ({
      ...msg,
      _id: msg._id.toString(),
      activityId: msg.activityId.toString(),
    }));
    
    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      activity: {
        _id: activity._id.toString(),
        name: activity.name,
        participants: activity.participants || [],
        hostId: activity.hostId,
      },
    });
    
  } catch (error) {
    console.error('Error fetching activity messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}