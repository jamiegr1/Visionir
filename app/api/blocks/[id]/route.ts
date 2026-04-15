import { NextResponse } from "next/server";
import { getBlockById, updateBlock } from "@/lib/storage";
import { getMockCurrentUser } from "@/lib/current-user";
import {
  canApproveBlock,
  canEditBlock,
  canPublishBlock,
  canRequestChanges,
} from "@/lib/permissions";
import type { BlockData, BlockStatus } from "@/lib/types";

type PatchBody = {
  data?: BlockData;
  status?: BlockStatus;
  editMode?: "standard" | "page_builder";
  requiresApproval?: boolean;
  changesRequestedNotes?: string;
  changesRequestedFields?: string[];
};

function isValidBlockStatus(value: unknown): value is BlockStatus {
  return (
    value === "draft" ||
    value === "pending_approval" ||
    value === "in_review" ||
    value === "changes_requested" ||
    value === "approved" ||
    value === "published" ||
    value === "archived"
  );
}

function resolveNextStatus(params: {
  existingStatus: BlockStatus;
  requestedStatus?: BlockStatus;
  isDataUpdate: boolean;
  editMode: "standard" | "page_builder";
  requiresApproval: boolean;
}): BlockStatus {
  const {
    existingStatus,
    requestedStatus,
    isDataUpdate,
    editMode,
    requiresApproval,
  } = params;

  if (requestedStatus) {
    return requestedStatus;
  }

  if (!isDataUpdate) {
    return existingStatus;
  }

  if (editMode === "page_builder") {
    if (requiresApproval) {
      return "pending_approval";
    }

    if (existingStatus === "approved" || existingStatus === "published") {
      return "approved";
    }

    if (
      existingStatus === "pending_approval" ||
      existingStatus === "changes_requested"
    ) {
      return "draft";
    }

    return existingStatus;
  }

  if (requiresApproval) {
    return "pending_approval";
  }

  if (existingStatus === "changes_requested") {
    return "draft";
  }

  return existingStatus;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const currentUser = getMockCurrentUser(req);
  const { id } = await context.params;

  const block = await getBlockById(id);

  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  if (
    currentUser.role !== "admin" &&
    currentUser.role !== "approver" &&
    block.createdByUserId !== currentUser.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ block }, { status: 200 });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const currentUser = getMockCurrentUser(req);
  const { id } = await context.params;

  const existing = await getBlockById(id);

  if (!existing) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as PatchBody;

  const isDataUpdate = typeof body.data !== "undefined";
  const editMode = body.editMode ?? "standard";
  const requiresApproval = body.requiresApproval ?? false;
  const requestedStatus = isValidBlockStatus(body.status) ? body.status : undefined;

  const nextStatus = resolveNextStatus({
    existingStatus: existing.status,
    requestedStatus,
    isDataUpdate,
    editMode,
    requiresApproval,
  });

  let allowed = false;

  if (isDataUpdate) {
    allowed = canEditBlock(currentUser, existing);
  } else if (nextStatus === "approved") {
    allowed = canApproveBlock(currentUser, existing);
  } else if (nextStatus === "changes_requested") {
    allowed = canRequestChanges(currentUser, existing);
  } else if (nextStatus === "published") {
    allowed = canPublishBlock(currentUser, existing);
  } else {
    allowed = canEditBlock(currentUser, existing);
  }

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date().toISOString();

  const nextData =
    typeof body.data !== "undefined"
      ? {
          ...existing.data,
          ...body.data,
        }
      : existing.data;

  const updated = await updateBlock(id, {
    data: nextData,
    status: nextStatus,
    updatedByUserId: currentUser.id,
    updatedAt: now,

    approvedByUserId:
      nextStatus === "approved"
        ? existing.approvedByUserId ?? currentUser.id
        : nextStatus === "draft" || nextStatus === "pending_approval"
          ? existing.approvedByUserId
          : existing.approvedByUserId,

    publishedByUserId:
      nextStatus === "published" ? currentUser.id : existing.publishedByUserId,

    approvedAt:
      nextStatus === "approved"
        ? existing.approvedAt ?? now
        : existing.approvedAt,

    publishedAt: nextStatus === "published" ? now : existing.publishedAt,

    submittedByUserId:
      nextStatus === "pending_approval"
        ? existing.submittedByUserId ?? currentUser.id
        : existing.submittedByUserId ?? null,

    submittedAt:
      nextStatus === "pending_approval"
        ? existing.submittedAt ?? now
        : existing.submittedAt ?? null,

    changesRequestedByUserId:
      nextStatus === "changes_requested"
        ? currentUser.id
        : nextStatus === "approved" || nextStatus === "pending_approval"
          ? null
          : existing.changesRequestedByUserId ?? null,

    changesRequestedAt:
      nextStatus === "changes_requested"
        ? now
        : nextStatus === "approved" || nextStatus === "pending_approval"
          ? null
          : existing.changesRequestedAt ?? null,

    changesRequestedNotes:
      nextStatus === "changes_requested"
        ? body.changesRequestedNotes?.trim() || null
        : nextStatus === "approved" || nextStatus === "pending_approval"
          ? null
          : typeof body.changesRequestedNotes !== "undefined"
            ? body.changesRequestedNotes?.trim() || null
            : existing.changesRequestedNotes ?? null,

    changesRequestedFields:
      nextStatus === "changes_requested"
        ? Array.isArray(body.changesRequestedFields)
          ? body.changesRequestedFields
          : []
        : nextStatus === "approved" || nextStatus === "pending_approval"
          ? null
          : Array.isArray(body.changesRequestedFields)
            ? body.changesRequestedFields
            : existing.changesRequestedFields ?? null,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Failed to update block" },
      { status: 500 }
    );
  }

  return NextResponse.json({ block: updated }, { status: 200 });
}