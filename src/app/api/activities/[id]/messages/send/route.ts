// src/app/api/activities/[id]/messages/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/db';
import { ObjectId } from 'mongodb';

export async function POST(
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
    const body = await req.json();
    const { content, type = 'text' } = body;

    // Validate input
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

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

    // Create the message
    const message = {
      activityId: _id,
      senderId: userId,
      senderName: session.user.name || 'Unknown User',
      content: content.trim(),
      type,
      readBy: [userId],
      createdAt: new Date(),
    };

    const result = await db.collection('activitymessages').insertOne(message);

    // Emit socket event to notify other participants
    const io = (global as any).io;
    if (io) {
      io.to(`activity-${activityId}`).emit('new-message', {
        _id: result.insertedId.toString(),
        activityId: activityId,
        senderId: message.senderId,
        senderName: message.senderName,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt,
        readBy: message.readBy,
      });
    }

    return NextResponse.json({
      success: true,
      message: {
        ...message,
        _id: result.insertedId.toString(),
        activityId: activityId,
      },
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}