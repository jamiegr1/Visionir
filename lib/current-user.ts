import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { Role, UserLike } from "@/lib/permissions";

export const MOCK_SESSION_COOKIE = "visionir_role";

export function isRole(value: string | null | undefined): value is Role {
  return value === "creator" || value === "approver" || value === "admin";
}

export function getMockUserByRole(role: Role): UserLike {
  return {
    id: "user-1",
    role,
  };
}

export function getMockCurrentUser(request?: Request | NextRequest): UserLike {
  let role: Role = "admin";

  if (request) {
    const cookieRole =
      "cookies" in request
        ? request.cookies.get(MOCK_SESSION_COOKIE)?.value
        : undefined;

    if (isRole(cookieRole)) {
      role = cookieRole;
    } else {
      const url = new URL(request.url);
      const roleParam = url.searchParams.get("role");

      if (isRole(roleParam)) {
        role = roleParam;
      }
    }
  }

  return getMockUserByRole(role);
}

export async function getCurrentUserFromCookie(): Promise<UserLike | null> {
  const cookieStore = await cookies();
  const role = cookieStore.get(MOCK_SESSION_COOKIE)?.value;

  if (!isRole(role)) {
    return null;
  }

  return getMockUserByRole(role);
}