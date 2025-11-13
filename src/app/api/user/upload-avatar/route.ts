import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auth } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    console.log("🚀 POST /api/user/upload-avatar route hit");
    
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Create unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    const fileName = `avatar-${session.user.id}-${timestamp}${path.extname(file.name)}`;
    const uploadPath = path.join(process.cwd(), "public", "images", "user", fileName);

    // Save file
    await writeFile(uploadPath, buffer);
    console.log("✅ File saved:", uploadPath);

    // Update user in database
    const avatarUrl = `/images/user/${fileName}`;
    const db = await getDb();
    
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
    
    if (!usersCollection || !existingUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    await usersCollection.updateOne(
      { _id: existingUser._id },
      { 
        $set: { 
          image: avatarUrl,
          updatedAt: new Date() 
        } 
      }
    );

    console.log("✅ Avatar updated for user:", session.user.id);

    return NextResponse.json({ 
      success: true,
      avatarUrl 
    });
  } catch (error: unknown) {
    console.error("❌ Error uploading avatar:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
