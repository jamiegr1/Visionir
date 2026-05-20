"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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
  | "approvals"
  | "localisation"
  | "examples";

type RegionConfig = {
  id: string;
  name: string;
  country: string;
  locale: string;
  workspaceType: "global" | "regional";
};

const REGIONS: RegionConfig[] = [
  {
    id: "mediascout-global",
    name: "Mediascout Global",
    country: "Global",
    locale: "Global",
    workspaceType: "global",
  },
  {
    id: "mediascout-uk",
    name: "Mediascout UK",
    country: "United Kingdom",
    locale: "en-GB",
    workspaceType: "regional",
  },
  {
    id: "mediascout-dubai",
    name: "Mediascout Dubai",
    country: "United Arab Emirates",
    locale: "en-AE",
    workspaceType: "regional",
  },
  {
    id: "mediascout-france",
    name: "Mediascout France",
    country: "France",
    locale: "fr-FR",
    workspaceType: "regional",
  },
];

function getRegion(regionId: string | null) {
  return (
    REGIONS.find((region) => region.id === regionId) ||
    REGIONS.find((region) => region.id === "mediascout-uk") ||
    REGIONS[0]
  );
}

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
  tone?: "blue" | "green" | "slate" | "amber" | "rose";
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        tone === "blue" && "bg-[#eef3ff] text-[#4f6fff]",
        tone === "green" && "bg-emerald-50 text-emerald-700",
        tone === "slate" && "bg-slate-100 text-slate-600",
        tone === "amber" && "bg-amber-50 text-amber-700",
        tone === "rose" && "bg-rose-50 text-rose-700"
      )}
    >
      {children}
    </span>
  );
}

function GovernanceScopePill({
  scope,
}: {
  scope: "locked" | "inherited" | "override" | "regional";
}) {
  const label =
    scope === "locked"
      ? "Locked globally"
      : scope === "inherited"
        ? "Inherited from global"
        : scope === "override"
          ? "Regional override"
          : "Regional setting";

  const tone =
    scope === "locked"
      ? "slate"
      : scope === "inherited"
        ? "blue"
        : scope === "override"
          ? "amber"
          : "green";

  return <StatusPill tone={tone}>{label}</StatusPill>;
}

function InheritanceNotice({
  regionLabel,
  activeSection,
}: {
  regionLabel: string;
  activeSection: Section;
}) {
  const isMostlyGlobal =
    activeSection === "visual" ||
    activeSection === "accessibility" ||
    activeSection === "components";

  const isRegionalOverride =
    activeSection === "localisation" ||
    activeSection === "cta" ||
    activeSection === "approvals" ||
    activeSection === "terminology";

  return (
    <div className="rounded-[28px] border border-[#dbe5ff] bg-[linear-gradient(180deg,#ffffff_0%,#f8faff_100%)] p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="blue">{regionLabel}</StatusPill>
            {isMostlyGlobal ? <GovernanceScopePill scope="locked" /> : null}
            {isRegionalOverride ? <GovernanceScopePill scope="override" /> : null}
            {!isMostlyGlobal && !isRegionalOverride ? (
              <GovernanceScopePill scope="inherited" />
            ) : null}
          </div>

          <h2 className="mt-3 text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
            Regional Brand & Governance
          </h2>

          <p className="mt-2 max-w-[900px] text-sm leading-6 text-slate-500">
            This workspace inherits global brand and governance rules. Regional teams can only adjust approved local settings such as localisation, contact language, regional CTAs, disclaimers, and local approval routing.
          </p>
        </div>

        <div className="rounded-2xl border border-[#dbe5ff] bg-white px-4 py-3 text-sm font-semibold text-[#4f6fff]">
          Global inheritance enabled
        </div>
      </div>
    </div>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
}: {
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cx(
        "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white",
        disabled ? "cursor-not-allowed bg-slate-100 text-slate-400" : "bg-slate-50"
      )}
    />
  );
}

function Textarea({
  value,
  onChange,
  rows = 4,
  placeholder,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cx(
        "w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white",
        disabled ? "cursor-not-allowed bg-slate-100 text-slate-400" : "bg-slate-50"
      )}
    />
  );
}

function Select({
  value,
  onChange,
  options,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cx(
        "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white",
        disabled ? "cursor-not-allowed bg-slate-100 text-slate-400" : "bg-slate-50"
      )}
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
    <div className="rounded-[28px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)] lg:p-6">
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
  scope,
  children,
}: {
  label: string;
  helper?: string;
  scope?: "locked" | "inherited" | "override" | "regional";
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-800">{label}</label>
        <div className="flex items-center gap-2">
          {scope ? <GovernanceScopePill scope={scope} /> : null}
          {helper ? (
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
              {helper}
            </span>
          ) : null}
        </div>
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
  regionLabel,
}: {
  sections: Array<{ id: Section; label: string; helper: string }>;
  active: Section;
  setActive: (section: Section) => void;
  regionLabel: string;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-[#dbe5ff] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_100%)] p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.05em] text-slate-900">
            {regionLabel}
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            Regional brand, governance and localisation controls.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill tone="blue">Regional Workspace</StatusPill>
            <StatusPill tone="green">Inherited Rules</StatusPill>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
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

      <div className="rounded-[22px] border border-[#dbe5ff] bg-[#f8faff] px-4 py-3.5">
        <p className="text-[13px] leading-5 text-[#4f6fff]">
          Regional settings inherit global rules. Locked global rules cannot be changed from this workspace.
        </p>
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
function ApproverSelector({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const roles = ["creator", "approver", "admin"];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {roles.map((role) => {
        const checked = value.includes(role);

        return (
          <button
            key={role}
            type="button"
            onClick={() =>
              onChange(
                checked
                  ? value.filter((item) => item !== role)
                  : [...value, role]
              )
            }
            className={cx(
              "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
              checked
                ? "border-[#5b7cff] bg-[#f7f9ff] text-[#4f6fff]"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
            )}
          >
            {capitalize(role)}
          </button>
        );
      })}
    </div>
  );
}
export default function BrandPage() {
  const searchParams = useSearchParams();
  const regionId = searchParams.get("region") || "mediascout-uk";
  const activeRegion = getRegion(regionId);
  const regionLabel = activeRegion.name;
  const isGlobalWorkspace = activeRegion.workspaceType === "global";

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

    approvals: {
      blocks: {
        enabled: true,
        requireApprovalBeforePublish: true,
        autoApproveLowRiskChanges: false,
        requireApprovalForTextChanges: true,
        requireApprovalForDesignChanges: true,
        requireApprovalForNewVariants: true,
        approvers: ["approver", "admin"],
      },
      pages: {
        enabled: true,
        requireApprovalBeforePublish: true,
        requireApprovalForMajorEdits: true,
        requireApprovalForTemplateChanges: true,
        autoApproveMinorEdits: false,
        approvers: ["approver", "admin"],
      },
      templates: {
        enabled: true,
        requireApprovalOnCreation: true,
        requireApprovalOnStructureChanges: true,
        requireApprovalBeforeUseInPages: true,
        approvers: ["admin"],
      },
      blockTypes: {
        enabled: true,
        requireApprovalOnCreation: true,
        requireApprovalBeforeUse: true,
        requireApprovalBeforeTemplateUse: true,
        requireApprovalForAiGeneratedTypes: true,
        approvers: ["admin"],
      },
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
      helper: "Lock rules and AI permissions",
    },
    {
      id: "approvals",
      label: "Approvals",
      helper: "Control what requires approval and who can approve it",
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
      <main className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
        <header className="border-b border-slate-200 bg-[#f5f7fb] px-6 py-5 lg:px-8">
          <div className="mx-auto max-w-[1800px]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#4f6fff] shadow-sm">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4Z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </div>

                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#4f6fff]">
                      Regional Settings
                    </p>
                    <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.05em] text-slate-900">
                      {activeSection?.label || "Regional Brand & Governance"}
                    </h1>
                  </div>
                </div>

                <p className="mt-3 max-w-[900px] text-sm leading-6 text-slate-500">
                  Manage {regionLabel} settings, inherited global rules, and approved regional overrides.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusPill tone="blue">{regionLabel}</StatusPill>
                <StatusPill tone="green">Inherited Global Rules</StatusPill>
                <StatusPill tone="amber">Regional Overrides</StatusPill>
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-0 overflow-y-auto px-6 py-6 lg:px-8">
          <div className="mx-auto grid max-w-[1800px] gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="hidden xl:block">
              <div className="sticky top-0">
                <LeftPanelNav
                  sections={sections}
                  active={active}
                  setActive={setActive}
                  regionLabel={regionLabel}
                />
              </div>
            </aside>

            <section className="min-w-0 space-y-5">
              {isGlobalWorkspace ? (
                <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
                  You are currently viewing the global workspace. Global governance is managed in Global Settings. Switch to a regional workspace to edit regional brand and governance overrides.
                </div>
              ) : null}

              <InheritanceNotice regionLabel={regionLabel} activeSection={active} />

              {active === "identity" && (
                <>
                  <FieldCard
                    title={`${regionLabel} Brand Identity`}
                    description="Regional identity settings inherit global brand context, with selected fields available for local adaptation."
                  >
                    <FieldGrid cols={2}>
                      <FieldGroup label="Brand Name" scope="inherited">
                        <Input
                          value={config.identity.brandName}
                          onChange={(v) => update("identity.brandName", v)}
                        />
                      </FieldGroup>

                      <FieldGroup label="Industry" scope="locked">
                        <Input
                          value={config.identity.industry}
                          onChange={(v) => update("identity.industry", v)}
                          disabled
                        />
                      </FieldGroup>

                      <FieldGroup label="Primary Offering" scope="inherited">
                        <Input
                          value={config.identity.primaryOffering}
                          onChange={(v) => update("identity.primaryOffering", v)}
                        />
                      </FieldGroup>

                      <FieldGroup label="Website Objective" scope="override">
                        <Input
                          value={config.identity.websiteObjective}
                          onChange={(v) => update("identity.websiteObjective", v)}
                        />
                      </FieldGroup>
                    </FieldGrid>

                    <div className="mt-5 space-y-5">
                      <FieldGroup label="Short Description" helper="GENERATION CONTEXT" scope="override">
                        <Textarea
                          value={config.identity.shortDescription}
                          onChange={(v) => update("identity.shortDescription", v)}
                          rows={4}
                        />
                      </FieldGroup>

                      <FieldGroup label="Long Description" helper="SYSTEM CONTEXT" scope="inherited">
                        <Textarea
                          value={config.identity.longDescription}
                          onChange={(v) => update("identity.longDescription", v)}
                          rows={5}
                        />
                      </FieldGroup>
                    </div>
                  </FieldCard>

                  <FieldCard
                    title="Regional Preview"
                    description={`How ${regionLabel} context will be passed into the generation layer.`}
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
                  title={`${regionLabel} Audience & Positioning`}
                  description="Adapt regional audience context while keeping the global market position intact."
                >
                  <div className="space-y-5">
                    <FieldGroup label="Primary Audience" scope="override">
                      <Textarea
                        value={config.audience.primaryAudience}
                        onChange={(v) => update("audience.primaryAudience", v)}
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Secondary Audience" scope="override">
                      <Textarea
                        value={config.audience.secondaryAudience}
                        onChange={(v) => update("audience.secondaryAudience", v)}
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Market Position" scope="inherited">
                      <Textarea
                        value={config.audience.marketPosition}
                        onChange={(v) => update("audience.marketPosition", v)}
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Value Proposition" scope="inherited">
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
                    title={`${regionLabel} Tone & Messaging`}
                    description="Localise language and messaging within the approved global tone system."
                  >
                    <FieldGrid cols={2}>
                      <FieldGroup label="Tone Style" scope="inherited">
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

                      <FieldGroup label="Language Variant" scope="override">
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
                  title={`${regionLabel} Terminology & Compliance`}
                  description="Manage local terminology, disclaimers and compliance notes while inheriting global claim rules."
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
                  title={`${regionLabel} CTA Rules`}
                  description="Set approved regional CTA language while respecting global CTA limits and tone."
                >
                  <FieldGrid cols={2}>
                    <FieldGroup label="Default CTA" scope="override">
                      <Input
                        value={config.cta.defaultCta}
                        onChange={(v) => update("cta.defaultCta", v)}
                      />
                    </FieldGroup>

                    <FieldGroup label="CTA Tone" scope="inherited">
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
                    <FieldGroup label="Allowed CTAs" helper="COMMA SEPARATED" scope="override">
                      <Textarea
                        value={stringifyList(config.cta.allowedCtas)}
                        onChange={(v) => update("cta.allowedCtas", parseList(v))}
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Secondary CTAs" helper="COMMA SEPARATED" scope="override">
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
                    description="Core colour tokens are inherited from global governance and should remain locked for regional users."
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
                    description="Visual rules are primarily controlled globally to keep every regional site consistent."
                  >
                    <FieldGrid cols={2}>
                      <FieldGroup label="Font Family" scope="locked">
                        <Input
                          value={config.visual.typography.fontFamily}
                          onChange={(v) =>
                            update("visual.typography.fontFamily", v)
                          }
                          disabled
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
                  description="Component rules are inherited globally so regional pages remain structurally consistent."
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
                  description="Accessibility standards are locked globally and inherited by every regional workspace."
                >
                  <FieldGrid cols={2}>
                    <FieldGroup label="Accessibility Standard" scope="locked">
                      <Select
                        value={config.accessibility.standard}
                        onChange={(v) => update("accessibility.standard", v)}
                        options={["WCAG AA", "WCAG AAA"]}
                        disabled
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
                  title={`${regionLabel} Governance`}
                  description="View inherited lock rules and control permitted regional AI behaviour."
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
                        onChange={(v) => update("governance.allowAiRewrite", v)}
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

{active === "approvals" && (
                <>
                  <FieldCard
                    title={`${regionLabel} Approval Policies`}
                    description="Regional approval settings inherit global defaults and can route work to local approvers where allowed."
                  >
                    <div className="rounded-[24px] border border-[#dbe5ff] bg-[#f8faff] p-5">
                      <p className="text-sm leading-6 text-slate-600">
                        Approval settings control human review. Governance rules still apply automatically even when approval is relaxed.
                      </p>
                    </div>
                  </FieldCard>

                  <FieldCard
                    title="Blocks"
                    description="Control approval rules for individual generated block instances."
                  >
                    <div className="grid gap-4">
                      <Toggle
                        checked={config.approvals.blocks.enabled}
                        onChange={(v) => update("approvals.blocks.enabled", v)}
                        label="Enable block approvals"
                      />

                      <Toggle
                        checked={config.approvals.blocks.requireApprovalBeforePublish}
                        onChange={(v) =>
                          update("approvals.blocks.requireApprovalBeforePublish", v)
                        }
                        label="Require approval before publish"
                      />

                      <Toggle
                        checked={config.approvals.blocks.requireApprovalForTextChanges}
                        onChange={(v) =>
                          update("approvals.blocks.requireApprovalForTextChanges", v)
                        }
                        label="Require approval for text changes"
                      />

                      <Toggle
                        checked={config.approvals.blocks.requireApprovalForDesignChanges}
                        onChange={(v) =>
                          update("approvals.blocks.requireApprovalForDesignChanges", v)
                        }
                        label="Require approval for design changes"
                      />

                      <Toggle
                        checked={config.approvals.blocks.requireApprovalForNewVariants}
                        onChange={(v) =>
                          update("approvals.blocks.requireApprovalForNewVariants", v)
                        }
                        label="Require approval for new variants"
                      />

                      <Toggle
                        checked={config.approvals.blocks.autoApproveLowRiskChanges}
                        onChange={(v) =>
                          update("approvals.blocks.autoApproveLowRiskChanges", v)
                        }
                        label="Auto-approve low-risk changes"
                      />

                      <FieldGroup label="Who can approve blocks">
                        <ApproverSelector
                          value={config.approvals.blocks.approvers}
                          onChange={(v) => update("approvals.blocks.approvers", v)}
                        />
                      </FieldGroup>
                    </div>
                  </FieldCard>

                  <FieldCard
                    title="Pages"
                    description="Control approval rules for full page publishing and major page edits."
                  >
                    <div className="grid gap-4">
                      <Toggle
                        checked={config.approvals.pages.enabled}
                        onChange={(v) => update("approvals.pages.enabled", v)}
                        label="Enable page approvals"
                      />

                      <Toggle
                        checked={config.approvals.pages.requireApprovalBeforePublish}
                        onChange={(v) =>
                          update("approvals.pages.requireApprovalBeforePublish", v)
                        }
                        label="Require approval before publish"
                      />

                      <Toggle
                        checked={config.approvals.pages.requireApprovalForMajorEdits}
                        onChange={(v) =>
                          update("approvals.pages.requireApprovalForMajorEdits", v)
                        }
                        label="Require approval for major edits"
                      />

                      <Toggle
                        checked={config.approvals.pages.requireApprovalForTemplateChanges}
                        onChange={(v) =>
                          update("approvals.pages.requireApprovalForTemplateChanges", v)
                        }
                        label="Require approval when template structure changes"
                      />

                      <Toggle
                        checked={config.approvals.pages.autoApproveMinorEdits}
                        onChange={(v) =>
                          update("approvals.pages.autoApproveMinorEdits", v)
                        }
                        label="Auto-approve minor edits"
                      />

                      <FieldGroup label="Who can approve pages">
                        <ApproverSelector
                          value={config.approvals.pages.approvers}
                          onChange={(v) => update("approvals.pages.approvers", v)}
                        />
                      </FieldGroup>
                    </div>
                  </FieldCard>

                  <FieldCard
                    title="Templates"
                    description="Control approval rules for creating, changing and releasing templates."
                  >
                    <div className="grid gap-4">
                      <Toggle
                        checked={config.approvals.templates.enabled}
                        onChange={(v) => update("approvals.templates.enabled", v)}
                        label="Enable template approvals"
                      />

                      <Toggle
                        checked={config.approvals.templates.requireApprovalOnCreation}
                        onChange={(v) =>
                          update("approvals.templates.requireApprovalOnCreation", v)
                        }
                        label="Require approval on creation"
                      />

                      <Toggle
                        checked={
                          config.approvals.templates.requireApprovalOnStructureChanges
                        }
                        onChange={(v) =>
                          update(
                            "approvals.templates.requireApprovalOnStructureChanges",
                            v
                          )
                        }
                        label="Require approval on structure changes"
                      />

                      <Toggle
                        checked={
                          config.approvals.templates.requireApprovalBeforeUseInPages
                        }
                        onChange={(v) =>
                          update(
                            "approvals.templates.requireApprovalBeforeUseInPages",
                            v
                          )
                        }
                        label="Require approval before templates can be used in pages"
                      />

                      <FieldGroup label="Who can approve templates">
                        <ApproverSelector
                          value={config.approvals.templates.approvers}
                          onChange={(v) => update("approvals.templates.approvers", v)}
                        />
                      </FieldGroup>
                    </div>
                  </FieldCard>

                  <FieldCard
                    title="Block Types"
                    description="Control approval rules for new block types created by users or AI."
                  >
                    <div className="grid gap-4">
                      <Toggle
                        checked={config.approvals.blockTypes.enabled}
                        onChange={(v) => update("approvals.blockTypes.enabled", v)}
                        label="Enable block type approvals"
                      />

                      <Toggle
                        checked={config.approvals.blockTypes.requireApprovalOnCreation}
                        onChange={(v) =>
                          update("approvals.blockTypes.requireApprovalOnCreation", v)
                        }
                        label="Require approval when a new block type is created"
                      />

                      <Toggle
                        checked={config.approvals.blockTypes.requireApprovalBeforeUse}
                        onChange={(v) =>
                          update("approvals.blockTypes.requireApprovalBeforeUse", v)
                        }
                        label="Require approval before first use"
                      />

                      <Toggle
                        checked={
                          config.approvals.blockTypes.requireApprovalBeforeTemplateUse
                        }
                        onChange={(v) =>
                          update(
                            "approvals.blockTypes.requireApprovalBeforeTemplateUse",
                            v
                          )
                        }
                        label="Require approval before adding to templates"
                      />

                      <Toggle
                        checked={
                          config.approvals.blockTypes.requireApprovalForAiGeneratedTypes
                        }
                        onChange={(v) =>
                          update(
                            "approvals.blockTypes.requireApprovalForAiGeneratedTypes",
                            v
                          )
                        }
                        label="Require approval for AI-generated block types"
                      />

                      <FieldGroup label="Who can approve block types">
                        <ApproverSelector
                          value={config.approvals.blockTypes.approvers}
                          onChange={(v) => update("approvals.blockTypes.approvers", v)}
                        />
                      </FieldGroup>
                    </div>
                  </FieldCard>
                </>
              )}

{active === "localisation" && (
                <FieldCard
                  title={`${regionLabel} Localisation`}
                  description="Localisation is the main regional override area for language, disclaimers, imagery and CTAs."
                >
                  <FieldGrid cols={2}>
                    <FieldGroup label="Default Locale" scope="override">
                      <Input
                        value={config.localisation.defaultLocale}
                        onChange={(v) => update("localisation.defaultLocale", v)}
                      />
                    </FieldGroup>

                    <FieldGroup label="Locale Fallback" scope="inherited">
                      <Input
                        value={config.localisation.localeFallback}
                        onChange={(v) => update("localisation.localeFallback", v)}
                      />
                    </FieldGroup>
                  </FieldGrid>

                  <div className="mt-5 space-y-5">
                    <FieldGroup label="Supported Locales" helper="COMMA SEPARATED" scope="override">
                      <Textarea
                        value={stringifyList(config.localisation.supportedLocales)}
                        onChange={(v) =>
                          update("localisation.supportedLocales", parseList(v))
                        }
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Region-Specific Imagery Rules" scope="regional">
                      <Textarea
                        value={config.localisation.regionSpecificImageryRules}
                        onChange={(v) =>
                          update("localisation.regionSpecificImageryRules", v)
                        }
                        rows={4}
                      />
                    </FieldGroup>

                    <FieldGroup label="Region-Specific CTA Rules" helper="COMMA SEPARATED" scope="regional">
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
            </section>
          </div>
        </div>

        <footer className="border-t border-slate-200 bg-[#f5f7fb] px-6 py-4 lg:px-8">
          <div className="mx-auto max-w-[1800px]">
            <div className="flex flex-col gap-3 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-5">
                <span>Region: {regionLabel}</span>
                <span>Global Inheritance: Enabled</span>
                <span>Regional Overrides: Controlled</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Reset
                </button>

                <button
                  type="button"
                  className="rounded-2xl bg-[#5b7cff] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
                >
                  Save regional settings
                </button>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}