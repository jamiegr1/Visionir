import { NextResponse } from "next/server";
import { getBlockById, updateBlock } from "@/lib/storage";
import { getMockCurrentUser } from "@/lib/current-user";
import { canSubmitBlock } from "@/lib/permissions";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const currentUser = getMockCurrentUser(req);
  const { id } = await context.params;

  const block = await getBlockById(id);

  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  if (!canSubmitBlock(currentUser, block)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date().toISOString();

  const updated = await updateBlock(id, {
    status: "pending_approval",
    submittedByUserId: currentUser.id,
    submittedAt: now,
    updatedByUserId: currentUser.id,
    updatedAt: now,
  });

  if (!updated) {
    return NextResponse.json({ error: "Failed to submit block" }, { status: 500 });
  }

  return NextResponse.json({ block: updated }, { status: 200 });
}