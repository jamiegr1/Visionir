import { NextResponse } from "next/server";
import { createBlock, listBlocks } from "@/lib/storage";
import { getMockCurrentUser } from "@/lib/current-user";
import { hasPermission } from "@/lib/permissions";
import type { BlockData, BlockStatus } from "@/lib/types";

export async function POST(req: Request) {
  const currentUser = getMockCurrentUser(req);

  if (!hasPermission(currentUser.role, "block.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    data?: BlockData;
    status?: BlockStatus;
  };

  if (!body?.data) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const initialStatus: BlockStatus =
    body.status === "pending_approval" ? "pending_approval" : "draft";

  const block = await createBlock(body.data, {
    status: initialStatus,
    createdByUserId: currentUser.id,
    updatedByUserId: currentUser.id,
    submittedByUserId:
      initialStatus === "pending_approval" ? currentUser.id : null,
    approvedByUserId: null,
    rejectedByUserId: null,
    publishedByUserId: null,
    submittedAt: initialStatus === "pending_approval" ? now : null,
    approvedAt: null,
    rejectedAt: null,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ block }, { status: 201 });
}

export async function GET(req: Request) {
  const currentUser = getMockCurrentUser(req);
  const blocks = await listBlocks();

  const visibleBlocks = blocks.filter((block) => {
    if (currentUser.role === "admin") return true;
    if (currentUser.role === "approver") return true;
    return block.createdByUserId === currentUser.id;
  });

  return NextResponse.json({ blocks: visibleBlocks }, { status: 200 });
}