import { NextResponse } from "next/server";
import {
  createTemplate,
  listTemplateSummaries,
} from "@/lib/template-storage";
import type { CreateTemplateInput } from "@/lib/template-types";
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

    if (!hasPermission(role, "template.view")) {
      return NextResponse.json(
        { error: "You do not have permission to view templates." },
        { status: 403 }
      );
    }

    const templates = await listTemplateSummaries();

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Failed to list templates:", error);

    return NextResponse.json(
      { error: "Failed to load templates." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const role = getRoleFromRequest(request);

    if (!hasPermission(role, "template.create")) {
      return NextResponse.json(
        { error: "You do not have permission to create templates." },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as
      | (CreateTemplateInput & {
          createdByUserId?: string;
          updatedByUserId?: string;
        })
      | null;

    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "Template name is required." },
        { status: 400 }
      );
    }

    const template = await createTemplate(
      {
        name: body.name,
        slug: body.slug,
        description: body.description,
        category: body.category,
        audience: body.audience,
        purpose: body.purpose,
        defaultAiInstruction: body.defaultAiInstruction,
        status: body.status,
        sections: body.sections,
      },
      {
        createdByUserId:
          typeof body.createdByUserId === "string" && body.createdByUserId.trim()
            ? body.createdByUserId
            : "user-1",
        updatedByUserId:
          typeof body.updatedByUserId === "string" && body.updatedByUserId.trim()
            ? body.updatedByUserId
            : "user-1",
      }
    );

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Failed to create template:", error);

    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to create template.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}