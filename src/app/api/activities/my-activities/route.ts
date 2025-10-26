// src/app/api/activities/my-activities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/db';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
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
    const userId = session.user.id;
    
    // Fetch all activities where user is host OR participant
    const activities = await db.collection('activities').find({
      $or: [
        { hostId: userId },
        { participants: userId }
      ]
    })
      .sort({ createdAt: -1 })
      .toArray();

    // For each activity, get the last message and unread count
    const activitiesWithMessages = await Promise.all(
      activities.map(async (activity) => {
        const lastMessage = await db.collection('activitymessages').findOne(
          { activityId: activity._id },
          { sort: { createdAt: -1 } }
        );

        // Count unread messages (messages not in user's readBy array)
        const unreadCount = await db.collection('activitymessages').countDocuments({
          activityId: activity._id,
          senderId: { $ne: userId },
          readBy: { $ne: userId }
        });

        return {
          _id: activity._id.toString(),
          name: activity.name,
          location: activity.location,
          hostId: activity.hostId,
          participants: activity.participants || [],
          lastMessage: lastMessage?.content || null,
          lastMessageAt: lastMessage?.createdAt || activity.createdAt,
          unreadCount,
          createdAt: activity.createdAt,
        };
      })
    );

    // Sort by last message time
    activitiesWithMessages.sort((a, b) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
    
    return NextResponse.json({
      success: true,
      activities: activitiesWithMessages,
    });
    
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}