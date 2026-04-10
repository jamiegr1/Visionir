import { NextResponse } from "next/server";
import {
  createPageFromTemplate,
  listPages,
} from "@/lib/page-storage";
import type { CreatePageFromTemplateInput } from "@/lib/template-types";
import { hasPermission, type Role } from "@/lib/permissions";

function isRole(value: string | null): value is Role {
  return value === "creator" || value === "approver" || value === "admin";
}

function getRoleFromRequest(request: Request): Role {
  const url = new URL(request.url);
  const roleParam = url.searchParams.get("role");
  return isRole(roleParam) ? roleParam : "admin";
}

export async function GET(request: Request) {
  try {
    const role = getRoleFromRequest(request);

    const canView =
      hasPermission(role, "page.view.own") ||
      hasPermission(role, "page.view.team") ||
      hasPermission(role, "page.view.all");

    if (!canView) {
      return NextResponse.json(
        { error: "You do not have permission to view pages." },
        { status: 403 }
      );
    }

    const pages = await listPages();

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Failed to list pages:", error);

    return NextResponse.json(
      { error: "Failed to load pages." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const role = getRoleFromRequest(request);

    if (!hasPermission(role, "page.create")) {
      return NextResponse.json(
        { error: "You do not have permission to create pages." },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as
      | (CreatePageFromTemplateInput & {
          createdByUserId?: string;
          updatedByUserId?: string;
        })
      | null;

    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    if (typeof body.templateId !== "string" || !body.templateId.trim()) {
      return NextResponse.json(
        { error: "Template ID is required." },
        { status: 400 }
      );
    }

    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "Page name is required." },
        { status: 400 }
      );
    }

    const page = await createPageFromTemplate({
      templateId: body.templateId.trim(),
      name: body.name.trim(),
      slug:
        typeof body.slug === "string" && body.slug.trim()
          ? body.slug.trim()
          : undefined,
      createdByUserId:
        typeof body.createdByUserId === "string" && body.createdByUserId.trim()
          ? body.createdByUserId.trim()
          : "user-1",
      updatedByUserId:
        typeof body.updatedByUserId === "string" && body.updatedByUserId.trim()
          ? body.updatedByUserId.trim()
          : "user-1",
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error("Failed to create page:", error);

    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to create page.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}