import { NextResponse } from "next/server";
import { getBlockById, updateBlock } from "@/lib/storage";
import { getMockCurrentUser } from "@/lib/current-user";
import { canEditBlock } from "@/lib/permissions";
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

  if (!canEditBlock(currentUser, existing)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    data?: BlockData;
    status?: BlockStatus;
  };

  const updated = await updateBlock(id, {
    data: body.data ?? existing.data,
    status: body.status ?? existing.status,
    updatedByUserId: currentUser.id,
    updatedAt: new Date().toISOString(),
  });

  if (!updated) {
    return NextResponse.json({ error: "Failed to update block" }, { status: 500 });
  }

  return NextResponse.json({ block: updated }, { status: 200 });
}