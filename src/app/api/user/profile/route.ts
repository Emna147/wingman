import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { auth } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  console.log("🚀 PUT /api/user/profile route hit");
  try {
    // Get the session to verify the user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { firstName, lastName, email, phone, bio } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required" },
        { status: 400 }
      );
    }

    // Get database connection
    const db = await getDb();
    
    console.log("Session user ID:", session.user.id);
    console.log("Session user:", session.user);
    
    // Try to find user in the most common collection names
    const possibleCollections = ["user", "users", "account", "accounts"];
    let usersCollection = null;
    let existingUser = null;
    
    for (const collectionName of possibleCollections) {
      const collection = db.collection(collectionName);
      const user = await collection.findOne({ id: session.user.id });
      if (user) {
        usersCollection = collection;
        existingUser = user;
        console.log(`✅ Found user in collection: ${collectionName}`);
        break;
      }
    }
    
    // If not found by ID, try by email
    if (!existingUser) {
      for (const collectionName of possibleCollections) {
        const collection = db.collection(collectionName);
        const user = await collection.findOne({ email: session.user.email });
        if (user) {
          usersCollection = collection;
          existingUser = user;
          console.log(`✅ Found user by email in collection: ${collectionName}`);
          break;
        }
      }
    }
    
    console.log("Existing user document:", existingUser);
    
    if (!usersCollection) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Update user profile - include phone and bio
    const updateData = {
      name: `${firstName} ${lastName}`.trim(),
      email,
      ...(phone && { phone }), // Only add phone if provided
      ...(bio && { bio }), // Only add bio if provided
      updatedAt: new Date(),
    };

    console.log("Updating with data:", updateData);

    const result = await usersCollection.updateOne(
      { _id: existingUser!._id },
      { $set: updateData }
    );

    console.log("Update result:", result);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found for update" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: session.user.id,
        name: updateData.name,
        email: updateData.email,
        phone: updateData.phone,
        bio: updateData.bio,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the session to verify the user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get database connection
    const db = await getDb();
    
    // Better Auth typically uses different collection names
    const possibleCollections = ["users", "user", "account", "accounts"];
    let user = null;
    
    for (const collectionName of possibleCollections) {
      const collection = db.collection(collectionName);
      const foundUser = await collection.findOne(
        { id: session.user.id },
        { projection: { password: 0 } } // Exclude password from response
      );
      if (foundUser) {
        user = foundUser;
        console.log(`Found user in collection: ${collectionName}`);
        break;
      }
    }
    
    // If still not found, try by email
    if (!user) {
      for (const collectionName of possibleCollections) {
        const collection = db.collection(collectionName);
        const foundUser = await collection.findOne(
          { email: session.user.email },
          { projection: { password: 0 } }
        );
        if (foundUser) {
          user = foundUser;
          console.log(`Found user by email in collection: ${collectionName}`);
          break;
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
