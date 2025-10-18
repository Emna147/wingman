// db.ts
import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("❌ MONGODB_URI is not defined in environment variables");
}

const uri = process.env.MONGODB_URI;

// Create a single MongoClient instance (recommended for Next.js apps)
const mongoClient = new MongoClient(uri);

let dbInstance: Db | null = null;

/**
 * Returns a connected Db instance.
 * Ensures only one connection is created and reused across hot reloads.
 */
export async function getDb(): Promise<Db> {
  if (!dbInstance) {
    try {
      await mongoClient.connect();
      console.log("✅ MongoDB connected successfully");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
    dbInstance = mongoClient.db("wingman"); // <-- your DB name
  }
  return dbInstance;
}
