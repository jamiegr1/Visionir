import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  console.log("Submitting block:", id);

  return NextResponse.json({
    ok: true,
    id,
    status: "pending_approval",
  });
}