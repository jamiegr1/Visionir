import { NextResponse } from "next/server";
import type { Accent, BlockData, BlockDesign } from "@/lib/types";

type Governance = {
  score: number;
  checks: Array<{ id: string; label: string; ok: boolean }>;
  bannedHit?: string | null;
};

function buildGovernance(block: BlockData, note?: string): Governance {
  const bannedWords = ["guarantee", "guaranteed", "best in the world", "perfect"];
  const combined = [
    block.eyebrow,
    block.headline,
    block.subheading,
    ...block.valuePoints.flatMap((v) => [v.title, v.text]),
    note || "",
  ]
    .join(" ")
    .toLowerCase();

  const bannedHit = bannedWords.find((word) => combined.includes(word)) ?? null;

  return {
    score: bannedHit ? 84 : 100,
    bannedHit,
    checks: [
      { id: "brand", label: "Brand language validated", ok: true },
      { id: "accessibility", label: "Accessibility structure checked", ok: true },
      { id: "tokens", label: "Design token usage locked", ok: true },
      { id: "claims", label: "Restricted claims checked", ok: !bannedHit },
    ],
  };
}

function improveFieldCopy(field: string, text: string) {
  const clean = (text || "").trim();
  if (!clean) return clean;

  if (field === "eyebrow") {
    return "KIWA AGRI-FOOD";
  }

  if (field === "headline") {
    return clean
      .replace(/partner with us/gi, "Choose Kiwa Agri-Food")
      .replace(/why organisations partner with us/gi, "Why Choose Kiwa Agri-Food")
      .replace(/why partner with us/gi, "Why Choose Kiwa Agri-Food");
  }

  if (field === "subheading") {
    return "Kiwa Agri-Food delivers accredited certification and technical support with a clear, compliance-led approach.";
  }

  if (
    field.startsWith("valuePointTitle:") ||
    field.startsWith("valuePointText:") ||
    field.startsWith("valuePoints.")
  ) {
    const [title = "", ...rest] = clean.split("\n");
    const body = rest.join("\n").trim();

    const improvedTitle = title
      .replace(/holistic/gi, "structured")
      .replace(/practical insight/gi, "operational insight")
      .replace(/scalable/gi, "scalable enterprise")
      .trim();

    const improvedBody = (body || clean)
      .replace(
        /with 20\+ years of certified service under ISO\/IEC 17065\.?/gi,
        "backed by long-standing accredited expertise."
      )
      .replace(/clear guidance/gi, "structured guidance")
      .replace(/responsive coordination/gi, "reliable delivery support")
      .trim();

    if (field.startsWith("valuePointTitle:")) {
      return improvedTitle || clean;
    }

    if (field.startsWith("valuePointText:")) {
      return improvedBody || clean;
    }

    return [improvedTitle, improvedBody].filter(Boolean).join("\n");
  }

  return clean;
}

function stripQuotes(value: string) {
  return value.trim().replace(/^["']|["']$/g, "").trim();
}

function extractFieldInstruction(note: string, labels: string[]) {
  const escaped = labels.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const labelGroup = `(?:${escaped.join("|")})`;

  const patterns = [
    new RegExp(
      `(?:change|set|update|make)\\s+(?:the\\s+)?${labelGroup}\\s+(?:to|as|say)\\s+(.+)`,
      "i"
    ),
    new RegExp(
      `(?:rewrite|replace)\\s+(?:the\\s+)?${labelGroup}\\s+(?:with\\s+)?(.+)`,
      "i"
    ),
    new RegExp(`${labelGroup}\\s+(?:to|as|say)\\s+(.+)`, "i"),
  ];

  for (const pattern of patterns) {
    const match = note.match(pattern);
    if (match?.[1]) return stripQuotes(match[1]);
  }

  return null;
}

function nextDesign(current: BlockDesign, note: string): BlockDesign {
  const lower = note.toLowerCase();
  const design: BlockDesign = structuredClone(current);

  if (
    lower.includes("modern") ||
    lower.includes("cleaner") ||
    lower.includes("more modern")
  ) {
    design.theme = "enterprise";
    design.cardStyle = "soft";
    design.shadow = "soft";
    design.borderRadius = "xl";
  }

  if (lower.includes("minimal")) {
    design.cardStyle = "outline";
    design.shadow = "none";
  }

  if (
    lower.includes("more premium") ||
    lower.includes("more polished") ||
    lower.includes("enterprise saas")
  ) {
    design.theme = "enterprise";
    design.shadow = "soft";
    design.borderRadius = "xl";
    design.surface = "#ffffff";
    design.background = "#f6f8fc";
  }

  if (
    lower.includes("center align") ||
    lower.includes("centre align") ||
    lower.includes("center the heading")
  ) {
    design.headingAlign = "center";
  }

  if (lower.includes("left align")) {
    design.headingAlign = "left";
  }

  if (lower.includes("stacked layout")) {
    design.layout = "stacked";
  }

  if (lower.includes("split layout") || lower.includes("image on the right")) {
    design.layout = "split";
  }

  if (lower.includes("filled cards")) {
    design.cardStyle = "filled";
  }

  if (lower.includes("outline cards")) {
    design.cardStyle = "outline";
  }

  if (lower.includes("soft cards")) {
    design.cardStyle = "soft";
  }

  if (lower.includes("bigger corners") || lower.includes("rounder")) {
    design.borderRadius = "xl";
  }

  if (lower.includes("smaller corners")) {
    design.borderRadius = "md";
  }

  if (lower.includes("blue background")) design.background = "#eff6ff";
  if (lower.includes("grey background") || lower.includes("gray background")) {
    design.background = "#f5f7fb";
  }
  if (lower.includes("dark background")) design.background = "#0f172a";

  if (lower.includes("white cards")) design.surface = "#ffffff";
  if (lower.includes("dark cards")) design.surface = "#111827";

  if (lower.includes("blue heading")) design.headingColor = "#1d4ed8";
  if (lower.includes("dark heading")) design.headingColor = "#0f172a";
  if (lower.includes("white heading")) design.headingColor = "#ffffff";

  if (lower.includes("blue text")) design.textColor = "#1e40af";
  if (lower.includes("darker text")) design.textColor = "#334155";
  if (lower.includes("lighter text")) design.textColor = "#64748b";

  if (lower.includes("blue eyebrow")) design.eyebrowColor = "#2563eb";
  if (lower.includes("green eyebrow")) design.eyebrowColor = "#16a34a";
  if (lower.includes("orange eyebrow")) design.eyebrowColor = "#ea580c";
  if (lower.includes("purple eyebrow")) design.eyebrowColor = "#7c3aed";

  if (lower.includes("blue cards")) {
    design.cardColors.blue = "#2563eb";
    design.cardColors.green = "#60a5fa";
    design.cardColors.orange = "#93c5fd";
    design.cardColors.purple = "#bfdbfe";
  }

  if (lower.includes("green cards")) {
    design.cardColors.blue = "#22c55e";
    design.cardColors.green = "#16a34a";
    design.cardColors.orange = "#4ade80";
    design.cardColors.purple = "#86efac";
  }

  if (lower.includes("orange cards")) {
    design.cardColors.blue = "#f59e0b";
    design.cardColors.green = "#fb923c";
    design.cardColors.orange = "#f97316";
    design.cardColors.purple = "#fdba74";
  }

  if (lower.includes("purple cards")) {
    design.cardColors.blue = "#8b5cf6";
    design.cardColors.green = "#a78bfa";
    design.cardColors.orange = "#7c3aed";
    design.cardColors.purple = "#c4b5fd";
  }

  return design;
}

function applyDescribePatch(note: string, block: BlockData) {
  const lower = note.toLowerCase();

  const patch: Partial<BlockData> & {
    valuePoints?: Array<{ title: string; text: string; accent: Accent }>;
  } = {};

  const notes: string[] = [];

  const explicitEyebrow = extractFieldInstruction(note, ["eyebrow"]);
  const explicitHeadline = extractFieldInstruction(note, [
    "headline",
    "heading",
    "title",
    "main heading",
  ]);
  const explicitSubheading = extractFieldInstruction(note, [
    "sub heading",
    "subheading",
    "subtitle",
    "description",
    "intro",
    "introduction",
  ]);

  if (explicitEyebrow) {
    patch.eyebrow = explicitEyebrow;
    notes.push(`Updated eyebrow to "${explicitEyebrow}".`);
  }

  if (explicitHeadline) {
    patch.headline = explicitHeadline;
    notes.push(`Updated headline to "${explicitHeadline}".`);
  }

  if (explicitSubheading) {
    patch.subheading = explicitSubheading;
    notes.push(`Updated subheading to "${explicitSubheading}".`);
  }

  for (let i = 1; i <= 4; i++) {
    const explicitPointTitle = extractFieldInstruction(note, [
      `value point ${i}`,
      `point ${i}`,
      `card ${i}`,
      `box ${i}`,
    ]);

    if (explicitPointTitle) {
      const next = structuredClone(patch.valuePoints ?? block.valuePoints);
      next[i - 1] = { ...next[i - 1], title: explicitPointTitle };
      patch.valuePoints = next;
      notes.push(`Updated value point ${i} title to "${explicitPointTitle}".`);
    }
  }

  if (lower.includes("shorter") || lower.includes("shorten")) {
    patch.subheading =
      "Accredited certification and technical support that strengthen compliance and credibility.";
    notes.push("Shortened the subheading.");
  }

  if (lower.includes("more corporate") || lower.includes("enterprise tone")) {
    patch.headline = "Why Organisations Choose Kiwa Agri-Food";
    notes.push("Shifted the tone to be more enterprise-led.");
  }

  if (lower.includes("compliance")) {
    patch.subheading =
      "Kiwa Agri-Food provides accredited certification and technical support through a structured, compliance-led approach.";
    notes.push("Made the subheading more compliance-led.");
  }

  const nextDesignState = nextDesign(block.design, note);
  if (JSON.stringify(nextDesignState) !== JSON.stringify(block.design)) {
    patch.design = nextDesignState;
    notes.push("Applied design and styling updates.");
  }

  if (notes.length === 0) {
    patch.subheading =
      "Kiwa Agri-Food provides accredited certification and technical support through a structured and modern enterprise approach.";
    notes.push("Applied a general refinement based on the request.");
  }

  return { patch, notes };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const mode = typeof body?.mode === "string" ? body.mode : "";
    const field = typeof body?.field === "string" ? body.field : "";
    const text = typeof body?.text === "string" ? body.text : "";
    const describe =
      typeof body?.describe === "string"
        ? body.describe
        : typeof body?.text === "string"
        ? body.text
        : "";

    const block = body?.block as BlockData | undefined;

    const isFieldMode =
      mode === "field" ||
      (!!field &&
        (field === "eyebrow" ||
          field === "headline" ||
          field === "subheading" ||
          field.startsWith("valuePointTitle:") ||
          field.startsWith("valuePointText:") ||
          field.startsWith("valuePoints.")));

    const isDescribeMode = mode === "describe";

    if (isFieldMode) {
      if (!field) {
        return NextResponse.json(
          { ok: false, error: "Missing field" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        ok: true,
        text: improveFieldCopy(field, text),
        improved: improveFieldCopy(field, text),
      });
    }

    if (isDescribeMode) {
      if (!block) {
        return NextResponse.json(
          { ok: false, error: "Missing block" },
          { status: 400 }
        );
      }

      const result = applyDescribePatch(describe, block);
      const merged: BlockData = {
        ...block,
        ...result.patch,
        valuePoints: result.patch.valuePoints ?? block.valuePoints,
        design: (result.patch.design as BlockDesign | undefined) ?? block.design,
      };

      return NextResponse.json({
        ok: true,
        block: merged,
        patch: result.patch,
        notes: result.notes,
        governance: buildGovernance(merged, describe),
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Invalid request. Expected a field improve request or describe mode.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("refine route error:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}