import type { NextRequest } from "next/server";
import type { Role, UserLike } from "@/lib/permissions";

function isRole(value: string | null): value is Role {
  return value === "creator" || value === "approver" || value === "admin";
}

export function getMockCurrentUser(request?: Request | NextRequest): UserLike {
  let role: Role = "admin";

  if (request) {
    const url = new URL(request.url);
    const roleParam = url.searchParams.get("role");

    if (isRole(roleParam)) {
      role = roleParam;
    }
  }

  return {
    id: "user-1",
    role,
  };
}