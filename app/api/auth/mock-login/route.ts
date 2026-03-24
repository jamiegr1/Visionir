import { NextResponse } from "next/server";
import {
  getMockUserByRole,
  isRole,
  MOCK_SESSION_COOKIE,
} from "@/lib/current-user";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const role = body?.role;

    if (!isRole(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const user = getMockUserByRole(role);

    const res = NextResponse.json({
      ok: true,
      user,
      redirectTo: "/dashboard",
    });

    res.cookies.set(MOCK_SESSION_COOKIE, role, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("Mock login failed:", error);
    return NextResponse.json({ error: "Mock login failed." }, { status: 500 });
  }
}