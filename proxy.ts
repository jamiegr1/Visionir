import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { MOCK_SESSION_COOKIE } from "@/lib/current-user";

const protectedPrefixes = [
  "/dashboard",
  "/brand",
  "/blocks",
  "/deployment",
  "/settings",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const session = request.cookies.get(MOCK_SESSION_COOKIE)?.value;

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/brand/:path*",
    "/blocks/:path*",
    "/deployment/:path*",
    "/settings/:path*",
  ],
};