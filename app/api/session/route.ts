import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/current-user";

export async function GET() {
  try {
    const user = await getCurrentUserFromCookie();
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Session route failed:", error);

    return NextResponse.json(
      { user: null, error: "Failed to load session" },
      { status: 500 }
    );
  }
}