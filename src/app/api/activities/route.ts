import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { auth } from "@/lib/auth";

interface Activity {
  _id?: string;
  name: string;
  title?: string;
  description?: string;
  budget?: "Free" | "Low" | "Medium" | "High" | "Luxury";
  types?: string[];
  duration?: "Short (1–2h)" | "Half-day" | "Full-day" | "Multi-day";
  dateTime?: string; // ISO string
  locationType?: "Outdoor" | "Indoor" | "Weather-friendly";
  socialVibe?: "Solo" | "Small group" | "Public" | "Friends-only" | "Couples";
  tags?: string[];
  sharedExpenses?: boolean;
  location: {
    lat: number;
    lng: number;
  };
  hostId: string;
  participants?: string[];
  createdAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine");

    let filter: any = {};
    if (mine === "true") {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const userId = session.user.id;
      filter = { $or: [{ hostId: userId }, { participants: userId }] };
    }

    const activities = await db
      .collection<Activity>("activities")
      .find(filter, { projection: { /* no sensitive fields */ } })
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Optional: require auth — comment the block to allow public
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const body = await request.json();
    const {
      name,
      title,
      description,
      budget,
      types,
      duration,
      dateTime,
      locationType,
      socialVibe,
      tags,
      sharedExpenses,
      location,
    } = body ?? {};

    const activityName = String(name ?? title ?? "").trim();

    if (!activityName || !location || typeof location.lat !== "number" || typeof location.lng !== "number") {
      return NextResponse.json(
        { error: "Invalid payload: require title/name and location { lat, lng }" },
        { status: 400 }
      );
    }

    const activity: Activity = {
      name: activityName,
      title: title ? String(title).trim() : activityName,
      description: description ? String(description).trim() : undefined,
      budget,
      types: Array.isArray(types) ? types.slice(0, 16) : undefined,
      duration,
      dateTime,
      locationType,
      socialVibe,
      tags: Array.isArray(tags) ? tags.slice(0, 32) : undefined,
      sharedExpenses: !!sharedExpenses,
      location: { lat: location.lat, lng: location.lng },
      hostId: session.user.id,
      participants: [],
      createdAt: new Date(),
    };

    const result = await db.collection<Activity>("activities").insertOne(activity);
    return NextResponse.json({ id: result.insertedId, activity }, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


