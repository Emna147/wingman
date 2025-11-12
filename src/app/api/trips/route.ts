import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { getDestinationInsights } from "@/lib/destination";

const handler = toNextJsHandler(auth);

interface Location {
  name: string;
  country: string;
  averageDailyCost?: {
    min: number;
    max: number;
  };
  weather?: Weather;
  visa?: Visa;
  popularAreas?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface Weather {
  season: string;
  averageTemp: number;
}

interface Visa {
  type: string;
  requirements: string;
}

interface Location {
  name: string;
  country: string;
  averageDailyCost?: {
    min: number;
    max: number;
  };
  weather?: Weather;
  visa?: Visa;
  popularAreas?: string[];
  lat?: number;
  lng?: number;
}

interface BudgetItem {
  amount: number;
  details?: string;
  perDay?: number;
  breakdown?: string[];
}

interface Budget {
  accommodation: BudgetItem;
  food: BudgetItem;
  transport: BudgetItem;
  activities: BudgetItem;
  total: number;
  currency: string;
}

interface ItineraryItem {
  day: number;
  time: string;
  activity: string;
  location?: Location;
  duration: number;
  notes?: string;
  cost?: number;
}

interface Trip {
  title?: string;
  description?: string;
  destination: Location;
  startDate: Date;
  endDate: Date;
  travelStyle?: 'Backpacker' | 'Budget' | 'Comfort' | 'Luxury';
  budget?: Budget;
  itinerary: ItineraryItem[];
  summary?: {
    overview: string;
    highlights: string[];
  };
  attachments?: string[];
  visibility: 'private' | 'public' | 'shared';
  status?: 'planning' | 'active' | 'completed';
  createdBy: string;
  collaborators?: Array<{
    userId: string;
    name: string;
    email: string;
    role: 'owner' | 'editor' | 'viewer';
    status: 'invited' | 'accepted' | 'declined';
    joinedAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/trips - Starting request processing');
    
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine");
    const status = searchParams.get("status");

    let filter: any = {};
    
    // Filter by user if 'mine=true'
    if (mine === "true") {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) {
        console.log('Authentication failed: No valid session found');
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const userId = session.user.id;
      filter.$or = [
        { createdBy: userId },
        { "collaborators.userId": userId }
      ];
    }

    // Filter by status if provided
    if (status) {
      filter.status = status;
    }

    console.log('Fetching trips with filter:', filter);
    const trips = await db
      .collection<Trip>("trips")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`Found ${trips.length} trips`);
    return NextResponse.json({ trips });
  } catch (error) {
    console.error("Error fetching trips:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE /api/trips - Starting request processing');

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      console.log('Authentication failed: No valid session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');

    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    const db = await getDb();

    // Convert string ID to MongoDB ObjectId
    const { ObjectId } = require('mongodb');
    let objectId;
    try {
      objectId = new ObjectId(tripId);
    } catch (error) {
      return NextResponse.json({ error: "Invalid trip ID format" }, { status: 400 });
    }

    // Verify trip exists and user has permission
    const trip = await db.collection<Trip>("trips").findOne({
      _id: objectId,
      $or: [
        { createdBy: session.user.id },
        { "collaborators.userId": session.user.id }
      ]
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found or unauthorized" }, { status: 404 });
    }

    // Delete the trip
    const deleteResult = await db.collection<Trip>("trips").deleteOne({ _id: objectId });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting trip:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log('PATCH /api/trips - Starting request processing');

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      console.log('Authentication failed: No valid session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const body = await request.json();
    const { tripId, status } = body;

    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    // Convert string ID to MongoDB ObjectId
    const { ObjectId } = require('mongodb');
    let objectId;
    try {
      objectId = new ObjectId(tripId);
    } catch (error) {
      return NextResponse.json({ error: "Invalid trip ID format" }, { status: 400 });
    }

    // Verify trip exists and user has permission
    const trip = await db.collection<Trip>("trips").findOne({
      _id: objectId,
      $or: [
        { createdBy: session.user.id },
        { "collaborators.userId": session.user.id }
      ]
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found or unauthorized" }, { status: 404 });
    }

    // Update the trip
    const updateResult = await db.collection<Trip>("trips").updateOne(
      { _id: objectId },
      { 
        $set: { 
          status: status,
          updatedAt: new Date()
        } 
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
    }

    const updatedTrip = await db.collection<Trip>("trips").findOne({ _id: objectId });
    return NextResponse.json({ trip: updatedTrip });
  } catch (error) {
    console.error("Error updating trip:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Log start of request processing
    console.log('POST /api/trips - Starting request processing');

    // Optional: require auth — comment the block to allow public
    console.log('Authenticating request...');
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      console.log('Authentication failed: No valid session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log('Authentication successful for user:', session.user.id);

    // Initialize database connection
    console.log('Connecting to database...');
    const db = await getDb();
    console.log('Database connection established');

    // Parse request body
    console.log('Parsing request body...');
    const body = await request.json();
    console.log('Raw request body:', body);

    // Extract and validate required fields
    const { destination, startDate, endDate } = body ?? {};
    
    // Validate destination
    if (!destination || !destination.name) {
      console.log('Validation failed: Invalid destination');
      return NextResponse.json({
        error: "Invalid payload: destination with name is required",
        received: { destination }
      }, { status: 400 });
    }

    // Validate dates
    if (!startDate || !endDate) {
      console.log('Validation failed: Missing dates');
      return NextResponse.json({
        error: "Invalid payload: startDate and endDate are required",
        received: { startDate, endDate }
      }, { status: 400 });
    }

    // Enrich destination with real insights (coordinates, weather, estimated cost) when possible
    console.log('Enriching destination with external insights...');
    const insights = await getDestinationInsights(destination.name);
    console.log('Destination insights fetched:', insights);

    // Merge incoming destination object with fetched insights (insights take precedence where available)
    const enrichedDestination: Location = {
      ...destination,
      country: destination.country || insights.country,
      averageDailyCost: destination.averageDailyCost || insights.averageDailyCost || undefined,
      weather: destination.weather || insights.weather || undefined,
      coordinates: destination.coordinates || (insights.lat !== undefined && insights.lng !== undefined ? { lat: insights.lat!, lng: insights.lng! } : undefined),
    };

    console.log('Creating trip object with enriched destination...');
    const trip: Trip = {
      ...body, // include other fields provided by client
      title: body.title || `Trip to ${destination.name}`,
      destination: enrichedDestination,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      itinerary: body.itinerary || [],
      status: body.status || 'planning',
      visibility: body.visibility || 'private',
      createdBy: session.user.id,
      collaborators: [{
        userId: session.user.id,
        name: session.user.name || 'Unknown',
        email: session.user.email || '',
        role: 'owner',
        status: 'accepted',
        joinedAt: new Date()
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log('Trip object created:', { tripTitle: trip.title, tripDestination: trip.destination });

    // Save to database
    console.log('Saving trip to database...');
    const result = await db.collection<Trip>("trips").insertOne(trip);
    console.log('Trip saved successfully with ID:', result.insertedId);

    // Return response
    console.log('Sending success response');
    return NextResponse.json({ id: result.insertedId, trip }, { status: 201 });
  } catch (error) {
    // Log detailed error information
    console.error("Error creating trip:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
