import { NextResponse } from "next/server";
import { createBlock, listBlocks } from "@/lib/storage";
import { getMockCurrentUser } from "@/lib/current-user";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: Request) {
  try {
    const currentUser = getMockCurrentUser(req);

    if (!hasPermission(currentUser.role, "block.view.own")) {
      return NextResponse.json(
        { error: "You do not have permission to view blocks." },
        { status: 403 }
      );
    }

    const blocks = await listBlocks();

    return NextResponse.json({ blocks });
  } catch (error) {
    console.error("GET /api/blocks failed:", error);
    return NextResponse.json(
      {
        error: "Failed to load blocks.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = getMockCurrentUser(req);

    if (!hasPermission(currentUser.role, "block.create")) {
      return NextResponse.json(
        { error: "You do not have permission to create blocks." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const data = body?.data;
    const status = body?.status ?? "draft";

    if (!data) {
      return NextResponse.json(
        { error: "Missing block data." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const block = await createBlock(data, {
      status,
      createdByUserId: currentUser.id,
      updatedByUserId: currentUser.id,
      submittedByUserId: null,
      approvedByUserId: null,
      rejectedByUserId: null,
      publishedByUserId: null,
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    console.error("POST /api/blocks failed:", error);
    return NextResponse.json(
      { error: "Failed to create block." },
      { status: 500 }
    );
  }
}