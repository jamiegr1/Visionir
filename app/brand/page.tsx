"use client";

import { useMemo, useState } from "react";

type Section =
  | "identity"
  | "audience"
  | "messaging"
  | "terminology"
  | "cta"
  | "visual"
  | "components"
  | "accessibility"
  | "governance"
  | "localisation"
  | "examples";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringifyList(value: string[]) {
  return value.join(", ");
}

function StatusPill({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "slate" | "amber";
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        tone === "blue" && "bg-[#eef3ff] text-[#4f6fff]",
        tone === "green" && "bg-emerald-50 text-emerald-700",
        tone === "slate" && "bg-slate-100 text-slate-600",
        tone === "amber" && "bg-amber-50 text-amber-700"
      )}
    >
      {children}
    </span>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
    />
  );
}

function Textarea({
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-white"
    >
      <div className="pr-4">
        <div className="text-sm font-medium text-slate-800">{label}</div>
        {description ? (
          <div className="mt-1 text-[12px] leading-5 text-slate-500">
            {description}
          </div>
        ) : null}
      </div>

      <span
        className={cx(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition",
          checked ? "bg-[#5b7cff]" : "bg-slate-300"
        )}
      >
        <span
          className={cx(
            "inline-block h-5 w-5 transform rounded-full bg-white transition",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </span>
    </button>
  );
}

function FieldCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="mb-4">
        <div className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900">
          {title}
        </div>
        {description ? (
          <p className="mt-1 text-[13px] leading-5 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function FieldGroup({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-800">{label}</label>
        {helper ? (
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
            {helper}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function FieldGrid({
  children,
  cols = 2,
}: {
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
}) {
  return (
    <div
      className={cx(
        "grid gap-5",
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-1 md:grid-cols-2",
        cols === 3 && "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      )}
    >
      {children}
    </div>
  );
}

function LeftPanelNav({
  sections,
  active,
  setActive,
}: {
  sections: Array<{ id: Section; label: string; helper: string }>;
  active: Section;
  setActive: (section: Section) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b border-slate-200 px-6 py-6">
        <div>
          <h2 className="text-[19px] font-semibold tracking-[-0.03em] text-slate-900">
            Brand System
          </h2>
          <p className="mt-1.5 max-w-[260px] text-[13px] leading-5 text-slate-500">
            Configure the rules Visionir uses for generation, validation and governance.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pr-3">
        <div className="rounded-[26px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] p-2 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
          {sections.map((section, index) => {
            const isActive = active === section.id;
            const isLast = index === sections.length - 1;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActive(section.id)}
                className={cx(
                  "group relative w-full rounded-2xl px-4 py-3.5 text-left transition-all duration-200",
                  isActive
                    ? "bg-[#f7f9ff] shadow-[0_4px_14px_rgba(79,108,255,0.06)]"
                    : "bg-transparent hover:bg-white"
                )}
              >
                {!isLast && (
                  <span
                    className={cx(
                      "absolute bottom-0 left-4 right-4 h-px transition-opacity duration-200",
                      isActive
                        ? "bg-transparent"
                        : "bg-slate-200/70 group-hover:bg-slate-200"
                    )}
                  />
                )}

                <span
                  className={cx(
                    "absolute left-0 top-[11px] bottom-[11px] w-[3px] rounded-r-full transition-all duration-200",
                    isActive ? "bg-[#4f6fff]" : "bg-transparent"
                  )}
                />

                <div className="pl-2.5">
                  <div
                    className={cx(
                      "text-[13.5px] font-semibold tracking-[-0.01em] transition-colors duration-200",
                      isActive
                        ? "text-slate-900"
                        : "text-slate-700 group-hover:text-slate-900"
                    )}
                  >
                    {section.label}
                  </div>

                  <div
                    className={cx(
                      "mt-1 text-[12px] leading-5 transition-colors duration-200",
                      isActive
                        ? "text-slate-500"
                        : "text-slate-500 group-hover:text-slate-600"
                    )}
                  >
                    {section.helper}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-[22px] border border-[#dbe5ff] bg-[linear-gradient(180deg,#f8faff_0%,#f3f7ff_100%)] px-4 py-3.5 shadow-[0_6px_18px_rgba(79,108,255,0.04)]">
          <p className="text-[13px] leading-5 text-[#4f6fff]">
            These settings define the rules the API uses to generate, validate and govern enterprise blocks.
          </p>
        </div>
      </div>
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="h-9 w-9 shrink-0 rounded-xl border border-black/5"
          style={{ backgroundColor: value }}
        />
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-800">{label}</div>
          <div className="text-[12px] text-slate-500">{value}</div>
        </div>
      </div>

      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12 shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
      />
    </div>
  );
}

export default function BrandPage() {
  const [active, setActive] = useState<Section>("identity");

  const [config, setConfig] = useState({
    identity: {
      brandName: "Kiwa",
      shortDescription:
        "Enterprise certification, testing and assurance brand with a structured, compliance-led digital experience.",
      longDescription:
        "Kiwa is a global testing, inspection and certification business focused on trust, assurance, compliance and technical credibility.",
      industry: "Testing, Inspection & Certification",
      primaryOffering: "Certification, testing, assurance and compliance services",
      websiteObjective: "Drive qualified enquiries and support enterprise trust",
    },

    audience: {
      primaryAudience: "Enterprise buyers, technical decision-makers and compliance stakeholders",
      secondaryAudience: "Procurement teams, operational leaders and industry specialists",
      marketPosition:
        "Trusted, credible and governance-led enterprise assurance partner",
      valueProposition:
        "Expert-led certification and assurance with technical depth, global credibility and structured delivery.",
      differentiators:
        ["Technical expertise", "Global credibility", "Compliance-first", "Trusted delivery"],
      competitorReferences: ["SGS", "Bureau Veritas", "Intertek"],
      avoidCompetitorTone: true,
    },

    messaging: {
      toneStyle: "professional",
      toneDescription:
        "Clear, professional and trustworthy. Avoid exaggerated marketing language and keep copy precise, credible and informative.",
      preferredToneTraits: ["trusted", "technical", "clear", "credible", "calm"],
      bannedToneTraits: ["playful", "hyped", "pushy", "casual", "salesy"],
      readingLevel: "professional",
      sentenceStyle: "concise",
      pointOfView: "second_person",
      languageVariant: "British English",
      headlineStyle:
        "Short, direct and credibility-led. Avoid vague marketing statements.",
      subheadingStyle:
        "Explain value clearly and support the headline with practical detail.",
      proofRequirement:
        "Claims should be evidence-led and framed with credibility, expertise or measurable outcomes where possible.",
    },

    terminology: {
      approvedTerms: [
        "assurance",
        "compliance",
        "certification",
        "technical expertise",
        "trusted partner",
      ],
      bannedWords: ["cheap", "guaranteed", "instant", "best-in-class"],
      restrictedTerms: [
        "world-leading",
        "market-leading",
        "guaranteed outcome",
      ],
      requiredPhrases: ["Speak to an expert"],
      claimRules:
        "Do not make absolute claims unless explicitly approved. Avoid unsupported superlatives.",
      complianceNotes:
        "Generated content must remain precise, non-misleading and appropriate for regulated or compliance-led subject matter.",
      disclaimerRules:
        "Use disclaimers where outcomes depend on scope, certification status or service conditions.",
    },

    cta: {
      defaultCta: "Speak to an expert",
      allowedCtas: [
        "Speak to an expert",
        "Contact us",
        "Request a consultation",
      ],
      secondaryCtas: [
        "Learn more",
        "View services",
        "Explore our expertise",
      ],
      ctaTone: "professional",
      urgentLanguageAllowed: false,
      promotionalLanguageAllowed: false,
      maxPrimaryCtasPerBlock: 1,
      maxSecondaryCtasPerBlock: 2,
      ctaMaxLength: 28,
    },

    visual: {
      colors: {
        primary: "#2f6df6",
        secondary: "#111827",
        background: "#ffffff",
        surface: "#f8fafc",
        text: "#111827",
        accent: "#4f46e5",
      },
      typography: {
        fontFamily: "Inter",
        headingWeight: 600,
        bodyWeight: 400,
      },
      spacing: {
        borderRadius: 12,
        spacingScale: 8,
        sectionPadding: "balanced",
        density: "balanced",
      },
      borderStyle: "soft",
      shadowStyle: "subtle",
      iconStyle: "outline",
      imageStyle: "corporate",
      gradientUsage: "minimal",
      buttonStyle: "solid-primary",
      cardStyle: "soft-border",
    },

    components: {
      allowedBlockTypes: [
        "hero",
        "feature-grid",
        "text-media",
        "value-points",
        "cta-banner",
      ],
      disallowedBlockTypes: ["countdown", "testimonial-carousel", "promo-popup"],
      allowedLayoutPatterns: [
        "two-column",
        "stacked",
        "grid-3",
        "grid-4",
      ],
      maxValuePoints: 4,
      maxCardsPerRow: 4,
      maxCtasPerBlock: 2,
      imageRequired: false,
      formsAllowed: true,
      testimonialsAllowed: false,
      statsAllowed: true,
      comparisonTablesAllowed: false,
      animationsAllowed: true,
      animationStyle: "subtle",
    },

    accessibility: {
      standard: "WCAG AA",
      minimumContrast: "4.5:1",
      headingHierarchyRequired: true,
      altTextRequired: true,
      descriptiveLinksRequired: true,
      maxLineLength: 80,
      buttonLabelClarityRequired: true,
      avoidTextInImages: true,
    },

    governance: {
      aiEditScope: "copy_and_layout_with_locked_tokens",
      lockedTokens: ["primary colour", "font family", "button radius"],
      lockedComponents: ["primary CTA style", "headline hierarchy"],
      approvalRequiredFor: [
        "homepage heroes",
        "compliance-sensitive content",
        "claims-heavy content",
      ],
      regionalOverridesEnabled: true,
      legalReviewRequired: true,
      autoApproveLowRiskChanges: false,
      allowAiRewrite: true,
      allowAiStructuralChanges: true,
    },

    localisation: {
      defaultLocale: "en-GB",
      supportedLocales: ["en-GB", "en-US", "de-DE", "fr-FR"],
      localeFallback: "en-GB",
      regionalSpellingRequired: true,
      regionalDisclaimersAllowed: true,
      regionSpecificImageryRules:
        "Avoid market-inappropriate imagery and ensure sector relevance by region.",
      regionSpecificCTAs:
        ["Use region-appropriate contact language where required"],
    },

    examples: {
      approvedHeadlineExamples: [
        "Trusted certification and assurance for complex industries",
        "Technical expertise that supports compliance with confidence",
      ],
      approvedBodyExamples: [
        "Our specialists help organisations meet regulatory requirements with clear, structured and credible assurance services.",
        "We support enterprise teams with certification, testing and technical guidance tailored to sector-specific needs.",
      ],
      badCopyExamples: [
        "We guarantee the best results instantly",
        "The ultimate solution for every compliance challenge",
      ],
      approvedSectionPatterns: [
        "Hero + value points + CTA",
        "Text-media + feature grid + contact CTA",
      ],
    },
  });

  function update(path: string, value: unknown) {
    setConfig((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let obj: Record<string, any> = next;

      keys.slice(0, -1).forEach((key) => {
        obj[key] = { ...obj[key] };
        obj = obj[key];
      });

      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }

  const sections: Array<{ id: Section; label: string; helper: string }> = [
    {
      id: "identity",
      label: "Brand Identity",
      helper: "Core business, purpose and generation context",
    },
    {
      id: "audience",
      label: "Audience & Positioning",
      helper: "Who the brand serves and how it should be positioned",
    },
    {
      id: "messaging",
      label: "Tone & Messaging",
      helper: "Voice, sentence style and writing guidance",
    },
    {
      id: "terminology",
      label: "Terminology & Compliance",
      helper: "Approved language, restricted claims and legal guidance",
    },
    {
      id: "cta",
      label: "CTA Rules",
      helper: "Call-to-action patterns and CTA constraints",
    },
    {
      id: "visual",
      label: "Visual System",
      helper: "Tokens, style rules and visual language",
    },
    {
      id: "components",
      label: "Component & Layout Rules",
      helper: "Allowed block types and layout constraints",
    },
    {
      id: "accessibility",
      label: "Accessibility",
      helper: "Standards, readability and UX requirements",
    },
    {
      id: "governance",
      label: "Governance",
      helper: "Approval, lock rules and AI permissions",
    },
    {
      id: "localisation",
      label: "Localisation",
      helper: "Locales, regional rules and content adaptation",
    },
    {
      id: "examples",
      label: "Brand Examples",
      helper: "Approved and disallowed example patterns",
    },
  ];

  const activeSection = useMemo(
    () => sections.find((section) => section.id === active),
    [active]
  );

  return (
    <div className="h-[calc(100dvh-72px)] overflow-hidden bg-[#f5f7fb] text-slate-900">
      <div className="flex h-[calc(100dvh-72px)] overflow-hidden">
        <aside className="w-full max-w-[360px] shrink-0 border-r border-slate-200 bg-white">
          <LeftPanelNav
            sections={sections}
            active={active}
            setActive={setActive}
          />
        </aside>

        <main className="grid min-w-0 flex-1 min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-[#f5f7fb]">
          <div className="shrink-0 border-b border-slate-200 bg-[#f5f7fb] px-8 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm hover:text-slate-600"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M5 7h14M5 12h14M5 17h14" />
                  </svg>
                </button>

                <div>
                  <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
                    {activeSection?.label || "Brand System"}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Define the structured rules Visionir uses to generate and validate governed enterprise blocks.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusPill tone="blue">Brand Governance</StatusPill>
                <StatusPill tone="green">Structured Schema</StatusPill>
                <StatusPill tone="amber">Validation Ready</StatusPill>
              </div>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto px-8 py-6">
            <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
              {active === "identity" && (
                <>
                  <FieldCard
                    title="Brand Identity"
                    description="Core business and brand context used by the API when generating blocks."
                  >
                    <FieldGrid cols={2}>
                      <FieldGroup label="Brand Name">
                        <Input
                          value={config.identity.brandName}
                          onChange={(v) => update("identity.brandName", v)}
                        />
                      </FieldGroup>

                      <FieldGroup label="Industry">
                        <Input
                          value={config.identity.industry}
                          onChange={(v) => update("identity.industry", v)}
                        />
                      </FieldGroup>

                      <FieldGroup label="Primary Offering">
                        <Input
                          value={config.identity.primaryOffering}
                          onChange={(v) => update("identity.primaryOffering", v)}
                        />
                      </FieldGroup>

                      <FieldGroup label="Website Objective">
                        <Input
                          value={config.identity.websiteObjective}
                          onChange={(v) => update("identity.websiteObjective", v)}
                        />
                      </FieldGroup>
                    </FieldGrid>

                    <div className="mt-5 space-y-5">
                      <FieldGroup label="Short Description" helper="GENERATION CONTEXT">
                        <Textarea
                          value={config.identity.shortDescription}
                          onChange={(v) => update("identity.shortDescription", v)}
                          rows={4}
                        />
                      </FieldGroup>

                      <FieldGroup label="Long Description" helper="SYSTEM CONTEXT">
                        <Textarea
                          value={config.identity.longDescription}
                          onChange={(v) => update("identity.longDescription", v)}
                          rows={5}
                        />
                      </FieldGroup>
                    </div>
                  </FieldCard>

                  <FieldCard
                    title="Preview"
                    description="How this brand identity will be passed into the generation layer."
                  >
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm leading-7 text-slate-600">
                        <span className="font-semibold text-slate-900">
                          {config.identity.brandName}
                        </span>{" "}
                        is a {config.identity.industry.toLowerCase()} brand focused on{" "}
                        {config.identity.primaryOffering.toLowerCase()}. The primary
                        website objective is to {config.identity.websiteObjective.toLowerCase()}.
                      </p>
                    </div>
                  </FieldCard>
                </>
              )}

              {active === "audience" && (
                <FieldCard
                  title="Audience & Positioning"
                  description="Define who the brand is for and how Visionir should position it."
                >
                  <div className="space-y-5">
                    <FieldGroup label="Primary Audience">
                      <Textarea
                        value={config.audience.primaryAudience}
                        onChange={(v) => update("audience.primaryAudience", v)}
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Secondary Audience">
                      <Textarea
                        value={config.audience.secondaryAudience}
                        onChange={(v) => update("audience.secondaryAudience", v)}
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Market Position">
                      <Textarea
                        value={config.audience.marketPosition}
                        onChange={(v) => update("audience.marketPosition", v)}
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Value Proposition">
                      <Textarea
                        value={config.audience.valueProposition}
                        onChange={(v) => update("audience.valueProposition", v)}
                        rows={4}
                      />
                    </FieldGroup>

                    <FieldGroup label="Differentiators" helper="COMMA SEPARATED">
                      <Textarea
                        value={stringifyList(config.audience.differentiators)}
                        onChange={(v) =>
                          update("audience.differentiators", parseList(v))
                        }
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Competitor References" helper="COMMA SEPARATED">
                      <Textarea
                        value={stringifyList(config.audience.competitorReferences)}
                        onChange={(v) =>
                          update("audience.competitorReferences", parseList(v))
                        }
                        rows={3}
                      />
                    </FieldGroup>

                    <Toggle
                      checked={config.audience.avoidCompetitorTone}
                      onChange={(v) => update("audience.avoidCompetitorTone", v)}
                      label="Avoid competitor tone mimicry"
                      description="Prevents generation from sounding too close to named competitor brands."
                    />
                  </div>
                </FieldCard>
              )}

              {active === "messaging" && (
                <>
                  <FieldCard
                    title="Tone & Messaging"
                    description="Define how generated copy should sound, read and behave."
                  >
                    <FieldGrid cols={2}>
                      <FieldGroup label="Tone Style">
                        <Select
                          value={config.messaging.toneStyle}
                          onChange={(v) => update("messaging.toneStyle", v)}
                          options={["professional", "technical", "friendly", "bold"]}
                        />
                      </FieldGroup>

                      <FieldGroup label="Reading Level">
                        <Select
                          value={config.messaging.readingLevel}
                          onChange={(v) => update("messaging.readingLevel", v)}
                          options={["general", "professional", "executive", "technical"]}
                        />
                      </FieldGroup>

                      <FieldGroup label="Sentence Style">
                        <Select
                          value={config.messaging.sentenceStyle}
                          onChange={(v) => update("messaging.sentenceStyle", v)}
                          options={["concise", "balanced", "descriptive"]}
                        />
                      </FieldGroup>

                      <FieldGroup label="Point of View">
                        <Select
                          value={config.messaging.pointOfView}
                          onChange={(v) => update("messaging.pointOfView", v)}
                          options={["first_person", "second_person", "third_person"]}
                        />
                      </FieldGroup>

                      <FieldGroup label="Language Variant">
                        <Select
                          value={config.messaging.languageVariant}
                          onChange={(v) => update("messaging.languageVariant", v)}
                          options={["British English", "American English"]}
                        />
                      </FieldGroup>
                    </FieldGrid>

                    <div className="mt-5 space-y-5">
                      <FieldGroup label="Tone Description">
                        <Textarea
                          value={config.messaging.toneDescription}
                          onChange={(v) => update("messaging.toneDescription", v)}
                          rows={5}
                        />
                      </FieldGroup>

                      <FieldGroup label="Preferred Tone Traits" helper="COMMA SEPARATED">
                        <Textarea
                          value={stringifyList(config.messaging.preferredToneTraits)}
                          onChange={(v) =>
                            update("messaging.preferredToneTraits", parseList(v))
                          }
                          rows={3}
                        />
                      </FieldGroup>

                      <FieldGroup label="Banned Tone Traits" helper="COMMA SEPARATED">
                        <Textarea
                          value={stringifyList(config.messaging.bannedToneTraits)}
                          onChange={(v) =>
                            update("messaging.bannedToneTraits", parseList(v))
                          }
                          rows={3}
                        />
                      </FieldGroup>

                      <FieldGroup label="Headline Style">
                        <Textarea
                          value={config.messaging.headlineStyle}
                          onChange={(v) => update("messaging.headlineStyle", v)}
                          rows={3}
                        />
                      </FieldGroup>

                      <FieldGroup label="Subheading Style">
                        <Textarea
                          value={config.messaging.subheadingStyle}
                          onChange={(v) => update("messaging.subheadingStyle", v)}
                          rows={3}
                        />
                      </FieldGroup>

                      <FieldGroup label="Proof Requirement">
                        <Textarea
                          value={config.messaging.proofRequirement}
                          onChange={(v) => update("messaging.proofRequirement", v)}
                          rows={4}
                        />
                      </FieldGroup>
                    </div>
                  </FieldCard>
                </>
              )}

              {active === "terminology" && (
                <FieldCard
                  title="Terminology & Compliance"
                  description="Define approved language, restricted claims and compliance constraints."
                >
                  <div className="space-y-5">
                    <FieldGroup label="Approved Terms" helper="COMMA SEPARATED">
                      <Textarea
                        value={stringifyList(config.terminology.approvedTerms)}
                        onChange={(v) =>
                          update("terminology.approvedTerms", parseList(v))
                        }
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Banned Words" helper="COMMA SEPARATED">
                      <Textarea
                        value={stringifyList(config.terminology.bannedWords)}
                        onChange={(v) =>
                          update("terminology.bannedWords", parseList(v))
                        }
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Restricted Terms" helper="COMMA SEPARATED">
                      <Textarea
                        value={stringifyList(config.terminology.restrictedTerms)}
                        onChange={(v) =>
                          update("terminology.restrictedTerms", parseList(v))
                        }
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Required Phrases" helper="COMMA SEPARATED">
                      <Textarea
                        value={stringifyList(config.terminology.requiredPhrases)}
                        onChange={(v) =>
                          update("terminology.requiredPhrases", parseList(v))
                        }
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Claim Rules">
                      <Textarea
                        value={config.terminology.claimRules}
                        onChange={(v) => update("terminology.claimRules", v)}
                        rows={4}
                      />
                    </FieldGroup>

                    <FieldGroup label="Compliance Notes">
                      <Textarea
                        value={config.terminology.complianceNotes}
                        onChange={(v) => update("terminology.complianceNotes", v)}
                        rows={4}
                      />
                    </FieldGroup>

                    <FieldGroup label="Disclaimer Rules">
                      <Textarea
                        value={config.terminology.disclaimerRules}
                        onChange={(v) => update("terminology.disclaimerRules", v)}
                        rows={4}
                      />
                    </FieldGroup>
                  </div>
                </FieldCard>
              )}

              {active === "cta" && (
                <FieldCard
                  title="CTA Rules"
                  description="Control allowed CTA language, structure and limits."
                >
                  <FieldGrid cols={2}>
                    <FieldGroup label="Default CTA">
                      <Input
                        value={config.cta.defaultCta}
                        onChange={(v) => update("cta.defaultCta", v)}
                      />
                    </FieldGroup>

                    <FieldGroup label="CTA Tone">
                      <Select
                        value={config.cta.ctaTone}
                        onChange={(v) => update("cta.ctaTone", v)}
                        options={["professional", "neutral", "advisory", "direct"]}
                      />
                    </FieldGroup>

                    <FieldGroup label="Max Primary CTAs Per Block">
                      <Input
                        type="number"
                        value={config.cta.maxPrimaryCtasPerBlock}
                        onChange={(v) =>
                          update("cta.maxPrimaryCtasPerBlock", Number(v))
                        }
                      />
                    </FieldGroup>

                    <FieldGroup label="Max Secondary CTAs Per Block">
                      <Input
                        type="number"
                        value={config.cta.maxSecondaryCtasPerBlock}
                        onChange={(v) =>
                          update("cta.maxSecondaryCtasPerBlock", Number(v))
                        }
                      />
                    </FieldGroup>

                    <FieldGroup label="CTA Max Length">
                      <Input
                        type="number"
                        value={config.cta.ctaMaxLength}
                        onChange={(v) => update("cta.ctaMaxLength", Number(v))}
                      />
                    </FieldGroup>
                  </FieldGrid>

                  <div className="mt-5 space-y-5">
                    <FieldGroup label="Allowed CTAs" helper="COMMA SEPARATED">
                      <Textarea
                        value={stringifyList(config.cta.allowedCtas)}
                        onChange={(v) => update("cta.allowedCtas", parseList(v))}
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Secondary CTAs" helper="COMMA SEPARATED">
                      <Textarea
                        value={stringifyList(config.cta.secondaryCtas)}
                        onChange={(v) => update("cta.secondaryCtas", parseList(v))}
                        rows={3}
                      />
                    </FieldGroup>

                    <div className="grid gap-4">
                      <Toggle
                        checked={config.cta.urgentLanguageAllowed}
                        onChange={(v) => update("cta.urgentLanguageAllowed", v)}
                        label="Allow urgent CTA language"
                        description="Examples: 'Act now', 'Limited time', 'Get started today'."
                      />

                      <Toggle
                        checked={config.cta.promotionalLanguageAllowed}
                        onChange={(v) =>
                          update("cta.promotionalLanguageAllowed", v)
                        }
                        label="Allow promotional CTA language"
                        description="Examples: discount-led, hype-led or aggressive conversion language."
                      />
                    </div>
                  </div>
                </FieldCard>
              )}

              {active === "visual" && (
                <>
                  <FieldCard
                    title="Colour Tokens"
                    description="Manage the core colour system used across layouts, highlights and interactive elements."
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      {Object.entries(config.visual.colors).map(([key, value]) => (
                        <ColorRow
                          key={key}
                          label={capitalize(key)}
                          value={value}
                          onChange={(v) => update(`visual.colors.${key}`, v)}
                        />
                      ))}
                    </div>
                  </FieldCard>

                  <FieldCard
                    title="Typography & Style Rules"
                    description="Set the visual language used by generated components."
                  >
                    <FieldGrid cols={2}>
                      <FieldGroup label="Font Family">
                        <Input
                          value={config.visual.typography.fontFamily}
                          onChange={(v) =>
                            update("visual.typography.fontFamily", v)
                          }
                        />
                      </FieldGroup>

                      <FieldGroup label="Heading Weight">
                        <Input
                          type="number"
                          value={config.visual.typography.headingWeight}
                          onChange={(v) =>
                            update("visual.typography.headingWeight", Number(v))
                          }
                        />
                      </FieldGroup>

                      <FieldGroup label="Body Weight">
                        <Input
                          type="number"
                          value={config.visual.typography.bodyWeight}
                          onChange={(v) =>
                            update("visual.typography.bodyWeight", Number(v))
                          }
                        />
                      </FieldGroup>

                      <FieldGroup label="Border Radius">
                        <Input
                          type="number"
                          value={config.visual.spacing.borderRadius}
                          onChange={(v) =>
                            update("visual.spacing.borderRadius", Number(v))
                          }
                        />
                      </FieldGroup>

                      <FieldGroup label="Spacing Scale">
                        <Input
                          type="number"
                          value={config.visual.spacing.spacingScale}
                          onChange={(v) =>
                            update("visual.spacing.spacingScale", Number(v))
                          }
                        />
                      </FieldGroup>

                      <FieldGroup label="Section Padding">
                        <Select
                          value={config.visual.spacing.sectionPadding}
                          onChange={(v) => update("visual.spacing.sectionPadding", v)}
                          options={["compact", "balanced", "spacious"]}
                        />
                      </FieldGroup>

                      <FieldGroup label="Density">
                        <Select
                          value={config.visual.spacing.density}
                          onChange={(v) => update("visual.spacing.density", v)}
                          options={["compact", "balanced", "spacious"]}
                        />
                      </FieldGroup>

                      <FieldGroup label="Border Style">
                        <Select
                          value={config.visual.borderStyle}
                          onChange={(v) => update("visual.borderStyle", v)}
                          options={["soft", "minimal", "sharp"]}
                        />
                      </FieldGroup>

                      <FieldGroup label="Shadow Style">
                        <Select
                          value={config.visual.shadowStyle}
                          onChange={(v) => update("visual.shadowStyle", v)}
                          options={["none", "subtle", "elevated"]}
                        />
                      </FieldGroup>

                      <FieldGroup label="Icon Style">
                        <Select
                          value={config.visual.iconStyle}
                          onChange={(v) => update("visual.iconStyle", v)}
                          options={["outline", "filled", "duotone"]}
                        />
                      </FieldGroup>

                      <FieldGroup label="Image Style">
                        <Select
                          value={config.visual.imageStyle}
                          onChange={(v) => update("visual.imageStyle", v)}
                          options={["corporate", "minimal", "editorial", "technical"]}
                        />
                      </FieldGroup>

                      <FieldGroup label="Gradient Usage">
                        <Select
                          value={config.visual.gradientUsage}
                          onChange={(v) => update("visual.gradientUsage", v)}
                          options={["none", "minimal", "moderate"]}
                        />
                      </FieldGroup>

                      <FieldGroup label="Button Style">
                        <Select
                          value={config.visual.buttonStyle}
                          onChange={(v) => update("visual.buttonStyle", v)}
                          options={[
                            "solid-primary",
                            "outline-primary",
                            "mixed",
                          ]}
                        />
                      </FieldGroup>

                      <FieldGroup label="Card Style">
                        <Select
                          value={config.visual.cardStyle}
                          onChange={(v) => update("visual.cardStyle", v)}
                          options={["soft-border", "minimal", "elevated"]}
                        />
                      </FieldGroup>
                    </FieldGrid>
                  </FieldCard>
                </>
              )}

              {active === "components" && (
                <FieldCard
                  title="Component & Layout Rules"
                  description="Define which block types, layouts and behaviours are allowed."
                >
                  <div className="space-y-5">
                    <FieldGroup label="Allowed Block Types" helper="COMMA SEPARATED">
                      <Textarea
                        value={stringifyList(config.components.allowedBlockTypes)}
                        onChange={(v) =>
                          update("components.allowedBlockTypes", parseList(v))
                        }
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Disallowed Block Types" helper="COMMA SEPARATED">
                      <Textarea
                        value={stringifyList(config.components.disallowedBlockTypes)}
                        onChange={(v) =>
                          update("components.disallowedBlockTypes", parseList(v))
                        }
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Allowed Layout Patterns" helper="COMMA SEPARATED">
                      <Textarea
                        value={stringifyList(config.components.allowedLayoutPatterns)}
                        onChange={(v) =>
                          update("components.allowedLayoutPatterns", parseList(v))
                        }
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGrid cols={2}>
                      <FieldGroup label="Max Value Points">
                        <Input
                          type="number"
                          value={config.components.maxValuePoints}
                          onChange={(v) =>
                            update("components.maxValuePoints", Number(v))
                          }
                        />
                      </FieldGroup>

                      <FieldGroup label="Max Cards Per Row">
                        <Input
                          type="number"
                          value={config.components.maxCardsPerRow}
                          onChange={(v) =>
                            update("components.maxCardsPerRow", Number(v))
                          }
                        />
                      </FieldGroup>

                      <FieldGroup label="Max CTAs Per Block">
                        <Input
                          type="number"
                          value={config.components.maxCtasPerBlock}
                          onChange={(v) =>
                            update("components.maxCtasPerBlock", Number(v))
                          }
                        />
                      </FieldGroup>

                      <FieldGroup label="Animation Style">
                        <Select
                          value={config.components.animationStyle}
                          onChange={(v) => update("components.animationStyle", v)}
                          options={["none", "subtle", "moderate"]}
                        />
                      </FieldGroup>
                    </FieldGrid>

                    <div className="grid gap-4">
                      <Toggle
                        checked={config.components.imageRequired}
                        onChange={(v) => update("components.imageRequired", v)}
                        label="Require image in generated blocks"
                      />
                      <Toggle
                        checked={config.components.formsAllowed}
                        onChange={(v) => update("components.formsAllowed", v)}
                        label="Allow forms"
                      />
                      <Toggle
                        checked={config.components.testimonialsAllowed}
                        onChange={(v) =>
                          update("components.testimonialsAllowed", v)
                        }
                        label="Allow testimonials"
                      />
                      <Toggle
                        checked={config.components.statsAllowed}
                        onChange={(v) => update("components.statsAllowed", v)}
                        label="Allow statistics sections"
                      />
                      <Toggle
                        checked={config.components.comparisonTablesAllowed}
                        onChange={(v) =>
                          update("components.comparisonTablesAllowed", v)
                        }
                        label="Allow comparison tables"
                      />
                      <Toggle
                        checked={config.components.animationsAllowed}
                        onChange={(v) => update("components.animationsAllowed", v)}
                        label="Allow animations"
                      />
                    </div>
                  </div>
                </FieldCard>
              )}

              {active === "accessibility" && (
                <FieldCard
                  title="Accessibility"
                  description="Set the accessibility and readability rules blocks must follow."
                >
                  <FieldGrid cols={2}>
                    <FieldGroup label="Accessibility Standard">
                      <Select
                        value={config.accessibility.standard}
                        onChange={(v) => update("accessibility.standard", v)}
                        options={["WCAG AA", "WCAG AAA"]}
                      />
                    </FieldGroup>

                    <FieldGroup label="Minimum Contrast Ratio">
                      <Input
                        value={config.accessibility.minimumContrast}
                        onChange={(v) =>
                          update("accessibility.minimumContrast", v)
                        }
                      />
                    </FieldGroup>

                    <FieldGroup label="Max Line Length">
                      <Input
                        type="number"
                        value={config.accessibility.maxLineLength}
                        onChange={(v) =>
                          update("accessibility.maxLineLength", Number(v))
                        }
                      />
                    </FieldGroup>
                  </FieldGrid>

                  <div className="mt-5 grid gap-4">
                    <Toggle
                      checked={config.accessibility.headingHierarchyRequired}
                      onChange={(v) =>
                        update("accessibility.headingHierarchyRequired", v)
                      }
                      label="Require heading hierarchy"
                    />
                    <Toggle
                      checked={config.accessibility.altTextRequired}
                      onChange={(v) => update("accessibility.altTextRequired", v)}
                      label="Require alt text"
                    />
                    <Toggle
                      checked={config.accessibility.descriptiveLinksRequired}
                      onChange={(v) =>
                        update("accessibility.descriptiveLinksRequired", v)
                      }
                      label="Require descriptive links"
                    />
                    <Toggle
                      checked={config.accessibility.buttonLabelClarityRequired}
                      onChange={(v) =>
                        update("accessibility.buttonLabelClarityRequired", v)
                      }
                      label="Require clear button labels"
                    />
                    <Toggle
                      checked={config.accessibility.avoidTextInImages}
                      onChange={(v) =>
                        update("accessibility.avoidTextInImages", v)
                      }
                      label="Avoid text embedded in images"
                    />
                  </div>
                </FieldCard>
              )}

              {active === "governance" && (
                <FieldCard
                  title="Governance"
                  description="Set lock rules, approval rules and what the AI is allowed to change."
                >
                  <div className="space-y-5">
                    <FieldGroup label="AI Edit Scope">
                      <Select
                        value={config.governance.aiEditScope}
                        onChange={(v) => update("governance.aiEditScope", v)}
                        options={[
                          "copy_only",
                          "copy_and_layout",
                          "copy_and_layout_with_locked_tokens",
                        ]}
                      />
                    </FieldGroup>

                    <FieldGroup label="Locked Tokens" helper="COMMA SEPARATED">
                      <Textarea
                        value={stringifyList(config.governance.lockedTokens)}
                        onChange={(v) =>
                          update("governance.lockedTokens", parseList(v))
                        }
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Locked Components" helper="COMMA SEPARATED">
                      <Textarea
                        value={stringifyList(config.governance.lockedComponents)}
                        onChange={(v) =>
                          update("governance.lockedComponents", parseList(v))
                        }
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Approval Required For" helper="COMMA SEPARATED">
                      <Textarea
                        value={stringifyList(config.governance.approvalRequiredFor)}
                        onChange={(v) =>
                          update("governance.approvalRequiredFor", parseList(v))
                        }
                        rows={4}
                      />
                    </FieldGroup>

                    <div className="grid gap-4">
                      <Toggle
                        checked={config.governance.regionalOverridesEnabled}
                        onChange={(v) =>
                          update("governance.regionalOverridesEnabled", v)
                        }
                        label="Enable regional overrides"
                      />
                      <Toggle
                        checked={config.governance.legalReviewRequired}
                        onChange={(v) =>
                          update("governance.legalReviewRequired", v)
                        }
                        label="Require legal review for sensitive content"
                      />
                      <Toggle
                        checked={config.governance.autoApproveLowRiskChanges}
                        onChange={(v) =>
                          update("governance.autoApproveLowRiskChanges", v)
                        }
                        label="Auto-approve low risk changes"
                      />
                      <Toggle
                        checked={config.governance.allowAiRewrite}
                        onChange={(v) =>
                          update("governance.allowAiRewrite", v)
                        }
                        label="Allow AI rewrite"
                      />
                      <Toggle
                        checked={config.governance.allowAiStructuralChanges}
                        onChange={(v) =>
                          update("governance.allowAiStructuralChanges", v)
                        }
                        label="Allow AI structural changes"
                      />
                    </div>
                  </div>
                </FieldCard>
              )}

              {active === "localisation" && (
                <FieldCard
                  title="Localisation"
                  description="Control locale support and regional rule handling."
                >
                  <FieldGrid cols={2}>
                    <FieldGroup label="Default Locale">
                      <Input
                        value={config.localisation.defaultLocale}
                        onChange={(v) => update("localisation.defaultLocale", v)}
                      />
                    </FieldGroup>

                    <FieldGroup label="Locale Fallback">
                      <Input
                        value={config.localisation.localeFallback}
                        onChange={(v) => update("localisation.localeFallback", v)}
                      />
                    </FieldGroup>
                  </FieldGrid>

                  <div className="mt-5 space-y-5">
                    <FieldGroup label="Supported Locales" helper="COMMA SEPARATED">
                      <Textarea
                        value={stringifyList(config.localisation.supportedLocales)}
                        onChange={(v) =>
                          update("localisation.supportedLocales", parseList(v))
                        }
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Region-Specific Imagery Rules">
                      <Textarea
                        value={config.localisation.regionSpecificImageryRules}
                        onChange={(v) =>
                          update("localisation.regionSpecificImageryRules", v)
                        }
                        rows={4}
                      />
                    </FieldGroup>

                    <FieldGroup label="Region-Specific CTA Rules" helper="COMMA SEPARATED">
                      <Textarea
                        value={stringifyList(config.localisation.regionSpecificCTAs)}
                        onChange={(v) =>
                          update("localisation.regionSpecificCTAs", parseList(v))
                        }
                        rows={3}
                      />
                    </FieldGroup>

                    <div className="grid gap-4">
                      <Toggle
                        checked={config.localisation.regionalSpellingRequired}
                        onChange={(v) =>
                          update("localisation.regionalSpellingRequired", v)
                        }
                        label="Require regional spelling"
                      />
                      <Toggle
                        checked={config.localisation.regionalDisclaimersAllowed}
                        onChange={(v) =>
                          update("localisation.regionalDisclaimersAllowed", v)
                        }
                        label="Allow regional disclaimers"
                      />
                    </div>
                  </div>
                </FieldCard>
              )}

              {active === "examples" && (
                <FieldCard
                  title="Brand Examples"
                  description="Example patterns give the API strong, grounded reference points."
                >
                  <div className="space-y-5">
                    <FieldGroup label="Approved Headline Examples" helper="ONE PER LINE">
                      <Textarea
                        value={config.examples.approvedHeadlineExamples.join("\n")}
                        onChange={(v) =>
                          update(
                            "examples.approvedHeadlineExamples",
                            v.split("\n").map((x) => x.trim()).filter(Boolean)
                          )
                        }
                        rows={5}
                      />
                    </FieldGroup>

                    <FieldGroup label="Approved Body Examples" helper="ONE PER LINE">
                      <Textarea
                        value={config.examples.approvedBodyExamples.join("\n")}
                        onChange={(v) =>
                          update(
                            "examples.approvedBodyExamples",
                            v.split("\n").map((x) => x.trim()).filter(Boolean)
                          )
                        }
                        rows={5}
                      />
                    </FieldGroup>

                    <FieldGroup label="Bad Copy Examples" helper="ONE PER LINE">
                      <Textarea
                        value={config.examples.badCopyExamples.join("\n")}
                        onChange={(v) =>
                          update(
                            "examples.badCopyExamples",
                            v.split("\n").map((x) => x.trim()).filter(Boolean)
                          )
                        }
                        rows={4}
                      />
                    </FieldGroup>

                    <FieldGroup label="Approved Section Patterns" helper="ONE PER LINE">
                      <Textarea
                        value={config.examples.approvedSectionPatterns.join("\n")}
                        onChange={(v) =>
                          update(
                            "examples.approvedSectionPatterns",
                            v.split("\n").map((x) => x.trim()).filter(Boolean)
                          )
                        }
                        rows={4}
                      />
                    </FieldGroup>
                  </div>
                </FieldCard>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-[#f5f7fb] px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                <span>Brand Schema: Structured</span>
                <span>Validation Rules: Enabled</span>
                <span>Governance Layer: Active</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Reset
                </button>

                <button
                  type="button"
                  className="rounded-2xl bg-[#5b7cff] px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#1f36b8] active:bg-[#2642c7]"
                >
                  Save Brand System
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}