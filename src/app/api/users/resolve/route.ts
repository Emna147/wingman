import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === "string") as string[] : [];
    if (ids.length === 0) {
      return NextResponse.json({ users: {} });
    }

    const db = await getDb();
    const possibleCollections = ["users", "user", "account", "accounts"];
    const result: Record<string, { id: string; name?: string; email?: string }> = {};

    for (const collName of possibleCollections) {
      const coll = db.collection(collName);
      // Try matching by custom 'id' field
      const byIdDocs = await coll
        .find({ id: { $in: ids } }, { projection: { id: 1, name: 1, email: 1, firstName: 1, lastName: 1 } })
        .toArray();
      for (const d of byIdDocs) {
        const fullName = (d.name as string) || [d.firstName, d.lastName].filter(Boolean).join(" ");
        const key = d.id as string;
        if (key && !result[key]) {
          result[key] = { id: key, name: fullName || d.email, email: d.email };
        }
      }
      // Try matching by Mongo _id as string/ObjectId
      const validObjectIds = ids
        .map((s) => {
          try {
            return new ObjectId(s);
          } catch {
            return null;
          }
        })
        .filter((x): x is ObjectId => !!x);
      if (validObjectIds.length > 0) {
        const byMongoIdDocs = await coll
          .find({ _id: { $in: validObjectIds } }, { projection: { _id: 1, id: 1, name: 1, email: 1, firstName: 1, lastName: 1 } })
          .toArray();
        for (const d of byMongoIdDocs) {
          const fullName = (d.name as string) || [d.firstName, d.lastName].filter(Boolean).join(" ");
          const key = String(d.id || d._id);
          if (key && !result[key]) {
            result[key] = { id: key, name: fullName || d.email, email: d.email };
          }
        }
      }
    }

    return NextResponse.json({ users: result });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

