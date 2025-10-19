export async function PUT() {
  console.log("🚀 Simple PUT route hit");
  return Response.json({ message: "Simple profile route works!" });
}
