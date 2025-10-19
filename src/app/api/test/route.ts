import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "API is working!" });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ message: "PUT method is working!" });
}
