import { NextResponse } from "next/server";
import {
  attachBlockToPageSection,
  getPageById,
  removeBlockFromPageSection,
  updatePage,
} from "@/lib/page-storage";
import {
  canApprovePage,
  canEditPage,
  canPublishPage,
  canRejectPage,
  canSubmitPage,
  type Role,
} from "@/lib/permissions";
import type { PageStatus, UpdatePageInput } from "@/lib/template-types";

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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const role = getRoleFromRequest(request);
    const { id } = await context.params;

    const page = await getPageById(id);

    if (!page) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    const canView =
      role === "admin" ||
      role === "approver" ||
      page.createdByUserId === "user-1";

    if (!canView) {
      return NextResponse.json(
        { error: "You do not have permission to view this page." },
        { status: 403 }
      );
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error("Failed to load page:", error);

    return NextResponse.json(
      { error: "Failed to load page." },
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

    const page = await getPageById(id);

    if (!page) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as
      | (UpdatePageInput & {
          action?:
            | "submit"
            | "approve"
            | "reject"
            | "publish"
            | "attach_block"
            | "remove_block";
          sectionId?: string;
          blockId?: string;
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

    if (body.action === "attach_block") {
      if (!body.sectionId || !body.blockId) {
        return NextResponse.json(
          { error: "sectionId and blockId are required." },
          { status: 400 }
        );
      }

      if (!canEditPage(user, page)) {
        return NextResponse.json(
          { error: "You do not have permission to edit this page." },
          { status: 403 }
        );
      }

      try {
        const updated = await attachBlockToPageSection(
          id,
          body.sectionId,
          body.blockId,
          user.id
        );

        if (!updated) {
          return NextResponse.json(
            { error: "Failed to attach block." },
            { status: 404 }
          );
        }

        return NextResponse.json({ page: updated });
      } catch (error) {
        return NextResponse.json(
          { error: getErrorMessage(error, "Failed to attach block.") },
          { status: 400 }
        );
      }
    }

    if (body.action === "remove_block") {
      if (!body.sectionId || !body.blockId) {
        return NextResponse.json(
          { error: "sectionId and blockId are required." },
          { status: 400 }
        );
      }

      if (!canEditPage(user, page)) {
        return NextResponse.json(
          { error: "You do not have permission to edit this page." },
          { status: 403 }
        );
      }

      try {
        const updated = await removeBlockFromPageSection(
          id,
          body.sectionId,
          body.blockId,
          user.id
        );

        if (!updated) {
          return NextResponse.json(
            { error: "Failed to remove block." },
            { status: 404 }
          );
        }

        return NextResponse.json({ page: updated });
      } catch (error) {
        return NextResponse.json(
          { error: getErrorMessage(error, "Failed to remove block.") },
          { status: 400 }
        );
      }
    }

    if (body.action === "submit") {
      if (!canSubmitPage(user, page)) {
        return NextResponse.json(
          { error: "You do not have permission to submit this page." },
          { status: 403 }
        );
      }

      const updated = await updatePage(id, {
        status: "pending_approval",
        updatedByUserId: user.id,
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({ page: updated });
    }

    if (body.action === "approve") {
      if (!canApprovePage(user, page)) {
        return NextResponse.json(
          { error: "You do not have permission to approve this page." },
          { status: 403 }
        );
      }

      const updated = await updatePage(id, {
        status: "approved",
        updatedByUserId: user.id,
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({ page: updated });
    }

    if (body.action === "reject") {
      if (!canRejectPage(user, page)) {
        return NextResponse.json(
          { error: "You do not have permission to reject this page." },
          { status: 403 }
        );
      }

      const updated = await updatePage(id, {
        status: "rejected",
        updatedByUserId: user.id,
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({ page: updated });
    }

    if (body.action === "publish") {
      if (!canPublishPage(user, page)) {
        return NextResponse.json(
          { error: "You do not have permission to publish this page." },
          { status: 403 }
        );
      }

      const updated = await updatePage(id, {
        status: "published",
        updatedByUserId: user.id,
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({ page: updated });
    }

    if (!canEditPage(user, page)) {
      return NextResponse.json(
        { error: "You do not have permission to edit this page." },
        { status: 403 }
      );
    }

    const nextStatus =
      typeof body.status === "string" ? (body.status as PageStatus) : undefined;

    const updated = await updatePage(id, {
      name: body.name,
      slug: body.slug,
      status: nextStatus,
      sections: body.sections,
      updatedByUserId: user.id,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ page: updated });
  } catch (error) {
    console.error("Failed to update page:", error);

    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to update page.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}