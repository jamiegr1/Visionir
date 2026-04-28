"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import Generating from "./_components/Generating";
import type { BlockData } from "@/lib/types";
import { hasPermission, type Role } from "@/lib/permissions";

type Step = "context" | "block_type" | "instructions" | "generating";
type ImageSourceMode = "none" | "upload" | "gallery";

type GenerateResponse = {
  name?: string;
  blockData?: BlockData;
  css?: string;
  notes?: string[];
};

type BlockVariant = {
  id: string;
  name: string;
  description: string;
};

type BlockTypeOption = {
  id: string;
  name: string;
  category: string;
  description: string;
  bestFor: string;
  variants: BlockVariant[];
};

const blockTypeOptions: BlockTypeOption[] = [
  // HERO
  {
    id: "hero",
    name: "Hero",
    category: "Conversion",
    description: "Primary above-the-fold section introducing the page.",
    bestFor: "Landing pages, homepages, campaigns",
    variants: [
      { id: "hero-split", name: "Split Layout", description: "Text left, image right." },
      { id: "hero-centered", name: "Centered", description: "Headline and CTA centered." },
      { id: "hero-video", name: "With Video", description: "Hero with embedded video." },
      { id: "hero-minimal", name: "Minimal", description: "Clean, text-focused hero." },
    ],
  },

  // FEATURES / WHY
  {
    id: "features",
    name: "Features / Benefits",
    category: "Content",
    description: "Highlights key benefits or product features.",
    bestFor: "Product pages, services, SaaS",
    variants: [
      { id: "features-grid", name: "Grid", description: "Multiple feature cards." },
      { id: "features-split", name: "Split + Image", description: "Features with supporting image." },
      { id: "features-list", name: "Stacked List", description: "Vertical list layout." },
      { id: "features-icons", name: "Icon Features", description: "Icon-led feature blocks." },
    ],
  },

  // CTA
  {
    id: "cta",
    name: "Call To Action",
    category: "Conversion",
    description: "Encourages the user to take action.",
    bestFor: "Lead gen, bookings, demos",
    variants: [
      { id: "cta-banner", name: "Full Width Banner", description: "Large horizontal CTA." },
      { id: "cta-card", name: "Card", description: "Contained CTA box." },
      { id: "cta-split", name: "Split Layout", description: "Text + action side by side." },
      { id: "cta-minimal", name: "Minimal", description: "Simple inline CTA." },
    ],
  },

  // FAQ
  {
    id: "faq",
    name: "FAQ",
    category: "Support",
    description: "Answers common customer questions.",
    bestFor: "Service pages, pricing pages",
    variants: [
      { id: "faq-accordion", name: "Accordion", description: "Expandable questions." },
      { id: "faq-two-column", name: "Two Column", description: "Compact layout." },
      { id: "faq-support", name: "Support CTA", description: "FAQs + contact prompt." },
    ],
  },

  // TESTIMONIALS
  {
    id: "testimonials",
    name: "Testimonials",
    category: "Trust",
    description: "Builds credibility using customer proof.",
    bestFor: "Landing pages, case studies",
    variants: [
      { id: "testimonials-carousel", name: "Carousel", description: "Sliding testimonials." },
      { id: "testimonials-grid", name: "Grid", description: "Multiple quotes." },
      { id: "testimonials-featured", name: "Featured", description: "Single large testimonial." },
    ],
  },

  // LOGO CLOUD
  {
    id: "logos",
    name: "Logo Cloud",
    category: "Trust",
    description: "Displays brands or clients.",
    bestFor: "Enterprise credibility",
    variants: [
      { id: "logos-grid", name: "Grid", description: "Simple logo grid." },
      { id: "logos-scroll", name: "Scrolling", description: "Auto-moving logos." },
      { id: "logos-highlight", name: "Highlighted", description: "Featured logos." },
    ],
  },

  // STATS
  {
    id: "stats",
    name: "Statistics / Metrics",
    category: "Proof",
    description: "Highlights key numbers.",
    bestFor: "Enterprise proof, authority",
    variants: [
      { id: "stats-row", name: "Horizontal Row", description: "Inline stats." },
      { id: "stats-cards", name: "Cards", description: "Individual stat cards." },
      { id: "stats-highlight", name: "Highlight", description: "One big stat focus." },
    ],
  },

  // PRICING
  {
    id: "pricing",
    name: "Pricing",
    category: "Conversion",
    description: "Displays pricing tiers or plans.",
    bestFor: "SaaS, services",
    variants: [
      { id: "pricing-cards", name: "Pricing Cards", description: "Standard tier layout." },
      { id: "pricing-comparison", name: "Comparison Table", description: "Side-by-side comparison." },
      { id: "pricing-minimal", name: "Minimal", description: "Simple pricing rows." },
    ],
  },

  // TEAM
  {
    id: "team",
    name: "Team",
    category: "Content",
    description: "Showcases team members.",
    bestFor: "About pages",
    variants: [
      { id: "team-grid", name: "Grid", description: "Multiple team cards." },
      { id: "team-featured", name: "Featured Member", description: "Highlight key person." },
    ],
  },

  // CONTENT / TEXT
  {
    id: "rich-text",
    name: "Text Section",
    category: "Content",
    description: "General purpose text content block.",
    bestFor: "Articles, descriptions",
    variants: [
      { id: "text-single", name: "Single Column", description: "Standard text." },
      { id: "text-two-col", name: "Two Column", description: "Split content." },
    ],
  },

  // MEDIA
  {
    id: "media",
    name: "Image / Media",
    category: "Media",
    description: "Displays images or video.",
    bestFor: "Visual storytelling",
    variants: [
      { id: "media-full", name: "Full Width", description: "Edge-to-edge media." },
      { id: "media-gallery", name: "Gallery", description: "Multiple images." },
      { id: "media-split", name: "Split Media", description: "Media + text." },
    ],
  },

  // FORM
  {
    id: "form",
    name: "Form",
    category: "Conversion",
    description: "Collects user input.",
    bestFor: "Lead generation",
    variants: [
      { id: "form-simple", name: "Simple Form", description: "Basic fields." },
      { id: "form-split", name: "Split Layout", description: "Form + content." },
    ],
  },

  // BLOG / ARTICLES
  {
    id: "articles",
    name: "Articles / Blog",
    category: "Content",
    description: "Displays posts or resources.",
    bestFor: "Content marketing",
    variants: [
      { id: "articles-grid", name: "Grid", description: "Card layout." },
      { id: "articles-list", name: "List", description: "Vertical list." },
    ],
  },

  // STEPS / PROCESS
  {
    id: "steps",
    name: "Process / Steps",
    category: "Content",
    description: "Explains a process or journey.",
    bestFor: "How it works",
    variants: [
      { id: "steps-horizontal", name: "Horizontal Steps", description: "Step-by-step row." },
      { id: "steps-vertical", name: "Vertical Steps", description: "Stacked steps." },
    ],
  },

  // TIMELINE
  {
    id: "timeline",
    name: "Timeline",
    category: "Content",
    description: "Shows chronological events.",
    bestFor: "Company history",
    variants: [
      { id: "timeline-vertical", name: "Vertical Timeline", description: "Standard timeline." },
      { id: "timeline-horizontal", name: "Horizontal Timeline", description: "Side scrolling." },
    ],
  },

  // CONTACT
  {
    id: "contact",
    name: "Contact",
    category: "Conversion",
    description: "Contact details or location.",
    bestFor: "Contact pages",
    variants: [
      { id: "contact-details", name: "Details", description: "Basic contact info." },
      { id: "contact-map", name: "Map + Info", description: "Map with contact details." },
    ],
  },
];

const progressLabels = [
  "Analysing prompt...",
  "Applying governance...",
  "Validating accessibility...",
  "Generating layout structure...",
  "Rendering preview...",
  "Finalising block...",
];

const governanceChecks = [
  "Enforce Brand Typography",
  "Enforce Colour System",
  "Enforce Spacing Guidelines",
  "Enforce WCAG AA Accessibility",
  "Optimise for Core Web Vitals",
  "Language & Tone",
  "Validate Semantic HTML Structure",
  "Ensure Mobile Responsiveness",
  "Asset Performance Optimisation",
];

const contentLengthOptions = ["Short", "Standard", "Detailed"];
const MIN_GENERATION_TIME_MS = 5000;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isRole(value: string | null): value is Role {
  return value === "creator" || value === "approver" || value === "admin";
}

function normaliseComponentId(value: string | null) {
  if (!value) return "";

  const cleaned = value.trim().toLowerCase();

  const aliases: Record<string, string> = {
    testimonial: "testimonials",
    testimonials: "testimonials",
    "logo-cloud": "logos",
    logos: "logos",
    logo: "logos",
    stat: "stats",
    statistics: "stats",
    metrics: "stats",
    "statistics-metrics": "stats",
    feature: "features",
    benefits: "features",
    "features-benefits": "features",
    text: "rich-text",
    "text-section": "rich-text",
    article: "articles",
    blog: "articles",
    "articles-blog": "articles",
    process: "steps",
    "process-steps": "steps",
    "call-to-action": "cta",
    contact: "contact",
    hero: "hero",
    faq: "faq",
    pricing: "pricing",
    team: "team",
    media: "media",
    form: "form",
    timeline: "timeline",
  };

  return aliases[cleaned] || cleaned;
}

function getStepNumber(step: Step): 1 | 2 | 3 {
  if (step === "context") return 1;
  if (step === "block_type") return 2;
  return 3;
}

function TopBar({ title, stepLabel }: { title: string; stepLabel: string }) {
  return (
    <div className="sticky top-0 z-40 shrink-0 border-b border-[#e8ebf3] bg-[#f6f7fb]/95 px-8 py-4 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#edf0f6] bg-white text-[#98a1ba] transition hover:text-slate-700"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 7h14M5 12h14M5 17h14" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-[17px] font-semibold tracking-[-0.02em] text-[#111827] md:text-[18px]">
              {title}
            </h1>
            <span className="text-[#b8c0d6]">•</span>
            <span className="text-[13px] font-medium text-[#7d859d]">
              {stepLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressHeader({
  currentStep,
  title,
  subtitle,
}: {
  currentStep: 1 | 2 | 3;
  title: string;
  subtitle: string;
}) {
  const percent = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;

  return (
    <div className="mb-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <div className="text-[20px] font-semibold tracking-[-0.03em] text-[#111827]">
            {title}
          </div>
          <p className="mt-1 text-[13px] text-[#7d859d]">{subtitle}</p>
        </div>

        <div className="shrink-0 rounded-full border border-[#ebeef5] bg-[#fafbfc] px-3 py-1.5 text-[12px] font-medium text-[#7b849d]">
          Step {currentStep} of 3
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-[#e6eaf2]">
          <div
            className="h-full rounded-full bg-[#3F5FF0] transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        <span className="text-[12px] font-medium text-[#98a1ba]">
          {percent}%
        </span>
      </div>
    </div>
  );
}

function FormRow({
  label,
  children,
  multiline = false,
  helper,
}: {
  label: string;
  children: React.ReactNode;
  multiline?: boolean;
  helper?: string;
}) {
  return (
    <div className={cx("border-t border-[#e9edf5] px-6 first:border-t-0", multiline ? "py-4" : "py-3")}>
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="text-[14px] font-medium text-[#20263a]">{label}</div>
        {helper ? <div className="text-[12px] font-medium text-[#98a1ba]">{helper}</div> : null}
      </div>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-[#e3e7f2] bg-[#fafbff] px-4 py-3 text-[14px] font-medium text-[#2c3348] outline-none transition placeholder:text-[#b6bdd2] hover:border-[#d2d8ea] focus:border-[#5b7cff] focus:bg-white focus:shadow-[0_0_0_4px_rgba(91,124,255,0.08)]"
    />
  );
}

function SegmentedOptions({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => {
        const selected = value === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cx(
              "rounded-xl border px-4 py-3 text-center text-[13px] font-semibold transition-all duration-200",
              selected
                ? "border-[#3F5FF0] bg-[#eef2ff] text-[#2e4fd3]"
                : "border-[#e3e7f2] bg-[#fafbff] text-[#55607d] hover:border-[#cfd6eb] hover:bg-white"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function ImageSourceSelector({
  mode,
  setMode,
  uploadedFileName,
  onFileChange,
}: {
  mode: ImageSourceMode;
  setMode: (mode: ImageSourceMode) => void;
  uploadedFileName: string;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {(["none", "upload", "gallery"] as ImageSourceMode[]).map((item) => {
        const selected = mode === item;
        const title =
          item === "none"
            ? "No Image"
            : item === "upload"
              ? "Upload Brand Image"
              : "Auto Select From Brand Gallery";

        const description =
          item === "none"
            ? "Generate this block without an accompanying image."
            : item === "upload"
              ? "Use a supplied brand image for the generated block."
              : "Automatically select the most suitable image from your brand gallery.";

        if (item === "upload") {
          return (
            <div
              key={item}
              onClick={() => setMode("upload")}
              className={cx(
                "flex cursor-pointer items-start justify-between gap-3 rounded-[16px] border px-4 py-3 transition-all",
                selected ? "border-[#5b7cff] bg-[#f4f7ff]" : "border-[#e6eaf3] bg-white hover:border-[#d7def1] hover:bg-[#fafbff]"
              )}
            >
              <div className="w-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-semibold text-[#20263a]">{title}</div>
                    <p className="mt-1.5 text-[11px] leading-4 text-[#7d859d]">{description}</p>
                  </div>

                  <span className={cx("mt-0.5 h-4 w-4 shrink-0 rounded-full border transition-all", selected ? "border-[#5b7cff] bg-[#5b7cff] shadow-[inset_0_0_0_4px_white]" : "border-[#cbd4ea] bg-white")} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <label
                    className={cx(
                      "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-all",
                      selected ? "border-[#5b7cff] bg-[#5b7cff] text-white hover:bg-[#496bf4]" : "border-[#d9deea] bg-[#f7f9fc] text-[#4f5d7b] hover:bg-[#eef2f8]"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                    />
                  </label>

                  <div className="text-[11px] font-medium text-[#8d96af]">
                    {uploadedFileName || "No file selected"}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={cx(
              "flex items-start justify-between gap-3 rounded-[16px] border px-4 py-3 text-left transition-all",
              selected ? "border-[#5b7cff] bg-[#f4f7ff]" : "border-[#e6eaf3] bg-white hover:border-[#d7def1] hover:bg-[#fafbff]"
            )}
          >
            <div>
              <div className="text-[13px] font-semibold text-[#20263a]">{title}</div>
              <p className="mt-1.5 text-[11px] leading-4 text-[#7d859d]">{description}</p>
            </div>

            <span className={cx("mt-0.5 h-4 w-4 shrink-0 rounded-full border transition-all", selected ? "border-[#5b7cff] bg-[#5b7cff] shadow-[inset_0_0_0_4px_white]" : "border-[#cbd4ea] bg-white")} />
          </button>
        );
      })}
    </div>
  );
}

function VariantPreview({ variantId }: { variantId: string }) {
  const card = "rounded-md bg-white shadow-sm ring-1 ring-slate-200";

  if (variantId === "faq-accordion") {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((item) => (
          <div key={item} className={`${card} px-3 py-2`}>
            <div className="flex items-center justify-between">
              <div className="h-2 w-20 rounded-full bg-slate-300" />
              <div className="h-4 w-4 rounded-full bg-[#5b7cff]/20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variantId === "faq-two-column") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className={`${card} p-2`}>
            <div className="mb-2 h-2 w-14 rounded-full bg-slate-300" />
            <div className="h-2 w-full rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  if (variantId === "faq-support") {
    return (
      <div className="grid grid-cols-[1.3fr_0.8fr] gap-2">
        <div className="space-y-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className={`${card} px-3 py-2`}>
              <div className="h-2 w-20 rounded-full bg-slate-300" />
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-[#5b7cff]/15 p-3 ring-1 ring-[#5b7cff]/20">
          <div className="mb-2 h-2 w-12 rounded-full bg-[#5b7cff]/50" />
          <div className="h-6 rounded-lg bg-white" />
        </div>
      </div>
    );
  }

  if (variantId.includes("split")) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-full bg-slate-400" />
          <div className="h-2 w-full rounded-full bg-slate-300" />
          <div className="h-2 w-4/5 rounded-full bg-slate-200" />
          <div className="mt-3 h-7 w-20 rounded-lg bg-[#5b7cff]" />
        </div>
        <div className={`${card} h-full rounded-xl`} />
      </div>
    );
  }

  if (variantId.includes("centered") || variantId.includes("banner")) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-2 h-2 w-16 rounded-full bg-[#5b7cff]/50" />
        <div className="mb-2 h-3 w-32 rounded-full bg-slate-400" />
        <div className="mb-4 h-2 w-40 rounded-full bg-slate-300" />
        <div className="h-7 w-24 rounded-lg bg-[#5b7cff]" />
      </div>
    );
  }

  if (variantId.includes("stacked") || variantId.includes("editorial")) {
    return (
      <div className="space-y-3">
        <div>
          <div className="mb-2 h-3 w-32 rounded-full bg-slate-400" />
          <div className="h-2 w-44 rounded-full bg-slate-300" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className={`${card} h-10`} />
          ))}
        </div>
      </div>
    );
  }

  if (variantId.includes("grid") || variantId.includes("cards")) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className={`${card} p-2`}>
            <div className="mb-2 h-2 w-14 rounded-full bg-slate-300" />
            <div className="h-2 w-full rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  if (variantId.includes("numbered") || variantId.includes("horizontal")) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className={`${card} p-2 text-center`}>
            <div className="mx-auto mb-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#5b7cff] text-[9px] font-bold text-white">
              {item}
            </div>
            <div className="mx-auto h-2 w-10 rounded-full bg-slate-300" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {[0, 1, 2].map((item) => (
        <div key={item} className={`${card} h-12`} />
      ))}
    </div>
  );
}

function BlockTypeSelector({
  selectedBlockTypeId,
  selectedVariantId,
  onSelectBlockType,
  onSelectVariant,
  lockedBlockType,
}: {
  selectedBlockTypeId: string;
  selectedVariantId: string;
  onSelectBlockType: (id: string) => void;
  onSelectVariant: (id: string) => void;
  lockedBlockType?: boolean;
}) {
  const [view, setView] = useState<"types" | "variants">(
    lockedBlockType ? "variants" : "types"
  );

  const selectedBlockType =
    blockTypeOptions.find((item) => item.id === selectedBlockTypeId) ||
    blockTypeOptions[0];

  function selectType(id: string) {
    onSelectBlockType(id);
    setView("variants");
  }

  if (view === "variants") {
    return (
      <div className="rounded-[24px] border border-[#e8ecf4] bg-white p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
          {!lockedBlockType ? (
  <button
    type="button"
    onClick={() => setView("types")}
    className="mb-3 text-[13px] font-semibold text-[#5b7cff]"
  >
    ← Back to block types
  </button>
) : null}

            <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#5b7cff]">
              Selected type
            </div>

            <h3 className="mt-1 text-[24px] font-semibold tracking-[-0.04em] text-[#111827]">
              {selectedBlockType.name}
            </h3>

            <p className="mt-2 max-w-[680px] text-[13px] leading-6 text-[#7d859d]">
              {selectedBlockType.bestFor}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {selectedBlockType.variants.map((variant) => {
            const selected = selectedVariantId === variant.id;

            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => onSelectVariant(variant.id)}
                className={cx(
                  "overflow-hidden rounded-[22px] border text-left transition-all",
                  selected
                    ? "border-[#5b7cff] bg-[#f4f7ff] shadow-[0_14px_34px_rgba(63,95,240,0.12)]"
                    : "border-[#e5e9f2] bg-[#fafbff] hover:border-[#cfd6eb] hover:bg-white"
                )}
              >
                <div className="h-[190px] border-b border-[#e8ecf4] bg-white p-5">
                  <div
                    className={cx(
                      "flex h-full items-center justify-center rounded-[18px] bg-[#f0f3fb] p-5 transition-all duration-300",
                      selected && "bg-[#eef3ff] ring-2 ring-[#5b7cff]/20"
                    )}
                  >
                    <div className="w-full max-w-[260px]">
                      <VariantPreview variantId={variant.id} />
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[15px] font-semibold text-[#20263a]">
                      {variant.name}
                    </div>

                    <span
                      className={cx(
                        "mt-0.5 h-4 w-4 shrink-0 rounded-full border",
                        selected
                          ? "border-[#5b7cff] bg-[#5b7cff] shadow-[inset_0_0_0_4px_white]"
                          : "border-[#cbd4ea] bg-white"
                      )}
                    />
                  </div>

                  <p className="mt-2 text-[12px] leading-5 text-[#7d859d]">
                    {variant.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-[18px] border border-[#e8ecf4] bg-[#fafbff] px-4 py-3">
          <div className="text-[12px] font-semibold text-[#20263a]">
            Selected generation structure
          </div>
          <p className="mt-1 text-[12px] text-[#7d859d]">
            {selectedBlockType.name} /{" "}
            {selectedBlockType.variants.find(
              (item) => item.id === selectedVariantId
            )?.name || "No variant selected"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-[#e8ecf4] bg-white p-5">
      <div className="grid grid-cols-3 gap-4">
        {blockTypeOptions.map((option) => {
          const selected = selectedBlockTypeId === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => selectType(option.id)}
              className={cx(
                "min-h-[132px] rounded-[22px] border p-4 text-left transition-all",
                selected
                  ? "border-[#5b7cff] bg-[#f4f7ff] shadow-[0_12px_30px_rgba(63,95,240,0.10)]"
                  : "border-[#edf0f6] bg-[#fafbff] hover:border-[#d7def1] hover:bg-white"
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="text-[16px] font-semibold text-[#20263a]">
                  {option.name}
                </div>

                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5b7cff] ring-1 ring-[#dfe5ff]">
                  {option.category}
                </span>
              </div>

              <p className="text-[13px] leading-6 text-[#7d859d]">
                {option.description}
              </p>

              <p className="mt-4 text-[12px] font-semibold text-[#5b7cff]">
                View variants →
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NewBlockPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return isRole(value) ? value : "admin";
  }, [searchParams]);

  const currentUser = useMemo(() => ({ id: "user-1", role }), [role]);
  const canCreate = hasPermission(currentUser.role, "block.create");
  const pageId = searchParams.get("pageId") || "";
const sectionId = searchParams.get("sectionId") || "";
const pageNameFromUrl = searchParams.get("pageName") || "";
const sectionLabelFromUrl = searchParams.get("sectionLabel") || "";
const sectionKeyFromUrl = searchParams.get("sectionKey") || "";
const lockedComponentIdFromUrl = normaliseComponentId(
  searchParams.get("lockedComponentId") ||
    searchParams.get("defaultComponentId") ||
    sectionKeyFromUrl ||
    sectionLabelFromUrl
);

const isPageBuilderMode = Boolean(pageId && sectionId && lockedComponentIdFromUrl);

  const [step, setStep] = useState<Step>("context");

  const [blockName, setBlockName] = useState("Why Choose Us");
  const [location, setLocation] = useState("Food, Feed & Agriculture");
  const [contentLength, setContentLength] = useState("Standard");

  const initialBlockType =
  blockTypeOptions.find((item) => item.id === lockedComponentIdFromUrl) ||
  blockTypeOptions[0];

const [selectedBlockTypeId, setSelectedBlockTypeId] = useState(initialBlockType.id);
const [selectedVariantId, setSelectedVariantId] = useState(
  initialBlockType.variants[0]?.id || ""
);

  const selectedBlockType = useMemo(
    () => blockTypeOptions.find((item) => item.id === selectedBlockTypeId) || blockTypeOptions[0],
    [selectedBlockTypeId]
  );

  const selectedVariant = useMemo(
    () => selectedBlockType.variants.find((item) => item.id === selectedVariantId) || selectedBlockType.variants[0],
    [selectedBlockType, selectedVariantId]
  );

  useEffect(() => {
    if (!isPageBuilderMode) return;
  
    const lockedType = blockTypeOptions.find(
      (item) => item.id === lockedComponentIdFromUrl
    );
  
    if (!lockedType) return;
  
    setSelectedBlockTypeId(lockedType.id);
    setSelectedVariantId((current) =>
      lockedType.variants.some((variant) => variant.id === current)
        ? current
        : lockedType.variants[0]?.id || ""
    );
  
    if (sectionLabelFromUrl) {
      setBlockName(sectionLabelFromUrl);
      setLocation(pageNameFromUrl || sectionLabelFromUrl);
    }
  }, [
    isPageBuilderMode,
    lockedComponentIdFromUrl,
    sectionLabelFromUrl,
    pageNameFromUrl,
  ]);

  const [imageSourceMode, setImageSourceMode] = useState<ImageSourceMode>("none");
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);

  const [prompt, setPrompt] = useState(
    "Create a professional, conversion-focused block using the selected block type and variant. Maintain a clear hierarchy, concise messaging, strong visual structure and an enterprise-grade tone."
  );

  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState(progressLabels[0]);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (step !== "generating") return;

    const start = performance.now();

    setProgress(0);
    setProgressLabel(progressLabels[0]);

    const interval = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const rawProgress = Math.min((elapsed / MIN_GENERATION_TIME_MS) * 100, 99);

      setProgress(rawProgress);

      if (rawProgress < 15) setProgressLabel(progressLabels[0]);
      else if (rawProgress < 32) setProgressLabel(progressLabels[1]);
      else if (rawProgress < 50) setProgressLabel(progressLabels[2]);
      else if (rawProgress < 70) setProgressLabel(progressLabels[3]);
      else if (rawProgress < 88) setProgressLabel(progressLabels[4]);
      else setProgressLabel(progressLabels[5]);
    }, 100);

    return () => window.clearInterval(interval);
  }, [step]);

  function handleSelectBlockType(id: string) {
    const nextType = blockTypeOptions.find((item) => item.id === id);
    if (!nextType) return;

    setSelectedBlockTypeId(nextType.id);
    setSelectedVariantId(nextType.variants[0]?.id || "");
  }

  function handleContextContinue() {
    setError(null);
    setStep("block_type");
  }

  function handleBlockTypeContinue() {
    if (!selectedBlockTypeId || !selectedVariantId) {
      setError("Please choose a block type and variant.");
      return;
    }

    setError(null);
    setStep("instructions");
  }

  function handleBack() {
    setError(null);

    if (step === "instructions") {
      setStep("block_type");
      return;
    }

    if (step === "block_type") {
      setStep("context");
    }
  }

  async function handleGenerate() {
    if (!canCreate) {
      setError("You do not have permission to create blocks.");
      return;
    }

    setError(null);
    setIsGenerating(true);
    setStep("generating");
    setProgress(0);
    setProgressLabel(progressLabels[0]);

    const minimumDelayPromise = new Promise((resolve) =>
      window.setTimeout(resolve, MIN_GENERATION_TIME_MS)
    );

    try {
      const enrichedPrompt = `
Block Name: ${blockName}
Block Type: ${selectedBlockType.name}
Block Type ID: ${selectedBlockType.id}
Selected Variant: ${selectedVariant.name}
Selected Variant ID: ${selectedVariant.id}
Location / Business Area: ${location}
Content Length: ${contentLength}
Image Source: ${
        imageSourceMode === "none"
          ? "No Image"
          : imageSourceMode === "upload"
            ? uploadedImageFile?.name
              ? `Provided Brand Image (${uploadedImageFile.name})`
              : "Provided Brand Image"
            : "Visionir Brand Gallery Selection"
      }

Generation Request:
${prompt}
      `.trim();

      const generationAndSavePromise = (async () => {
        const generateRes = await fetch(`/api/generate?role=${role}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blockName,
            location,
            category: selectedBlockType.name,
            componentId: selectedBlockType.id,
            variantId: selectedVariant.id,
            pageId,
            sectionId,
            pageName: pageNameFromUrl,
            sectionLabel: sectionLabelFromUrl,
            prompt: enrichedPrompt,
          }),
        });

        const generateJson =
          (await generateRes.json().catch(() => ({}))) as GenerateResponse;

        if (!generateRes.ok || !generateJson?.blockData) {
          throw new Error("Failed to generate block");
        }

        const createRes = await fetch(`/api/blocks?role=${role}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              ...generateJson.blockData,
          
              componentType: selectedBlockType.id,
              componentVariant: selectedVariant.id,
              componentId: selectedBlockType.id,
              variantId: selectedVariant.id,
              componentName: selectedBlockType.name,
              variantName: selectedVariant.name,
          
              pageId,
              sectionId,
              pageName: pageNameFromUrl,
              sectionLabel: sectionLabelFromUrl,
            },
            status: "draft",
          }),
        });

        const createJson = await createRes.json().catch(() => ({}));

        if (!createRes.ok || !createJson?.block?.id) {
          throw new Error(createJson?.error || "Failed to save generated block");
        }

        return createJson.block.id as string;
      })();

      const [, blockId] = await Promise.all([
        minimumDelayPromise,
        generationAndSavePromise,
      ]);

      setProgress(100);
      setProgressLabel("Block ready");

      window.setTimeout(() => {
        router.push(
          `/blocks/${blockId}/review?role=${role}${
            isPageBuilderMode
              ? `&returnTo=${encodeURIComponent(
                  `/pages/${pageId}?role=${role}&sectionId=${sectionId}`
                )}`
              : ""
          }`
        );
      }, 250);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
      setIsGenerating(false);
      setStep("instructions");
      setProgress(0);
      setProgressLabel(progressLabels[0]);
    }
  }

  if (!canCreate) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-[#f6f7fb] px-6">
        <div className="w-full max-w-[520px] rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
          <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
            Access restricted
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Your current role does not have permission to create blocks.
          </p>
        </div>
      </div>
    );
  }

  if (step === "generating") {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f6f7fb] text-slate-900">
        <TopBar title="Generating" stepLabel="Step 3 of 3" />
        <div className="flex flex-1 items-center justify-center px-8 pt-5 pb-4">
          <Generating progress={progress} label={progressLabel} />
        </div>
      </div>
    );
  }

  const stepNumber = getStepNumber(step);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f6f7fb] text-slate-900">
      <TopBar title="Create Block" stepLabel={`Step ${stepNumber} of 3`} />

      <div className="flex flex-1 items-center justify-center overflow-hidden px-8 py-6">
      <div className="mx-auto flex max-h-[calc(100dvh-150px)] w-full max-w-[1040px] flex-col rounded-[30px] bg-white px-7 pt-5 pb-6 shadow-[0_10px_35px_rgba(15,23,42,0.04)] ring-1 ring-[#eef1f6]">
          {step === "context" ? (
            <>
              <ProgressHeader
                currentStep={1}
                title="Block Context"
                subtitle="Define the core block details before choosing the component type."
              />

              <div className="overflow-hidden rounded-[22px] border border-[#e8ecf4] bg-white">
                <FormRow label="Block Name">
                  <TextInput value={blockName} onChange={setBlockName} placeholder="Why Choose Us" />
                </FormRow>

                <FormRow label="Where will this block be used">
                  <TextInput value={location} onChange={setLocation} placeholder="Food, Feed & Agriculture" />
                </FormRow>

                <FormRow label="Content Length">
                  <SegmentedOptions value={contentLength} onChange={setContentLength} options={contentLengthOptions} />
                </FormRow>

                <FormRow label="Image Source" multiline>
                  <ImageSourceSelector
                    mode={imageSourceMode}
                    setMode={setImageSourceMode}
                    uploadedFileName={uploadedImageFile?.name || ""}
                    onFileChange={setUploadedImageFile}
                  />
                </FormRow>
              </div>

              {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

              <div className="mt-5 flex items-center justify-center gap-3">
              <button
  type="button"
  onClick={() => {
    const returnTo = searchParams.get("returnTo");

    if (returnTo) {
      router.push(returnTo);
      return;
    }

    router.push(`/dashboard?role=${role}`);
  }}
  className="min-w-[120px] rounded-lg bg-[#eef2fb] px-6 py-3 text-sm font-semibold text-[#7380b3] transition-all duration-200 hover:bg-[#dfe6fb] hover:text-[#4b5ea8] hover:shadow-md"
>
  Cancel
</button>

                <button
                  type="button"
                  onClick={handleContextContinue}
                  disabled={!blockName.trim() || !location.trim()}
                  className="min-w-[170px] rounded-lg bg-[#5b7cff] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#3f5ff0] hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </>
          ) : null}

          {step === "block_type" ? (
            <>
              <ProgressHeader
  currentStep={2}
  title={isPageBuilderMode ? "Choose Variant" : "Block Type & Variant"}
  subtitle={
    isPageBuilderMode
      ? `This block type has been set by the ${sectionLabelFromUrl || "selected"} section. Choose the layout variant you want to generate.`
      : "Choose the type of section you want to generate, then select its preferred layout variant."
  }
/>

<div className="relative min-h-0 flex-1 overflow-y-auto pr-2 max-h-[490px]">
<BlockTypeSelector
  selectedBlockTypeId={selectedBlockTypeId}
  selectedVariantId={selectedVariantId}
  onSelectBlockType={handleSelectBlockType}
  onSelectVariant={setSelectedVariantId}
  lockedBlockType={isPageBuilderMode}
/>
</div>

              {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="min-w-[120px] rounded-lg bg-[#eef2fb] px-6 py-3 text-sm font-semibold text-[#7380b3] transition-all duration-200 hover:bg-[#dfe6fb] hover:text-[#4b5ea8] hover:shadow-md"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleBlockTypeContinue}
                  disabled={!selectedBlockTypeId || !selectedVariantId}
                  className="min-w-[170px] rounded-lg bg-[#5b7cff] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#3f5ff0] hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </>
          ) : null}

          {step === "instructions" ? (
            <>
              <ProgressHeader
                currentStep={3}
                title="AI Instructions"
                subtitle="Provide the final generation prompt and review the governance controls applied to the output."
              />

              <div className="mb-5 rounded-[22px] border border-[#e8ecf4] bg-[#fafbff] px-5 py-4">
                <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#5b7cff]">
                  Selected block
                </div>
                <div className="mt-1 text-[16px] font-semibold text-[#111827]">
                  {selectedBlockType.name} — {selectedVariant.name}
                </div>
                <p className="mt-1 text-[13px] text-[#7d859d]">
                  {selectedVariant.description}
                </p>
              </div>

              <div className="overflow-hidden rounded-[22px] border border-[#e8ecf4] bg-white">
                <FormRow label="AI Prompt" multiline helper="Required">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the content block you want to create..."
                    className="min-h-[140px] w-full rounded-xl border border-[#e3e7f2] bg-[#fafbff] px-4 py-3 text-[14px] leading-[1.7] text-[#2c3348] outline-none transition placeholder:text-[#b6bdd2] hover:border-[#d2d8ea] focus:border-[#5b7cff] focus:bg-white focus:shadow-[0_0_0_4px_rgba(91,124,255,0.08)]"
                  />
                </FormRow>
              </div>

              <div className="mt-5 rounded-[22px] bg-[#f8f9fc] px-6 py-5 ring-1 ring-[#eceff5]">
                <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#111827]">
                  Governance & Output Controls
                </h3>
                <p className="mt-2 text-[13px] text-[#7d859d]">
                  All generated blocks are validated against organisational design, accessibility, performance, and content standards.
                </p>

                <div className="mt-4 grid grid-cols-3 gap-x-8 gap-y-4">
                  {governanceChecks.map((item) => (
                    <div key={item} className="flex min-w-0 items-center gap-3">
                      <span className="relative h-[18px] w-[18px] shrink-0 rounded-full bg-[#5b7cff]">
                        <span className="absolute left-1/2 top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                      </span>
                      <span className="text-[13px] font-medium leading-[1.35] text-[#2c3348]">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="min-w-[120px] rounded-lg bg-[#eef2fb] px-6 py-3 text-sm font-semibold text-[#7380b3] transition-all duration-200 hover:bg-[#dfe6fb] hover:text-[#4b5ea8] hover:shadow-md"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="min-w-[170px] rounded-lg bg-[#5b7cff] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#3f5ff0] hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? "Generating..." : "Generate Block"}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function NewBlockPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-0 items-center justify-center bg-[#f6f7fb] text-sm font-medium text-slate-500">
          Loading block creator…
        </div>
      }
    >
      <NewBlockPageContent />
    </Suspense>
  );
}