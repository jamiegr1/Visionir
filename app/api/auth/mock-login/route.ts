import { NextResponse } from "next/server";
import type { Role } from "@/lib/permissions";
import { isRole, MOCK_SESSION_COOKIE } from "@/lib/current-user";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const selectedRole = body?.role;

    if (!isRole(selectedRole)) {
      return NextResponse.json(
        { error: "Invalid role supplied." },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      redirectTo: "/dashboard",
      role: selectedRole as Role,
    });

    response.cookies.set(MOCK_SESSION_COOKIE, selectedRole, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Mock login failed:", error);

    return NextResponse.json(
      { error: "Unable to create session." },
      { status: 500 }
    );
  }
}