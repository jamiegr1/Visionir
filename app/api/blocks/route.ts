import { NextResponse } from "next/server";
import { createBlock, listBlocks } from "@/lib/storage";
import type { BlockData } from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { data?: BlockData };

  if (!body?.data) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const block = createBlock(body.data);
  return NextResponse.json({ block }, { status: 201 });
}

export async function GET() {
  const blocks = listBlocks();
  return NextResponse.json({ blocks }, { status: 200 });
}