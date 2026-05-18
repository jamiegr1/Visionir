import { NextResponse } from "next/server";
import { getApprovedComponentRegistry } from "@/lib/component-registry-server";
import type { ComponentSchema } from "@/lib/component-schema";
import type {
  Accent,
  BlockData,
  BlockExtraContent,
  ContentLength,
  ImageSourceMode,
  ValuePoint,
} from "@/lib/types";

type GenerateRequestBody = {
  blockName?: string;
  location?: string;
  category?: string;
  componentId?: string;
  variantId?: string;
  componentType?: string;
  componentVariant?: string;
  prompt?: string;
  pageId?: string;
  pageName?: string;
  sectionId?: string;
  sectionLabel?: string;
  sectionKey?: string;
  templateName?: string;
  contentLength?: ContentLength;
  imageSourceMode?: ImageSourceMode;
};

function normaliseText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normaliseOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function formatComponentLabel(value?: string | null) {
  if (!value) return "";

  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function findComponent(registry: ComponentSchema[], componentId: string) {
  return registry.find((component) => component.id === componentId) || null;
}

function getFirstField(component: ComponentSchema | null, ids: string[]) {
  return component?.fields.find((field) => ids.includes(field.id));
}

function getPromptSignals(prompt: string) {
  const lower = prompt.toLowerCase();

  return {
    enterprise: ["enterprise", "corporate", "professional", "strategic"].some(
      (term) => lower.includes(term)
    ),
    conversion: ["conversion", "cta", "lead", "enquiry", "contact"].some(
      (term) => lower.includes(term)
    ),
    trust: ["trust", "credible", "proof", "assurance", "confidence"].some(
      (term) => lower.includes(term)
    ),
    concise: ["short", "concise", "tight", "brief", "minimal"].some((term) =>
      lower.includes(term)
    ),
  };
}

function buildEyebrow(params: {
  location: string;
  component: ComponentSchema | null;
  sectionLabel?: string;
}) {
  const { location, component, sectionLabel } = params;

  if (sectionLabel) return sectionLabel.toUpperCase();
  if (component?.category === "proof") return "PROOF";
  if (component?.category === "conversion") return "NEXT STEP";
  if (component?.category === "utility") return "INFORMATION";
  if (component?.category === "navigation") return "NAVIGATION";

  return location.toUpperCase();
}

function buildHeadline(params: {
  blockName: string;
  component: ComponentSchema | null;
}) {
  const { blockName, component } = params;

  if (blockName) return blockName;
  if (component?.name) return component.name;

  return "Governed Content Block";
}

function buildSubheading(params: {
  component: ComponentSchema | null;
  location: string;
  prompt: string;
  contentLength: ContentLength;
}) {
  const { component, location, prompt, contentLength } = params;
  const signals = getPromptSignals(prompt);

  if (component?.description) {
    return `${component.description} Built for ${location} with governed structure, brand consistency and enterprise-ready content control.`;
  }

  if (contentLength === "Short") {
    return `Present ${location} clearly in a concise, governed content block designed for fast comprehension.`;
  }

  if (contentLength === "Detailed") {
    return `Present ${location} in a detailed, structured content block that balances clarity, trust and enterprise-ready consistency.`;
  }

  if (signals.enterprise) {
    return `Create an enterprise-ready section for ${location} with clear hierarchy, governed messaging and consistent presentation.`;
  }

  return `Create a structured section for ${location} that keeps content clear, consistent and aligned to governance standards.`;
}

function buildValuePoints(params: {
  component: ComponentSchema | null;
  location: string;
  contentLength: ContentLength;
}): ValuePoint[] {
  const { component, location, contentLength } = params;

  const fieldNames =
    component?.fields
      .slice(0, 4)
      .map((field) => field.label)
      .filter(Boolean) || [];

  const base: ValuePoint[] = [
    {
      title: "Structured for clarity",
      text: `Uses a governed ${component?.name || "block"} structure to make ${location} easier to understand.`,
      accent: "blue",
    },
    {
      title: "Aligned to governance",
      text: "Keeps content, layout and presentation within approved brand and system rules.",
      accent: "green",
    },
    {
      title: "Reusable by design",
      text: "Creates a repeatable content pattern that can support templates, pages and future site evolution.",
      accent: "orange",
    },
    {
      title: "Built for control",
      text: "Supports approval workflows, schema consistency and enterprise content standards.",
      accent: "purple",
    },
  ];

  if (fieldNames.length >= 3) {
    return fieldNames.slice(0, 4).map((label, index) => ({
      title: label,
      text: `Governed ${label.toLowerCase()} content for ${location}, aligned to the approved block type schema.`,
      accent: ["blue", "green", "orange", "purple"][index] as Accent,
    }));
  }

  return contentLength === "Short" ? base.slice(0, 3) : base;
}

function buildDesign(params: {
  component: ComponentSchema | null;
  variantId: string;
  prompt: string;
}): BlockData["design"] {
  const { component, variantId, prompt } = params;
  const signals = getPromptSignals(prompt);

  const layout =
    variantId.includes("center") || variantId.includes("stacked")
      ? "stacked"
      : variantId.includes("grid")
        ? "stacked"
        : "split";

  return {
    theme: signals.enterprise ? "enterprise" : "soft",
    layout,
    cardStyle:
      component?.category === "proof" || component?.category === "content"
        ? "outline"
        : component?.category === "conversion"
          ? "filled"
          : "soft",
    headingAlign:
      variantId.includes("center") || component?.category === "conversion"
        ? "center"
        : "left",
    borderRadius: "xl",
    shadow: "soft",
    background: "#f5f7fb",
    surface: "#ffffff",
    headingColor: "#0f172a",
    textColor: "#475569",
    eyebrowColor: "#1457d1",
    cardColors: {
      blue: "#3b82f6",
      green: "#22c55e",
      orange: "#f59e0b",
      purple: "#8b5cf6",
    },
  };
}

function buildImageUrl(params: {
  component: ComponentSchema | null;
  imageSourceMode: ImageSourceMode;
}) {
  const { component, imageSourceMode } = params;

  if (imageSourceMode === "none") return undefined;
  if (
    component?.category === "proof" ||
    component?.category === "navigation" ||
    component?.category === "utility"
  ) {
    return undefined;
  }

  return "/farmer.jpg";
}

function buildExtraContent(params: {
  component: ComponentSchema | null;
  componentVariant: string;
  location: string;
  blockName: string;
}): BlockExtraContent | undefined {
  const { component, componentVariant, location, blockName } = params;

  if (!component) {
    return {
      generatedBlockLabel: blockName,
      selectedVariant: componentVariant,
    };
  }

  const hasFaqItems = getFirstField(component, ["items", "faqItems"]);
  const hasStats = getFirstField(component, ["stats"]);
  const hasLogos = getFirstField(component, ["logos"]);
  const hasQuote = getFirstField(component, ["quote"]);
  const hasAddress = getFirstField(component, ["address", "mapEmbedUrl"]);
  const hasForm = getFirstField(component, ["formTitle", "submitLabel"]);

  if (hasFaqItems && component.name.toLowerCase().includes("faq")) {
    return {
      faqItems: [
        {
          question: `What does ${location} include?`,
          answer:
            "It includes governed structure, clearer messaging and reusable content patterns aligned to enterprise standards.",
        },
        {
          question: "How is consistency maintained?",
          answer:
            "Consistency is maintained through approved block types, locked design rules and approval controls.",
        },
        {
          question: "Can this be reused across pages?",
          answer:
            "Yes. Once approved, this block type can be reused wherever the template and governance rules allow it.",
        },
      ],
    };
  }

  if (hasStats) {
    return {
      stats: [
        { label: "Governed Components", value: "350+" },
        { label: "Regions Supported", value: "42" },
        { label: "Reusable Templates", value: "120+" },
      ],
    };
  }

  if (hasLogos) {
    return {
      logos: [
        { name: `${location} Partner 1` },
        { name: `${location} Partner 2` },
        { name: `${location} Partner 3` },
        { name: `${location} Partner 4` },
      ],
    };
  }

  if (hasQuote) {
    return {
      quote: `“${location} helped bring more consistency, confidence and clarity to our digital experience.”`,
      authorName: "Jane Smith",
      authorRole: "Marketing Director",
      company: location,
    };
  }

  if (hasAddress) {
    return {
      address: "123 Example Street, London, United Kingdom",
      mapEmbedUrl: "https://maps.google.com",
      primaryCtaLabel: "Get Directions",
      primaryCtaUrl: "/contact",
    };
  }

  if (hasForm) {
    return {
      formTitle: "Start Your Enquiry",
      submitLabel: "Submit Enquiry",
      primaryCtaLabel: "Contact Us",
      primaryCtaUrl: "/contact",
    };
  }

  if (component.category === "conversion") {
    return {
      primaryCtaLabel: "Speak to an Expert",
      primaryCtaUrl: "/contact",
      secondaryCtaLabel: "Learn More",
      secondaryCtaUrl: "/services",
    };
  }

  return {
    generatedBlockLabel: blockName,
    selectedVariant: componentVariant,
    schemaFields: component.fields.map((field) => field.id),
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as GenerateRequestBody;

  const registry = await getApprovedComponentRegistry();

  const componentType = normaliseText(
    body?.componentId || body?.componentType,
    "hero-standard"
  );

  const component = findComponent(registry, componentType);

  const componentVariant = normaliseText(
    body?.variantId || body?.componentVariant,
    component?.variants[0]?.id || "default"
  );

  const blockName = normaliseText(
    body?.blockName,
    component?.name || "Governed Block"
  );

  const location = normaliseText(body?.location, "Kiwa Agri-Food");

  const prompt = normaliseText(
    body?.prompt,
    `Create a governed ${formatComponentLabel(componentType)} block for ${location}.`
  );

  const pageId = normaliseOptionalText(body?.pageId);
  const pageName = normaliseOptionalText(body?.pageName);
  const sectionId = normaliseOptionalText(body?.sectionId);
  const sectionLabel = normaliseOptionalText(body?.sectionLabel);
  const sectionKey = normaliseOptionalText(body?.sectionKey);
  const templateName = normaliseOptionalText(body?.templateName);

  const contentLength: ContentLength =
    body?.contentLength === "Short" ||
    body?.contentLength === "Standard" ||
    body?.contentLength === "Detailed"
      ? body.contentLength
      : "Standard";

  const imageSourceMode: ImageSourceMode =
    body?.imageSourceMode === "none" ||
    body?.imageSourceMode === "upload" ||
    body?.imageSourceMode === "gallery"
      ? body.imageSourceMode
      : "none";

  const blockData: BlockData = {
    componentType,
    componentVariant,
    pageId,
    pageName,
    sectionId,
    sectionLabel,
    sectionKey,
    templateName,
    generatedFromPrompt: prompt,
    contentLength,
    imageSourceMode,
    eyebrow: buildEyebrow({
      location,
      component,
      sectionLabel,
    }),
    headline: buildHeadline({
      blockName,
      component,
    }),
    subheading: buildSubheading({
      component,
      location,
      prompt,
      contentLength,
    }),
    imageUrl: buildImageUrl({
      component,
      imageSourceMode,
    }),
    valuePoints: buildValuePoints({
      component,
      location,
      contentLength,
    }),
    design: buildDesign({
      component,
      variantId: componentVariant,
      prompt,
    }),
    extraContent: buildExtraContent({
      component,
      componentVariant,
      location,
      blockName,
    }),
  };

  return NextResponse.json({
    ok: true,
    blockData,
    notes: [
      "Mock output generated successfully.",
      `Component type used: ${componentType}`,
      `Component variant used: ${componentVariant}`,
      component
        ? `Schema matched: ${component.name}`
        : "Schema match unavailable; fallback generation used.",
      `Content length used: ${contentLength}`,
      `Image source mode used: ${imageSourceMode}`,
    ],
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST to this endpoint" });
}