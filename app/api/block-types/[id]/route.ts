import { NextResponse } from "next/server";
import { getMockCurrentUser } from "@/lib/current-user";
import {
  canApproveBlockType,
  canRequestChangesBlockType,
  canSubmitBlockType,
} from "@/lib/permissions";
import { getBlockType, updateBlockType } from "@/lib/block-type-storage";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const blockType = await getBlockType(id);

  if (!blockType) {
    return NextResponse.json(
      { error: "Block type not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ blockType });
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const currentUser = getMockCurrentUser(req);
    const body = await req.json().catch(() => ({}));

    const action = typeof body.action === "string" ? body.action : "";
    const blockType = await getBlockType(id);

    if (!blockType) {
      return NextResponse.json(
        { error: "Block type not found." },
        { status: 404 }
      );
    }

    if (action === "submit") {
      if (!canSubmitBlockType(currentUser, blockType)) {
        return NextResponse.json(
          { error: "You do not have permission to submit this block type." },
          { status: 403 }
        );
      }

      const updated = await updateBlockType(
        id,
        {
          status: "pending_approval",
          submittedByUserId: currentUser.id,
          submittedAt: new Date().toISOString(),
          changesRequestedByUserId: null,
          changesRequestedAt: null,
          changesRequestedNotes: null,
        },
        { updatedByUserId: currentUser.id }
      );

      return NextResponse.json({ blockType: updated });
    }

    if (action === "approve") {
      if (!canApproveBlockType(currentUser, blockType)) {
        return NextResponse.json(
          { error: "You do not have permission to approve this block type." },
          { status: 403 }
        );
      }

      const updated = await updateBlockType(
        id,
        {
          status: "approved",
          visibility: "brand",
          approvedByUserId: currentUser.id,
          approvedAt: new Date().toISOString(),
          badges: ["Approved"],
        },
        { updatedByUserId: currentUser.id }
      );

      return NextResponse.json({ blockType: updated });
    }

    if (action === "request_changes") {
      if (!canRequestChangesBlockType(currentUser, blockType)) {
        return NextResponse.json(
          {
            error:
              "You do not have permission to request changes for this block type.",
          },
          { status: 403 }
        );
      }

      const notes =
        typeof body.notes === "string" && body.notes.trim()
          ? body.notes.trim()
          : "Changes requested.";

      const updated = await updateBlockType(
        id,
        {
          status: "changes_requested",
          changesRequestedByUserId: currentUser.id,
          changesRequestedAt: new Date().toISOString(),
          changesRequestedNotes: notes,
          badges: ["Changes Requested"],
        },
        { updatedByUserId: currentUser.id }
      );

      return NextResponse.json({ blockType: updated });
    }

    if (action === "archive") {
      if (currentUser.role !== "admin") {
        return NextResponse.json(
          { error: "Only admins can archive block types." },
          { status: 403 }
        );
      }

      const updated = await updateBlockType(
        id,
        {
          status: "archived",
          badges: ["Archived"],
        },
        { updatedByUserId: currentUser.id }
      );

      return NextResponse.json({ blockType: updated });
    }

    return NextResponse.json(
      { error: "Unsupported block type action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/block-types/[id] failed:", error);

    return NextResponse.json(
      {
        error: "Failed to update block type.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}