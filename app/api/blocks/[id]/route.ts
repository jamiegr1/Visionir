import { NextResponse } from "next/server";
import { getBlockById, updateBlock } from "@/lib/storage";
import { getMockCurrentUser } from "@/lib/current-user";
import {
  canApproveBlock,
  canEditBlock,
  canPublishBlock,
  canRejectBlock,
  canRequestChanges,
} from "@/lib/permissions";
import type { BlockData, BlockStatus } from "@/lib/types";

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

  const body = (await req.json().catch(() => ({}))) as {
    data?: BlockData;
    status?: BlockStatus;
  };

  const nextStatus = body.status ?? existing.status;
  const isDataUpdate = typeof body.data !== "undefined";

  let allowed = false;

  if (isDataUpdate) {
    allowed = canEditBlock(currentUser, existing);
  } else if (nextStatus === "approved") {
    allowed = canApproveBlock(currentUser, existing);
  } else if (nextStatus === "rejected") {
    allowed = canRejectBlock(currentUser, existing);
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

  const updated = await updateBlock(id, {
    data: body.data ?? existing.data,
    status: nextStatus,
    updatedByUserId: currentUser.id,
    updatedAt: now,
    approvedByUserId:
      nextStatus === "approved" ? currentUser.id : existing.approvedByUserId,
    rejectedByUserId:
      nextStatus === "rejected" ? currentUser.id : existing.rejectedByUserId,
    publishedByUserId:
      nextStatus === "published" ? currentUser.id : existing.publishedByUserId,
    approvedAt: nextStatus === "approved" ? now : existing.approvedAt,
    rejectedAt: nextStatus === "rejected" ? now : existing.rejectedAt,
    publishedAt: nextStatus === "published" ? now : existing.publishedAt,
  });

  if (!updated) {
    return NextResponse.json({ error: "Failed to update block" }, { status: 500 });
  }

  return NextResponse.json({ block: updated }, { status: 200 });
}