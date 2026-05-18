import { NextResponse } from "next/server";
import { getMockCurrentUser } from "@/lib/current-user";
import { hasPermission } from "@/lib/permissions";
import { createBlockType, listBlockTypes } from "@/lib/block-type-storage";
import type { ComponentCategory, ComponentSchema } from "@/lib/component-schema";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isCategory(value: unknown): value is ComponentCategory {
  return (
    value === "hero" ||
    value === "content" ||
    value === "media" ||
    value === "conversion" ||
    value === "proof" ||
    value === "navigation" ||
    value === "utility"
  );
}

export async function GET(req: Request) {
  const currentUser = getMockCurrentUser(req);

  if (!hasPermission(currentUser.role, "block_type.view")) {
    return NextResponse.json(
      { error: "You do not have permission to view block types." },
      { status: 403 }
    );
  }

  const blockTypes = await listBlockTypes();

  return NextResponse.json({ blockTypes });
}

export async function POST(req: Request) {
  try {
    const currentUser = getMockCurrentUser(req);

    if (!hasPermission(currentUser.role, "block_type.create")) {
      return NextResponse.json(
        { error: "You do not have permission to create block types." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const purpose = typeof body.purpose === "string" ? body.purpose.trim() : "";
    const category = isCategory(body.category) ? body.category : "content";

    if (!name) {
      return NextResponse.json(
        { error: "Block type name is required." },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: "Block type description is required." },
        { status: 400 }
      );
    }

    const id = slugify(name);
    const now = new Date().toISOString();

    const fields: ComponentSchema["fields"] = Array.isArray(body.fields)
      ? body.fields
      : [];

    const variants: ComponentSchema["variants"] = Array.isArray(body.variants)
      ? body.variants
      : [];

    const blockType = await createBlockType(
      {
        id,
        name,
        category,
        description,
        status: "pending_approval",
        visibility: "local",
        version: 1,
        schemaVersion: 1,
        ownerTeam: "Local Team",
        tags: Array.isArray(body.tags) ? body.tags : ["custom", "ai-generated"],
        preview: {
          key: id,
          label: name,
          style: "wireframe",
          aspectRatio: "wide",
        },
        useCaseLabel: purpose || "Custom block type",
        badges: ["Pending Approval"],
        variants,
        fields,
        approvals: {
          requiresApproval: true,
          approvalReason: "New block type requires review before use.",
          requiresLegalReview: Boolean(body.requiresLegalReview),
          requiresRegionalReview: false,
          requiredApproverRoles: ["admin"],
        },
        composition: {
          allowedParents: ["page"],
          allowedChildren: [],
          cannotFollow: [],
          mustBeFirst: false,
          maxPerPage:
            typeof body.maxPerPage === "number" ? body.maxPerPage : 3,
          minPerPage: 0,
        },
        deployment: {
          deployable: true,
          targetCms: ["optimizely", "framer", "custom"],
          requiredMappings: fields
            .filter((field) => field.required)
            .map((field) => field.id),
          fieldMappings: fields.map((field) => ({
            sourceField: field.id,
            targetField: field.id,
            required: Boolean(field.required),
          })),
          requiresPublishValidation: true,
          supportsLocales: true,
        },
        allowedLocales: ["en-GB", "en-US"],
        inheritsBrandRules: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        createdByUserId: currentUser.id,
        updatedByUserId: currentUser.id,
      }
    );

    return NextResponse.json({ blockType }, { status: 201 });
  } catch (error) {
    console.error("POST /api/block-types failed:", error);

    return NextResponse.json(
      {
        error: "Failed to create block type.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}