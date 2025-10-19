import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { auth } from "@/lib/auth";

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
    
    // Get all collections in the database
    const collections = await db.listCollections().toArray();
    console.log("Available collections:", collections.map(c => c.name));
    
    // Check each collection for user data
    const debugInfo: any = {
      sessionUser: session.user,
      collections: collections.map(c => c.name),
      userDocuments: {}
    };
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const coll = db.collection(collectionName);
      
      // Try to find documents that might be users
      const documents = await coll.find({}).limit(5).toArray();
      
      if (documents.length > 0) {
        debugInfo.userDocuments[collectionName] = {
          count: await coll.countDocuments(),
          sampleDocuments: documents,
          // Check if any document has user-like fields
          hasUserId: documents.some(doc => doc.id || doc._id),
          hasEmail: documents.some(doc => doc.email),
          hasName: documents.some(doc => doc.name),
        };
      }
    }
    
    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error("Error debugging database:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
