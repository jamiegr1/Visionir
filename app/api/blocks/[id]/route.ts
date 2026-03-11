import { NextResponse } from "next/server";
import { getBlockById, updateBlock } from "@/lib/storage";
import type { BlockData, BlockRecord } from "@/lib/types";

type PatchBody = Partial<Pick<BlockRecord, "status" | "approvalId">> & {
  data?: BlockData;
};

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const block = getBlockById(id);

  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  return NextResponse.json({ block }, { status: 200 });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = (await req.json().catch(() => ({}))) as PatchBody;

  const updated = updateBlock(id, body);

  if (!updated) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  return NextResponse.json({ block: updated }, { status: 200 });
}