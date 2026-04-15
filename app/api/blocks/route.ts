import { NextResponse } from "next/server";
import { createBlock, listBlocks } from "@/lib/storage";
import { getMockCurrentUser } from "@/lib/current-user";
import { hasPermission } from "@/lib/permissions";
import type { BlockStatus } from "@/lib/types";

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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
    const rawData = body?.data;

    const requestedStatus = body?.status;
    const status: BlockStatus = isValidBlockStatus(requestedStatus)
      ? requestedStatus
      : "draft";

    if (!isObject(rawData)) {
      return NextResponse.json(
        { error: "Missing or invalid block data." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const data = {
      ...rawData,
      componentType:
        typeof rawData.componentType === "string" && rawData.componentType.trim()
          ? rawData.componentType.trim()
          : undefined,
      componentVariant:
        typeof rawData.componentVariant === "string" && rawData.componentVariant.trim()
          ? rawData.componentVariant.trim()
          : undefined,
      pageId:
        typeof rawData.pageId === "string" && rawData.pageId.trim()
          ? rawData.pageId.trim()
          : undefined,
      pageName:
        typeof rawData.pageName === "string" && rawData.pageName.trim()
          ? rawData.pageName.trim()
          : undefined,
      sectionId:
        typeof rawData.sectionId === "string" && rawData.sectionId.trim()
          ? rawData.sectionId.trim()
          : undefined,
      sectionLabel:
        typeof rawData.sectionLabel === "string" && rawData.sectionLabel.trim()
          ? rawData.sectionLabel.trim()
          : undefined,
      sectionKey:
        typeof rawData.sectionKey === "string" && rawData.sectionKey.trim()
          ? rawData.sectionKey.trim()
          : undefined,
      templateName:
        typeof rawData.templateName === "string" && rawData.templateName.trim()
          ? rawData.templateName.trim()
          : undefined,
    };

    const block = await createBlock(data, {
      status,
      createdByUserId: currentUser.id,
      updatedByUserId: currentUser.id,
      submittedByUserId: null,
      approvedByUserId: null,
      publishedByUserId: null,
      submittedAt: null,
      approvedAt: null,
      publishedAt: null,
      changesRequestedByUserId: null,
      changesRequestedAt: null,
      changesRequestedNotes: null,
      changesRequestedFields: null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    console.error("POST /api/blocks failed:", error);
    return NextResponse.json(
      {
        error: "Failed to create block.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}