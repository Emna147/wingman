export async function GET() {
  return Response.json({ message: "Simple test works!" });
}

export async function PUT() {
  return Response.json({ message: "PUT test works!" });
}
