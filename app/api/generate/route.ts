import { NextResponse } from "next/server";
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

function isHeroComponent(componentType: string) {
  return componentType.includes("hero");
}

function isValuePointsComponent(componentType: string) {
  return (
    componentType.includes("value-points") ||
    componentType.includes("feature") ||
    componentType.includes("benefit")
  );
}

function isTestimonialComponent(componentType: string) {
  return componentType.includes("testimonial") || componentType.includes("quote");
}

function isCtaComponent(componentType: string) {
  return componentType.includes("cta");
}

function isStatsComponent(componentType: string) {
  return componentType.includes("stats");
}

function isLogoComponent(componentType: string) {
  return componentType.includes("logo");
}

function isFaqComponent(componentType: string) {
  return componentType.includes("faq");
}

function isContactComponent(componentType: string) {
  return componentType.includes("contact");
}

function isRichTextComponent(componentType: string) {
  return componentType.includes("rich-text");
}

function isMediaTextComponent(componentType: string) {
  return componentType.includes("media-text");
}

function getPromptSignals(prompt: string) {
  const lower = prompt.toLowerCase();

  return {
    enterprise: [
      "enterprise",
      "corporate",
      "professional",
      "high-level",
      "strategic",
    ].some((term) => lower.includes(term)),
    conversion: [
      "conversion",
      "cta",
      "action",
      "lead",
      "enquiry",
      "contact",
      "commercial",
    ].some((term) => lower.includes(term)),
    trust: [
      "trust",
      "credible",
      "credibility",
      "proof",
      "assurance",
      "confidence",
    ].some((term) => lower.includes(term)),
    concise: ["short", "concise", "tight", "brief", "minimal"].some((term) =>
      lower.includes(term)
    ),
  };
}

function buildEyebrow(params: {
  location: string;
  componentType: string;
  sectionLabel?: string;
}) {
  const { location, componentType, sectionLabel } = params;

  if (sectionLabel) {
    return sectionLabel.toUpperCase();
  }

  if (isTestimonialComponent(componentType)) return "CLIENT PROOF";
  if (isCtaComponent(componentType)) return "NEXT STEP";
  if (isStatsComponent(componentType)) return "KEY FIGURES";
  if (isLogoComponent(componentType)) return "TRUSTED BY";
  if (isFaqComponent(componentType)) return "COMMON QUESTIONS";
  if (isContactComponent(componentType)) return "GET IN TOUCH";

  return location.toUpperCase();
}

function getVariantHeadline(params: {
  blockName: string;
  componentType: string;
  componentVariant: string;
}) {
  const { blockName, componentType } = params;

  if (isTestimonialComponent(componentType)) {
    return blockName || "What Clients Value Most";
  }

  if (isCtaComponent(componentType)) {
    return blockName || "Take the Next Step";
  }

  if (isStatsComponent(componentType)) {
    return blockName || "Performance at a Glance";
  }

  if (isLogoComponent(componentType)) {
    return blockName || "Trusted by Leading Organisations";
  }

  if (isFaqComponent(componentType)) {
    return blockName || "Frequently Asked Questions";
  }

  if (isContactComponent(componentType)) {
    return blockName || "Speak to Our Team";
  }

  if (componentType.includes("feature")) {
    return blockName || "What This Includes";
  }

  if (isRichTextComponent(componentType)) {
    return blockName || "Supporting Information";
  }

  return blockName;
}

function getVariantSubheading(params: {
  componentType: string;
  componentVariant: string;
  location: string;
  prompt: string;
  blockName: string;
  contentLength: ContentLength;
}) {
  const {
    componentType,
    componentVariant,
    location,
    prompt,
    blockName,
    contentLength,
  } = params;

  const signals = getPromptSignals(prompt);

  if (componentType === "hero-standard" && componentVariant === "centered") {
    if (signals.enterprise) {
      return `Introduce ${location} with a clear, enterprise-ready message that builds confidence, strengthens positioning, and aligns to governed brand standards.`;
    }

    return `Build trust and clarity across ${location} with a structured, brand-governed hero section designed to introduce the page with confidence and focus.`;
  }

  if (
    componentType === "hero-standard" &&
    componentVariant === "left-content-right-image"
  ) {
    if (signals.conversion) {
      return `Introduce ${location} with a strong proposition, clear supporting context, and a focused CTA designed to move high-intent users forward with confidence.`;
    }

    return `Introduce ${location} with a strong message, supporting context, and a clear CTA using a split hero layout designed for high-visibility service and solution pages.`;
  }

  if (componentType === "value-points-grid" && componentVariant === "three-up") {
    return `Communicate the strongest differentiators for ${location} in a concise three-column structure that is easy to scan and aligned to enterprise content governance.`;
  }

  if (componentType === "value-points-grid" && componentVariant === "four-up") {
    return `Showcase four clear value points for ${location} in a structured grid layout that balances clarity, consistency, and brand control.`;
  }

  if (isTestimonialComponent(componentType)) {
    return `Support ${blockName || location} with concise proof-led content designed to reinforce trust, credibility, and buyer confidence.`;
  }

  if (isCtaComponent(componentType)) {
    return `Create a focused call-to-action section for ${location} that encourages the next step while remaining aligned to brand and governance standards.`;
  }

  if (isStatsComponent(componentType)) {
    return `Present key figures for ${location} in a clear, high-trust format designed to support credibility and fast understanding.`;
  }

  if (isLogoComponent(componentType)) {
    return `Display trusted brand associations for ${location} in a lightweight proof section designed to support reassurance and authority.`;
  }

  if (isFaqComponent(componentType)) {
    return `Address common questions around ${location} in a clear, structured format designed to reduce friction and improve understanding.`;
  }

  if (isContactComponent(componentType)) {
    return `Create a conversion-focused contact section for ${location} that encourages enquiries while staying aligned to governance and brand standards.`;
  }

  if (componentType.includes("feature")) {
    return `Present the key capabilities of ${location} in a structured feature format that is easy to scan and aligned to enterprise content standards.`;
  }

  if (isRichTextComponent(componentType)) {
    return `Provide clear supporting information for ${location} in a structured editorial format designed for readability and brand consistency.`;
  }

  if (isMediaTextComponent(componentType)) {
    return `Combine supporting media and clear explanatory content for ${location} in a flexible section designed for clarity and consistency.`;
  }

  if (contentLength === "Short") {
    return `Present ${location} clearly in a concise, governed content block designed for fast comprehension.`;
  }

  if (contentLength === "Detailed") {
    return `Present ${location} in a more detailed, structured content block that balances clarity, trust, and enterprise-ready consistency.`;
  }

  return `From accredited certification to tailored technical support, ${location} gives you confidence in compliance, credibility and business growth.`;
}

function buildValuePoints(params: {
  componentType: string;
  componentVariant: string;
  location: string;
  prompt: string;
  contentLength: ContentLength;
}): ValuePoint[] {
  const { componentType, componentVariant, location, prompt, contentLength } =
    params;

  const signals = getPromptSignals(prompt);

  const basePoints: ValuePoint[] = [
    {
      title: "Independent and trusted",
      text: `Position ${location} with clear, high-confidence messaging that supports enterprise trust and buyer assurance.`,
      accent: "blue",
    },
    {
      title: "Structured for clarity",
      text: "Use governed layouts and concise content patterns to make complex propositions easier to understand.",
      accent: "green",
    },
    {
      title: "Aligned to governance",
      text: "Keep copy, layout and presentation within the rules of the brand system and organisational standards.",
      accent: "orange",
    },
    {
      title: "Designed to scale",
      text: "Create repeatable, reusable sections that work across templates, teams and future page evolution.",
      accent: "purple",
    },
  ];

  if (componentType === "value-points-grid" && componentVariant === "three-up") {
    return basePoints.slice(0, 3);
  }

  if (isHeroComponent(componentType)) {
    return [
      {
        title: signals.trust ? "Built for confidence" : "High-visibility structure",
        text: "A strong opening pattern designed for top-of-page placement and immediate clarity.",
        accent: "blue",
      },
      {
        title: signals.enterprise
          ? "Enterprise-ready messaging"
          : "Structured for clarity",
        text: "Built to support trust, consistency and clearer decision-making across complex service offerings.",
        accent: "green",
      },
      {
        title: "Brand-governed output",
        text: "Structured to stay aligned with approved language, layouts and design tokens.",
        accent: "orange",
      },
      {
        title: "Reusable across templates",
        text: "Designed to scale across regions, services and page types without fragmenting the experience.",
        accent: "purple",
      },
    ];
  }

  if (isTestimonialComponent(componentType)) {
    return [
      {
        title: "Trusted experience",
        text: "Highlights confidence, consistency and positive delivery experience through proof-led messaging.",
        accent: "blue",
      },
      {
        title: "Stronger reassurance",
        text: "Supports buying confidence with concise, high-trust validation.",
        accent: "green",
      },
      {
        title: "Governed presentation",
        text: "Keeps proof content aligned to brand, tone and approved design standards.",
        accent: "orange",
      },
    ];
  }

  if (isCtaComponent(componentType) || isContactComponent(componentType)) {
    return [
      {
        title: "Clear next step",
        text: "Moves users toward action with a stronger, more deliberate call-to-action.",
        accent: "blue",
      },
      {
        title: "Focused messaging",
        text: "Removes distraction and keeps the section aligned to a single objective.",
        accent: "green",
      },
      {
        title: "Consistent conversion pattern",
        text: "Applies a repeatable, governed CTA format that works across templates and regions.",
        accent: "orange",
      },
    ];
  }

  if (isStatsComponent(componentType)) {
    return [
      {
        title: "Proof at a glance",
        text: "Makes key figures easier to understand and faster to scan.",
        accent: "blue",
      },
      {
        title: "Stronger credibility",
        text: "Uses measurable indicators to support confidence and reassurance.",
        accent: "green",
      },
      {
        title: "Reusable trust pattern",
        text: "Provides a governed way to repeat performance messaging across the site.",
        accent: "orange",
      },
    ];
  }

  if (isLogoComponent(componentType)) {
    return [
      {
        title: "Recognisable brands",
        text: "Reinforces trust through familiar organisations, partners or accreditations.",
        accent: "blue",
      },
      {
        title: "Fast reassurance",
        text: "Adds immediate confidence without requiring long-form explanation.",
        accent: "green",
      },
      {
        title: "Lightweight proof",
        text: "Provides a subtle, reusable trust pattern across key journeys.",
        accent: "orange",
      },
    ];
  }

  if (isFaqComponent(componentType)) {
    return [
      {
        title: "Reduced friction",
        text: "Answers likely objections before they slow down decision-making.",
        accent: "blue",
      },
      {
        title: "Clearer understanding",
        text: "Presents complex information in a simple, structured format.",
        accent: "green",
      },
      {
        title: "Governed consistency",
        text: "Keeps answers aligned to approved messaging and brand tone.",
        accent: "orange",
      },
    ];
  }

  if (contentLength === "Short") {
    return basePoints.slice(0, 3);
  }

  return basePoints;
}

function buildDesign(params: {
  componentType: string;
  componentVariant: string;
  prompt: string;
}): BlockData["design"] {
  const { componentType, componentVariant, prompt } = params;
  const signals = getPromptSignals(prompt);

  const baseDesign: BlockData["design"] = {
    theme: signals.enterprise ? "enterprise" : "soft",
    layout: "split",
    cardStyle: "soft",
    headingAlign: "left",
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

  if (componentType === "hero-standard" && componentVariant === "centered") {
    return {
      ...baseDesign,
      layout: "stacked",
      headingAlign: "center",
    };
  }

  if (componentType === "hero-standard") {
    return {
      ...baseDesign,
      layout: "split",
      headingAlign: "left",
    };
  }

  if (
    isValuePointsComponent(componentType) ||
    isStatsComponent(componentType) ||
    isFaqComponent(componentType) ||
    isLogoComponent(componentType)
  ) {
    return {
      ...baseDesign,
      layout: "stacked",
      headingAlign: "left",
      cardStyle: "outline",
    };
  }

  if (isTestimonialComponent(componentType)) {
    return {
      ...baseDesign,
      layout: "stacked",
      headingAlign: "left",
      cardStyle: "soft",
    };
  }

  if (isCtaComponent(componentType) || isContactComponent(componentType)) {
    return {
      ...baseDesign,
      layout: "stacked",
      headingAlign: signals.conversion ? "center" : "left",
      cardStyle: "filled",
    };
  }

  if (isRichTextComponent(componentType)) {
    return {
      ...baseDesign,
      layout: "stacked",
      headingAlign: "left",
      cardStyle: "soft",
    };
  }

  if (isMediaTextComponent(componentType)) {
    return {
      ...baseDesign,
      layout: componentVariant.includes("stacked") ? "stacked" : "split",
      headingAlign: "left",
      cardStyle: "soft",
    };
  }

  return baseDesign;
}

function buildImageUrl(params: {
  componentType: string;
  imageSourceMode: ImageSourceMode;
}) {
  const { componentType, imageSourceMode } = params;

  if (imageSourceMode === "none") {
    return undefined;
  }

  if (
    isLogoComponent(componentType) ||
    isStatsComponent(componentType) ||
    isFaqComponent(componentType)
  ) {
    return undefined;
  }

  return "/farmer.jpg";
}

function buildExtraContent(params: {
  componentType: string;
  componentVariant: string;
  location: string;
  blockName: string;
  contentLength: ContentLength;
}): BlockExtraContent | undefined {
  const { componentType, componentVariant, location, blockName } = params;

  if (isTestimonialComponent(componentType)) {
    return {
      quote: `“${location} helped bring more consistency, confidence and clarity to our digital experience.”`,
      authorName: "Jane Smith",
      authorRole: "Marketing Director",
      company: location,
    };
  }

  if (isCtaComponent(componentType)) {
    return {
      primaryCtaLabel: "Speak to an Expert",
      primaryCtaUrl: "/contact",
      secondaryCtaLabel: "Learn More",
      secondaryCtaUrl: "/services",
    };
  }

  if (isContactComponent(componentType)) {
    return {
      formTitle: "Start Your Enquiry",
      submitLabel: "Submit Enquiry",
      primaryCtaLabel: "Contact Us",
      primaryCtaUrl: "/contact",
    };
  }

  if (isStatsComponent(componentType)) {
    return {
      stats: [
        { label: "Projects Delivered", value: "120+" },
        { label: "Regions Supported", value: "42" },
        { label: "Governed Components", value: "350+" },
      ],
    };
  }

  if (isLogoComponent(componentType)) {
    return {
      logos: [
        { name: `${location} Partner 1` },
        { name: `${location} Partner 2` },
        { name: `${location} Partner 3` },
        { name: `${location} Partner 4` },
      ],
    };
  }

  if (isFaqComponent(componentType)) {
    return {
      faqItems: [
        {
          question: `What does ${location} include?`,
          answer:
            "It includes a governed structure, clearer messaging, and reusable content patterns aligned to enterprise standards.",
        },
        {
          question: "How quickly can this be deployed?",
          answer:
            "Deployment timing depends on workflow stage, approvals, and the publishing destination, but the structure is designed to accelerate delivery.",
        },
        {
          question: "How is consistency maintained?",
          answer:
            "Consistency is maintained through governed component structures, locked design tokens, and approval controls.",
        },
      ],
    };
  }

  if (isRichTextComponent(componentType)) {
    return {
      body: `This supporting section gives additional context for ${location} in a clean, readable editorial format.`,
    };
  }

  if (isMediaTextComponent(componentType)) {
    return {
      body: `This section combines supporting media and explanatory content for ${location} to improve clarity and engagement.`,
      primaryCtaLabel: "Learn More",
      primaryCtaUrl: "/services",
    };
  }

  if (isValuePointsComponent(componentType)) {
    return {
      sectionHeading: blockName,
    };
  }

  return {
    generatedBlockLabel: blockName,
    selectedVariant: componentVariant,
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as GenerateRequestBody;

  const blockName = normaliseText(body?.blockName, "Why Choose Kiwa Agri-Food");
  const location = normaliseText(body?.location, "Kiwa Agri-Food");
  const componentType = normaliseText(body?.componentType, "hero-standard");
  const componentVariant = normaliseText(
    body?.componentVariant,
    "left-content-right-image"
  );
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
      componentType,
      sectionLabel,
    }),
    headline: getVariantHeadline({
      blockName,
      componentType,
      componentVariant,
    }),
    subheading: getVariantSubheading({
      componentType,
      componentVariant,
      location,
      prompt,
      blockName,
      contentLength,
    }),
    imageUrl: buildImageUrl({
      componentType,
      imageSourceMode,
    }),
    valuePoints: buildValuePoints({
      componentType,
      componentVariant,
      location,
      prompt,
      contentLength,
    }),
    design: buildDesign({
      componentType,
      componentVariant,
      prompt,
    }),
    extraContent: buildExtraContent({
      componentType,
      componentVariant,
      location,
      blockName,
      contentLength,
    }),
  };

  return NextResponse.json({
    ok: true,
    blockData,
    notes: [
      "Mock output generated successfully.",
      `Component type used: ${componentType}`,
      `Component variant used: ${componentVariant}`,
      `Content length used: ${contentLength}`,
      `Image source mode used: ${imageSourceMode}`,
    ],
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST to this endpoint" });
}