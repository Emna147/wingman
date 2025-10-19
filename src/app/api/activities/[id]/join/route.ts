import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { auth } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const { id: activityId } = await params;
    const userId = session.user.id;

    let _id: ObjectId;
    try {
      _id = new ObjectId(activityId);
    } catch {
      return NextResponse.json({ error: "Invalid activity id" }, { status: 400 });
    }

    // Check if activity exists
    const activity = await db.collection("activities").findOne({ _id });
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    // Add user to participants if not already joined
    const result = await db.collection("activities").updateOne(
      {
        _id,
        participants: { $ne: userId }, // Only update if user is not already a participant
      },
      {
        $addToSet: { participants: userId }, // Add user to participants array
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Already joined or activity not found" }, { status: 400 });
    }

    return NextResponse.json({ message: "Successfully joined activity" });
  } catch (error) {
    console.error("Error joining activity:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
