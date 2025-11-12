import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { auth } from "@/lib/auth";
import { ObjectId } from "mongodb";

type Expense = {
  userId: string;
  label: string;
  amount: number;
  createdAt: Date;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;
    const _id = new ObjectId(id);
    const activity = await db.collection("activities").findOne({ _id });
    if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ expenses: activity.expenses ?? [] });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDb();
    const { id } = await params;
    const _id = new ObjectId(id);

    const body = await request.json().catch(() => ({}));
    const label = String(body.label || "").trim();
    const amount = Number(body.amount);
    if (!label || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid expense" }, { status: 400 });
    }

    const expense: Expense = {
      userId: session.user.id,
      label,
      amount,
      createdAt: new Date(),
    };

    const result = await db
      .collection<{ expenses?: Expense[] }>("activities")
      .updateOne(
        { _id },
        { $push: { expenses: expense } } as any
      );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
