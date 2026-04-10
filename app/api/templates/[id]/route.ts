import { NextResponse } from "next/server";
import {
  deleteTemplate,
  getTemplateById,
  updateTemplate,
} from "@/lib/template-storage";
import type { UpdateTemplateInput } from "@/lib/template-types";
import {
  canArchiveTemplate,
  canDeleteTemplate,
  canEditTemplate,
  canPublishTemplate,
  canViewTemplate,
  type Role,
} from "@/lib/permissions";

function isRole(value: string | null): value is Role {
  return value === "creator" || value === "approver" || value === "admin";
}

function getRoleFromRequest(request: Request): Role {
  const url = new URL(request.url);
  const roleParam = url.searchParams.get("role");
  return isRole(roleParam) ? roleParam : "admin";
}

function getUserIdFromBody(body: unknown, fallback = "user-1") {
  if (
    body &&
    typeof body === "object" &&
    "updatedByUserId" in body &&
    typeof (body as { updatedByUserId?: unknown }).updatedByUserId === "string" &&
    (body as { updatedByUserId: string }).updatedByUserId.trim()
  ) {
    return (body as { updatedByUserId: string }).updatedByUserId.trim();
  }

  return fallback;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const role = getRoleFromRequest(request);

    if (!canViewTemplate({ id: "user-1", role })) {
      return NextResponse.json(
        { error: "You do not have permission to view templates." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const template = await getTemplateById(id);

    if (!template) {
      return NextResponse.json(
        { error: "Template not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Failed to load template:", error);

    return NextResponse.json(
      { error: "Failed to load template." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const role = getRoleFromRequest(request);
    const { id } = await context.params;

    const template = await getTemplateById(id);

    if (!template) {
      return NextResponse.json(
        { error: "Template not found." },
        { status: 404 }
      );
    }

    const body = (await request.json().catch(() => null)) as
      | (UpdateTemplateInput & {
          action?: "publish" | "archive" | "unpublish";
          updatedByUserId?: string;
        })
      | null;

    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const user = {
      id: getUserIdFromBody(body),
      role,
    };

    const action = body.action;

    if (action === "publish") {
      if (!canPublishTemplate(user, template)) {
        return NextResponse.json(
          { error: "You do not have permission to publish this template." },
          { status: 403 }
        );
      }

      const updated = await updateTemplate(id, {
        status: "published",
        updatedByUserId: user.id,
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      });

      return NextResponse.json({ template: updated });
    }

    if (action === "archive") {
      if (!canArchiveTemplate(user, template)) {
        return NextResponse.json(
          { error: "You do not have permission to archive this template." },
          { status: 403 }
        );
      }

      const updated = await updateTemplate(id, {
        status: "archived",
        updatedByUserId: user.id,
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({ template: updated });
    }

    if (action === "unpublish") {
      if (!canEditTemplate(user, template)) {
        return NextResponse.json(
          { error: "You do not have permission to unpublish this template." },
          { status: 403 }
        );
      }

      const updated = await updateTemplate(id, {
        status: "draft",
        updatedByUserId: user.id,
        updatedAt: new Date().toISOString(),
        publishedAt: null,
      });

      return NextResponse.json({ template: updated });
    }

    if (!canEditTemplate(user, template)) {
      return NextResponse.json(
        { error: "You do not have permission to edit this template." },
        { status: 403 }
      );
    }

    const updated = await updateTemplate(id, {
      name: body.name,
      slug: body.slug,
      description: body.description,
      category: body.category,
      audience: body.audience,
      purpose: body.purpose,
      defaultAiInstruction: body.defaultAiInstruction,
      status: body.status,
      version: body.version,
      sections: body.sections,
      updatedByUserId: user.id,
      updatedAt: new Date().toISOString(),
      publishedAt:
        typeof body.publishedAt === "string" || body.publishedAt === null
          ? body.publishedAt
          : undefined,
    });

    return NextResponse.json({ template: updated });
  } catch (error) {
    console.error("Failed to update template:", error);

    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to update template.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const role = getRoleFromRequest(request);
    const { id } = await context.params;

    const template = await getTemplateById(id);

    if (!template) {
      return NextResponse.json(
        { error: "Template not found." },
        { status: 404 }
      );
    }

    const user = {
      id: "user-1",
      role,
    };

    if (!canDeleteTemplate(user, template)) {
      return NextResponse.json(
        { error: "You do not have permission to delete this template." },
        { status: 403 }
      );
    }

    const deleted = await deleteTemplate(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Template could not be deleted." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete template:", error);

    return NextResponse.json(
      { error: "Failed to delete template." },
      { status: 500 }
    );
  }
}