import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import type { Role, UserLike } from "@/lib/permissions";

export const MOCK_SESSION_COOKIE = "visionir_mock_session";

export type MockSessionUser = UserLike & {
  name: string;
  email: string;
};

const MOCK_USERS: Record<Role, MockSessionUser> = {
  creator: {
    id: "user-creator-1",
    name: "Jamie Creator",
    email: "creator@visionir.local",
    role: "creator",
  },
  approver: {
    id: "user-approver-1",
    name: "Alex Approver",
    email: "approver@visionir.local",
    role: "approver",
  },
  admin: {
    id: "user-admin-1",
    name: "Jamie Admin",
    email: "admin@visionir.local",
    role: "admin",
  },
};

export function isRole(value: string | null | undefined): value is Role {
  return value === "creator" || value === "approver" || value === "admin";
}

export function getMockUserByRole(role: Role): MockSessionUser {
  return MOCK_USERS[role];
}

export async function getCurrentUserFromCookie(): Promise<MockSessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(MOCK_SESSION_COOKIE)?.value;

  if (!isRole(raw)) return null;
  return getMockUserByRole(raw);
}

export function getCurrentUserFromRequest(
  request?: Request | NextRequest
): MockSessionUser | null {
  if (!request) return null;

  const cookieValue =
    "cookies" in request && typeof request.cookies?.get === "function"
      ? request.cookies.get(MOCK_SESSION_COOKIE)?.value
      : null;

  if (isRole(cookieValue)) {
    return getMockUserByRole(cookieValue);
  }

  const fallbackRole =
    "url" in request && request.url
      ? new URL(request.url).searchParams.get("role")
      : null;

  if (isRole(fallbackRole)) {
    return getMockUserByRole(fallbackRole);
  }

  return null;
}

export function getMockCurrentUser(
  request?: Request | NextRequest
): MockSessionUser {
  return getCurrentUserFromRequest(request) ?? getMockUserByRole("admin");
}