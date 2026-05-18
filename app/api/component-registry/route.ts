import { NextResponse } from "next/server";
import { getApprovedComponentRegistry } from "@/lib/component-registry-server";

export async function GET() {
  try {
    const registry = await getApprovedComponentRegistry();

    return NextResponse.json({ components: registry });
  } catch (error) {
    console.error("GET /api/component-registry failed:", error);

    return NextResponse.json(
      {
        error: "Failed to load component registry.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}