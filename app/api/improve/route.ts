import { NextResponse } from "next/server";
import { getMockCurrentUser } from "@/lib/current-user";
import { hasPermission } from "@/lib/permissions";
import type { BlockData, ValuePoint } from "@/lib/types";

type DescribeChangesRequestBody = {
  instructions?: string;
  blockData?: BlockData;
  componentType?: string;
  componentVariant?: string;
};

type ExtraContentItem = Record<string, unknown>;

function normaliseWhitespace(text: string) {
  return text
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

function sentenceCase(text: string) {
  if (!text) return text;
  const trimmed = normaliseWhitespace(text);
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function titleCaseWords(text: string) {
  return normaliseWhitespace(text)
    .split(" ")
    .map((word) =>
      word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word
    )
    .join(" ");
}

function preserveEndingPunctuation(original: string, next: string) {
  const endsWithPeriod = /\.\s*$/.test(original);
  const endsWithExclamation = /!\s*$/.test(original);
  const endsWithQuestion = /\?\s*$/.test(original);

  const result = next.replace(/[.!?]+\s*$/g, "").trim();

  if (endsWithExclamation) return `${result}!`;
  if (endsWithQuestion) return `${result}?`;
  if (endsWithPeriod) return `${result}.`;

  return result;
}

function cloneBlockData(data: BlockData): BlockData {
  return JSON.parse(JSON.stringify(data));
}

function formatComponentLabel(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function includesAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern));
}

function isHeroComponent(componentType?: string) {
  return (componentType || "").toLowerCase().includes("hero");
}

function isValueGridComponent(componentType?: string) {
  const value = (componentType || "").toLowerCase();
  return (
    value.includes("value") ||
    value.includes("benefit") ||
    value.includes("feature")
  );
}

function isTestimonialComponent(componentType?: string) {
  const value = (componentType || "").toLowerCase();
  return value.includes("testimonial") || value.includes("quote");
}

function isCtaComponent(componentType?: string) {
  const value = (componentType || "").toLowerCase();
  return (
    value.includes("cta") ||
    value.includes("contact") ||
    value.includes("conversion")
  );
}

function isStatsComponent(componentType?: string) {
  return (componentType || "").toLowerCase().includes("stats");
}

function isLogoComponent(componentType?: string) {
  const value = (componentType || "").toLowerCase();
  return value.includes("logo") || value.includes("trust");
}

function isFaqComponent(componentType?: string) {
  return (componentType || "").toLowerCase().includes("faq");
}

function applyEnterpriseTone(text: string) {
  const replacements: Array<[RegExp, string]> = [
    [/\bawesome\b/gi, "strong"],
    [/\bamazing\b/gi, "strong"],
    [/\bworld[- ]class\b/gi, "enterprise-grade"],
    [/\bcutting[- ]edge\b/gi, "advanced"],
    [/\bgame[- ]changing\b/gi, "high-impact"],
    [/\bpowerful\b/gi, "robust"],
    [/\bseamless\b/gi, "consistent"],
    [/\beasy\b/gi, "simple"],
    [/\beasier\b/gi, "simpler"],
    [/\bquick\b/gi, "fast"],
    [/\bquickly\b/gi, "efficiently"],
    [/\bgreat\b/gi, "strong"],
    [/\bgood\b/gi, "strong"],
    [/\bhelp\b/gi, "support"],
    [/\bhelps\b/gi, "supports"],
    [/\bhelping\b/gi, "supporting"],
    [/\bmake sure\b/gi, "ensure"],
    [/\bshow\b/gi, "highlight"],
    [/\bshows\b/gi, "highlights"],
  ];

  let result = text;

  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }

  return normaliseWhitespace(result);
}

function tightenCopy(text: string) {
  let result = text;

  const replacements: Array<[RegExp, string]> = [
    [/\bin order to\b/gi, "to"],
    [/\bso that\b/gi, "to"],
    [/\ba lot of\b/gi, "many"],
    [/\bkind of\b/gi, ""],
    [/\bsort of\b/gi, ""],
    [/\breally\b/gi, ""],
    [/\bvery\b/gi, ""],
    [/\bthat helps\b/gi, "that supports"],
    [/\bdesigned to help\b/gi, "designed to support"],
  ];

  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }

  return normaliseWhitespace(result);
}

function makeMoreCorporate(text: string) {
  return sentenceCase(tightenCopy(applyEnterpriseTone(text)));
}

function makeMoreConversionFocused(
  text: string,
  field:
    | "headline"
    | "subheading"
    | "valuePointTitle"
    | "valuePointText"
    | "ctaLabel"
) {
  let result = text;

  if (field === "headline") {
    result = result
      .replace(/\bwhy choose\b/gi, "Why Leading Teams Choose")
      .replace(/\blearn more\b/gi, "Move Forward With Confidence");
  }

  if (field === "subheading") {
    result = result
      .replace(/\bwe support\b/gi, "We support organisations")
      .replace(/\bservices\b/gi, "solutions");
  }

  if (field === "valuePointTitle") {
    result = result
      .replace(/\bbetter\b/gi, "Stronger")
      .replace(/\bmore\b/gi, "Greater");
  }

  if (field === "valuePointText") {
    result = result
      .replace(/\bbenefits\b/gi, "outcomes")
      .replace(/\bresults\b/gi, "commercial outcomes");
  }

  if (field === "ctaLabel") {
    result = result
      .replace(/\blearn more\b/gi, "Speak to an Expert")
      .replace(/\bcontact us\b/gi, "Talk to Our Team");
  }

  return sentenceCase(normaliseWhitespace(result));
}

function adjustHeadline(text: string, instructions: string) {
  let result = text;

  if (
    includesAny(instructions, [
      "corporate",
      "enterprise",
      "professional",
      "higher level",
      "more strategic",
    ])
  ) {
    result = makeMoreCorporate(result);
  }

  if (
    includesAny(instructions, [
      "conversion",
      "convert",
      "cta",
      "action",
      "commercial",
    ])
  ) {
    result = makeMoreConversionFocused(result, "headline");
  }

  if (includesAny(instructions, ["shorter", "tighter", "concise"])) {
    result = tightenCopy(result);
  }

  return sentenceCase(result).replace(/[.]+$/g, "");
}

function adjustSubheading(text: string, instructions: string) {
  let result = text;

  if (
    includesAny(instructions, [
      "corporate",
      "enterprise",
      "professional",
      "more strategic",
    ])
  ) {
    result = makeMoreCorporate(result);
  }

  if (
    includesAny(instructions, [
      "conversion",
      "convert",
      "cta",
      "commercial",
    ])
  ) {
    result = makeMoreConversionFocused(result, "subheading");
  }

  if (includesAny(instructions, ["shorter", "tighter", "concise"])) {
    result = tightenCopy(result);
  }

  return preserveEndingPunctuation(text, sentenceCase(result));
}

function adjustEyebrow(text: string, instructions: string) {
  let result = text;

  if (
    includesAny(instructions, [
      "corporate",
      "enterprise",
      "professional",
      "more strategic",
    ])
  ) {
    result = applyEnterpriseTone(result);
  }

  result = result.replace(/\band\b/gi, " & ");
  result = result.replace(/[.!?]+$/g, "");

  return titleCaseWords(result);
}

function adjustValuePointTitle(text: string, instructions: string) {
  let result = text;

  if (
    includesAny(instructions, [
      "corporate",
      "enterprise",
      "professional",
      "more strategic",
    ])
  ) {
    result = makeMoreCorporate(result);
  }

  if (includesAny(instructions, ["conversion", "convert", "commercial"])) {
    result = makeMoreConversionFocused(result, "valuePointTitle");
  }

  if (includesAny(instructions, ["shorter", "tighter", "concise"])) {
    result = tightenCopy(result);
  }

  result = result.replace(/[.!?]+$/g, "");
  return sentenceCase(result);
}

function adjustValuePointText(text: string, instructions: string) {
  let result = text;

  if (
    includesAny(instructions, [
      "corporate",
      "enterprise",
      "professional",
      "more strategic",
    ])
  ) {
    result = makeMoreCorporate(result);
  }

  if (includesAny(instructions, ["conversion", "convert", "commercial"])) {
    result = makeMoreConversionFocused(result, "valuePointText");
  }

  if (includesAny(instructions, ["shorter", "tighter", "concise"])) {
    result = tightenCopy(result);
  }

  return preserveEndingPunctuation(text, sentenceCase(result));
}

function getRequestedAccent(instructions: string): ValuePoint["accent"] | null {
  if (includesAny(instructions, ["all blue", "use blue", "make it blue"])) {
    return "blue";
  }
  if (includesAny(instructions, ["all green", "use green", "make it green"])) {
    return "green";
  }
  if (
    includesAny(instructions, ["all orange", "use orange", "make it orange"])
  ) {
    return "orange";
  }
  if (
    includesAny(instructions, ["all purple", "use purple", "make it purple"])
  ) {
    return "purple";
  }
  return null;
}

function updateValuePoints(
  valuePoints: ValuePoint[],
  instructions: string
): ValuePoint[] {
  let next = Array.isArray(valuePoints) ? [...valuePoints] : [];

  next = next.map((point) => ({
    ...point,
    title: adjustValuePointTitle(point.title ?? "", instructions),
    text: adjustValuePointText(point.text ?? "", instructions),
  }));

  const requestedAccent = getRequestedAccent(instructions);
  if (requestedAccent) {
    next = next.map((point) => ({
      ...point,
      accent: requestedAccent,
    }));
  }

  if (
    includesAny(instructions, [
      "more value points",
      "add value point",
      "add another value point",
    ]) &&
    next.length > 0 &&
    next.length < 6
  ) {
    const source = next[next.length - 1];
    next.push({
      ...source,
      title: "Additional Value",
      text: "Adds another focused supporting point aligned with the block objective.",
    });
  }

  if (
    includesAny(instructions, [
      "fewer value points",
      "remove value point",
      "reduce value points",
    ]) &&
    next.length > 2
  ) {
    next = next.slice(0, next.length - 1);
  }

  return next;
}

function updateStatsExtraContent(
  extraContent: Record<string, unknown>,
  instructions: string
) {
  const rawStats = Array.isArray(extraContent.stats) ? extraContent.stats : [];

  const nextStats = rawStats
    .filter(
      (item): item is { label?: unknown; value?: unknown } =>
        typeof item === "object" && item !== null
    )
    .map((item) => ({
      label: adjustValuePointTitle(String(item.label ?? ""), instructions),
      value: String(item.value ?? "").trim(),
    }));

  if (
    includesAny(instructions, ["add stat", "more stats", "add another stat"]) &&
    nextStats.length > 0 &&
    nextStats.length < 4
  ) {
    nextStats.push({
      label: "Additional Metric",
      value: "100+",
    });
  }

  if (
    includesAny(instructions, ["fewer stats", "remove stat", "reduce stats"]) &&
    nextStats.length > 2
  ) {
    nextStats.pop();
  }

  return {
    ...extraContent,
    stats: nextStats,
  };
}

function updateLogosExtraContent(
  extraContent: Record<string, unknown>,
  instructions: string
) {
  const rawLogos = Array.isArray(extraContent.logos) ? extraContent.logos : [];

  const nextLogos = rawLogos
    .filter(
      (item): item is { name?: unknown } =>
        typeof item === "object" && item !== null
    )
    .map((item, index) => ({
      name:
        adjustValuePointTitle(String(item.name ?? `Partner ${index + 1}`), instructions) ||
        `Partner ${index + 1}`,
    }));

  if (
    includesAny(instructions, ["add logo", "more logos", "add another logo"]) &&
    nextLogos.length > 0 &&
    nextLogos.length < 6
  ) {
    nextLogos.push({
      name: `Partner ${nextLogos.length + 1}`,
    });
  }

  if (
    includesAny(instructions, ["fewer logos", "remove logo", "reduce logos"]) &&
    nextLogos.length > 2
  ) {
    nextLogos.pop();
  }

  return {
    ...extraContent,
    logos: nextLogos,
  };
}

function updateTestimonialExtraContent(
  extraContent: Record<string, unknown>,
  instructions: string
) {
  const next = { ...extraContent };

  if (typeof next.quote === "string") {
    next.quote = adjustSubheading(next.quote, instructions);
  }

  if (typeof next.authorName === "string") {
    next.authorName = titleCaseWords(next.authorName);
  }

  if (typeof next.authorRole === "string") {
    next.authorRole = adjustValuePointTitle(next.authorRole, instructions);
  }

  if (typeof next.company === "string") {
    next.company = titleCaseWords(next.company);
  }

  return next;
}

function updateCtaExtraContent(
  extraContent: Record<string, unknown>,
  instructions: string
) {
  const next = { ...extraContent };

  if (typeof next.primaryCtaLabel === "string") {
    next.primaryCtaLabel = makeMoreConversionFocused(
      next.primaryCtaLabel,
      "ctaLabel"
    ).replace(/[.]+$/g, "");
  }

  if (typeof next.secondaryCtaLabel === "string") {
    next.secondaryCtaLabel = makeMoreConversionFocused(
      next.secondaryCtaLabel,
      "ctaLabel"
    ).replace(/[.]+$/g, "");
  }

  if (
    includesAny(instructions, [
      "single cta",
      "one cta",
      "remove secondary cta",
      "primary only",
    ])
  ) {
    next.secondaryCtaLabel = "";
    next.secondaryCtaUrl = "";
  }

  return next;
}

function applyInstructionDrivenChanges(
  blockData: BlockData,
  instructions: string,
  componentType?: string,
  componentVariant?: string
): BlockData {
  const next = cloneBlockData(blockData);
  const normalisedInstructions = normaliseWhitespace(instructions).toLowerCase();
  const resolvedComponentType = componentType || next.componentType || "";
  const resolvedComponentVariant = componentVariant || next.componentVariant || "";

  if (!normalisedInstructions) {
    return next;
  }

  next.componentType = next.componentType || resolvedComponentType || undefined;
  next.componentVariant =
    next.componentVariant || resolvedComponentVariant || undefined;

  next.eyebrow = adjustEyebrow(next.eyebrow ?? "", normalisedInstructions);
  next.headline = adjustHeadline(next.headline ?? "", normalisedInstructions);
  next.subheading = adjustSubheading(
    next.subheading ?? "",
    normalisedInstructions
  );

  if (
    isHeroComponent(resolvedComponentType) ||
    isValueGridComponent(resolvedComponentType) ||
    !resolvedComponentType
  ) {
    next.valuePoints = updateValuePoints(
      next.valuePoints ?? [],
      normalisedInstructions
    );
  }

  if (isStatsComponent(resolvedComponentType)) {
    next.extraContent = updateStatsExtraContent(
      ((next.extraContent as Record<string, unknown>) || {}),
      normalisedInstructions
    );
  }

  if (isLogoComponent(resolvedComponentType)) {
    next.extraContent = updateLogosExtraContent(
      ((next.extraContent as Record<string, unknown>) || {}),
      normalisedInstructions
    );
  }

  if (isTestimonialComponent(resolvedComponentType)) {
    next.extraContent = updateTestimonialExtraContent(
      ((next.extraContent as Record<string, unknown>) || {}),
      normalisedInstructions
    );
  }

  if (isCtaComponent(resolvedComponentType)) {
    next.extraContent = updateCtaExtraContent(
      ((next.extraContent as Record<string, unknown>) || {}),
      normalisedInstructions
    );
  }

  if (
    includesAny(normalisedInstructions, ["centered", "centre", "center"]) &&
    next.design
  ) {
    next.design.layout = "stacked";
    next.design.headingAlign = "center";
  }

  if (
    includesAny(normalisedInstructions, [
      "left align",
      "left-aligned",
      "split layout",
    ]) &&
    next.design
  ) {
    next.design.layout = "split";
    next.design.headingAlign = "left";
  }

  if (
    includesAny(normalisedInstructions, [
      "more corporate",
      "more enterprise",
      "enterprise style",
    ]) &&
    next.design
  ) {
    next.design.theme = "enterprise";
    next.design.cardStyle = "soft";
    next.design.shadow = "soft";
  }

  if (includesAny(normalisedInstructions, ["lighter", "light theme"]) && next.design) {
    next.design.theme = "light";
  }

  if (includesAny(normalisedInstructions, ["softer", "soft theme"]) && next.design) {
    next.design.theme = "soft";
  }

  if (includesAny(normalisedInstructions, ["outline cards", "outlined cards"]) && next.design) {
    next.design.cardStyle = "outline";
  }

  if (includesAny(normalisedInstructions, ["filled cards", "stronger cards"]) && next.design) {
    next.design.cardStyle = "filled";
  }

  if (
    includesAny(normalisedInstructions, ["less shadow", "remove shadow"]) &&
    next.design
  ) {
    next.design.shadow = "none";
  }

  if (
    includesAny(normalisedInstructions, ["more shadow", "strong shadow"]) &&
    next.design
  ) {
    next.design.shadow = "strong";
  }

  return next;
}

export async function POST(req: Request) {
  try {
    const currentUser = getMockCurrentUser(req);

    if (
      !currentUser ||
      !(
        hasPermission(currentUser.role, "block.edit.any") ||
        hasPermission(currentUser.role, "block.edit.own")
      )
    ) {
      return NextResponse.json(
        { error: "You do not have permission to apply block changes." },
        { status: 403 }
      );
    }

    const body = (await req.json().catch(() => null)) as DescribeChangesRequestBody | null;

    const instructions =
      typeof body?.instructions === "string" ? body.instructions.trim() : "";
    const blockData = body?.blockData;
    const componentType =
      typeof body?.componentType === "string" ? body.componentType.trim() : "";
    const componentVariant =
      typeof body?.componentVariant === "string"
        ? body.componentVariant.trim()
        : "";

    if (!instructions || !blockData) {
      return NextResponse.json(
        { error: "Missing required instructions or blockData." },
        { status: 400 }
      );
    }

    const nextBlockData = applyInstructionDrivenChanges(
      blockData,
      instructions,
      componentType,
      componentVariant
    );

    return NextResponse.json({
      ok: true,
      blockData: nextBlockData,
      meta: {
        componentType: formatComponentLabel(componentType || blockData.componentType) || null,
        componentVariant:
          formatComponentLabel(componentVariant || blockData.componentVariant) || null,
      },
    });
  } catch (error) {
    console.error("Describe changes route failed:", error);

    return NextResponse.json(
      { error: "Failed to apply describe changes." },
      { status: 500 }
    );
  }
}