"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CopyPlus,
  FileText,
  GripVertical,
  LayoutTemplate,
  Plus,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { COMPONENT_OPTIONS } from "@/lib/component-options";

type Role = "creator" | "approver" | "admin";

type TemplateCategory =
  | "service"
  | "landing"
  | "article"
  | "contact"
  | "resource"
  | "custom";

type BuilderStep = "overview" | "structure" | "rules";

type SectionForm = {
  id: string;
  key: string;
  label: string;
  description: string;
  helpText: string;
  required: boolean;
  canSkip: boolean;
  minInstances: number;
  maxInstances: number;
  allowedComponentIds: string[];
  defaultComponentId: string;
  lockedOrder: boolean;
  mustBeFirst: boolean;
  mustBeLast: boolean;
  imageMin: number;
  imageMax: number;
  promptHint: string;
  blockedInstructionsText: string;
};

type TemplatePreset = {
  id: string;
  label: string;
  description: string;
  category: TemplateCategory;
  sections: Array<Partial<SectionForm> & { label: string; key: string }>;
};

const SECTION_PRESETS: Array<{
  key: string;
  label: string;
  description: string;
  defaultComponentIds?: string[];
  defaultComponentId?: string;
  promptHint?: string;
  helpText?: string;
  required?: boolean;
  minInstances?: number;
  maxInstances?: number;
  lockedOrder?: boolean;
  mustBeFirst?: boolean;
  mustBeLast?: boolean;
}> = [
  {
    key: "hero",
    label: "Hero",
    description: "Primary opening section for the page.",
    defaultComponentIds: ["hero-standard"],
    defaultComponentId: "hero-standard",
    promptHint: "Introduce the page clearly and confidently.",
    helpText: "Explain the page purpose immediately.",
    required: true,
    minInstances: 1,
    maxInstances: 1,
    lockedOrder: true,
    mustBeFirst: true,
  },
  {
    key: "intro",
    label: "Intro",
    description: "Short supporting intro or context section.",
    promptHint: "Add concise supporting context.",
    helpText: "Use this to frame the rest of the page.",
    required: false,
    minInstances: 0,
    maxInstances: 1,
  },
  {
    key: "content",
    label: "Content",
    description: "Main explanatory section.",
    defaultComponentIds: ["value-points-grid"],
    defaultComponentId: "value-points-grid",
    promptHint: "Support the core proposition with structured content.",
    helpText: "Add benefits, proof, or structured supporting detail.",
    required: true,
    minInstances: 1,
    maxInstances: 3,
  },
  {
    key: "stats",
    label: "Stats",
    description: "Numerical proof or measurable outcomes.",
    promptHint: "Use clear, credible supporting metrics.",
    helpText: "Keep stat labels short and meaningful.",
    required: false,
    minInstances: 0,
    maxInstances: 1,
  },
  {
    key: "testimonials",
    label: "Testimonials",
    description: "Social proof and customer confidence.",
    promptHint: "Use concise, specific trust-building proof.",
    helpText: "Only include strong proof with real relevance.",
    required: false,
    minInstances: 0,
    maxInstances: 2,
  },
  {
    key: "faq",
    label: "FAQ",
    description: "Common questions and clarifications.",
    promptHint: "Answer likely objections clearly.",
    helpText: "Keep answers simple and useful.",
    required: false,
    minInstances: 0,
    maxInstances: 1,
  },
  {
    key: "cta",
    label: "Call to Action",
    description: "Closing conversion section.",
    promptHint: "Drive a clear next step for the user.",
    helpText: "Use a strong, direct CTA aligned to the page goal.",
    required: true,
    minInstances: 1,
    maxInstances: 1,
    mustBeLast: true,
  },
];

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "service-page",
    label: "Service Page",
    description: "For structured service positioning and conversion.",
    category: "service",
    sections: [
      {
        key: "hero",
        label: "Hero",
        required: true,
        lockedOrder: true,
        mustBeFirst: true,
        allowedComponentIds: ["hero-standard"],
        defaultComponentId: "hero-standard",
        description: "Primary opening section for the page.",
        helpText: "Explain the service clearly and confidently.",
        promptHint: "Introduce the service clearly and confidently.",
        minInstances: 1,
        maxInstances: 1,
      },
      {
        key: "intro",
        label: "Intro",
        required: false,
        description: "Short supporting intro section.",
        helpText: "Frame the service before deeper content.",
        minInstances: 0,
        maxInstances: 1,
      },
      {
        key: "content",
        label: "Content",
        required: true,
        allowedComponentIds: ["value-points-grid"],
        defaultComponentId: "value-points-grid",
        description: "Main explanatory section.",
        helpText: "Add benefits, detail, and proof.",
        promptHint: "Support the service proposition with structured content.",
        minInstances: 1,
        maxInstances: 3,
      },
      {
        key: "cta",
        label: "Call to Action",
        required: true,
        mustBeLast: true,
        description: "Closing conversion section.",
        helpText: "Use a strong next-step CTA.",
        promptHint: "Drive a clear next step for the user.",
        minInstances: 1,
        maxInstances: 1,
      },
    ],
  },
  {
    id: "landing-page",
    label: "Landing Page",
    description: "For campaigns, propositions, and focused journeys.",
    category: "landing",
    sections: [
      {
        key: "hero",
        label: "Hero",
        required: true,
        lockedOrder: true,
        mustBeFirst: true,
        allowedComponentIds: ["hero-standard"],
        defaultComponentId: "hero-standard",
        minInstances: 1,
        maxInstances: 1,
      },
      {
        key: "content",
        label: "Content",
        required: true,
        allowedComponentIds: ["value-points-grid"],
        defaultComponentId: "value-points-grid",
        minInstances: 1,
        maxInstances: 2,
      },
      {
        key: "testimonials",
        label: "Testimonials",
        required: false,
        minInstances: 0,
        maxInstances: 1,
      },
      {
        key: "cta",
        label: "Call to Action",
        required: true,
        mustBeLast: true,
        minInstances: 1,
        maxInstances: 1,
      },
    ],
  },
  {
    id: "article-page",
    label: "Article Page",
    description: "For editorial and knowledge-led content.",
    category: "article",
    sections: [
      {
        key: "hero",
        label: "Hero",
        required: true,
        lockedOrder: true,
        mustBeFirst: true,
        minInstances: 1,
        maxInstances: 1,
      },
      {
        key: "content",
        label: "Article Body",
        required: true,
        minInstances: 1,
        maxInstances: 10,
      },
      {
        key: "faq",
        label: "Related Questions",
        required: false,
        minInstances: 0,
        maxInstances: 1,
      },
      {
        key: "cta",
        label: "Call to Action",
        required: false,
        mustBeLast: true,
        minInstances: 0,
        maxInstances: 1,
      },
    ],
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function getComponentName(id: string) {
  return COMPONENT_OPTIONS.find((component) => component.id === id)?.name ?? id;
}

function createEmptySection(index: number): SectionForm {
  return {
    id: crypto.randomUUID(),
    key: `section-${index + 1}`,
    label: "",
    description: "",
    helpText: "",
    required: true,
    canSkip: false,
    minInstances: 1,
    maxInstances: 1,
    allowedComponentIds: [],
    defaultComponentId: "",
    lockedOrder: false,
    mustBeFirst: index === 0,
    mustBeLast: false,
    imageMin: 0,
    imageMax: 0,
    promptHint: "",
    blockedInstructionsText: "",
  };
}

function createSectionFromPreset(
  preset: Partial<SectionForm> & { label: string; key: string },
  index: number
): SectionForm {
  return {
    ...createEmptySection(index),
    label: preset.label,
    key: preset.key,
    description: preset.description ?? "",
    helpText: preset.helpText ?? "",
    required: preset.required ?? true,
    canSkip: preset.canSkip ?? false,
    minInstances: preset.minInstances ?? 1,
    maxInstances: preset.maxInstances ?? 1,
    allowedComponentIds: preset.allowedComponentIds ?? [],
    defaultComponentId: preset.defaultComponentId ?? "",
    lockedOrder: preset.lockedOrder ?? false,
    mustBeFirst: preset.mustBeFirst ?? index === 0,
    mustBeLast: preset.mustBeLast ?? false,
    imageMin: preset.imageMin ?? 0,
    imageMax: preset.imageMax ?? 0,
    promptHint: preset.promptHint ?? "",
    blockedInstructionsText: preset.blockedInstructionsText ?? "",
  };
}

function FieldLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {children}
      </span>
      {hint ? (
        <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>
      ) : null}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition",
        "placeholder:text-slate-400 focus:border-[#cfd8f6] focus:ring-4 focus:ring-[#eef3ff]",
        props.className
      )}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(
        "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition",
        "placeholder:text-slate-400 focus:border-[#cfd8f6] focus:ring-4 focus:ring-[#eef3ff]",
        props.className
      )}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cx(
        "mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition",
        "focus:border-[#cfd8f6] focus:ring-4 focus:ring-[#eef3ff]",
        props.className
      )}
    />
  );
}

function StepBarItem({
  index,
  title,
  subtitle,
  active,
  complete,
  onClick,
}: {
  index: number;
  title: string;
  subtitle: string;
  active: boolean;
  complete?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="group min-w-0 text-left">
      <div className="flex items-start gap-3">
        <div
          className={cx(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 transition",
            active
              ? "bg-[#5b7cff] text-white ring-[#5b7cff]"
              : complete
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-white text-slate-500 ring-slate-200"
          )}
        >
          {complete && !active ? <Check className="h-4 w-4" /> : index + 1}
        </div>

        <div className="min-w-0">
          <p
            className={cx(
              "text-sm font-semibold transition",
              active ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900"
            )}
          >
            {title}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
        </div>
      </div>

      <div className="mt-4 h-[3px] w-full rounded-full bg-slate-200">
        <div
          className={cx(
            "h-[3px] rounded-full transition-all duration-200",
            active
              ? "w-full bg-[#5b7cff]"
              : complete
                ? "w-full bg-emerald-500"
                : "w-0 bg-transparent"
          )}
        />
      </div>
    </button>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-6",
        className
      )}
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {children}
    </section>
  );
}

function SectionChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
    >
      {label}
    </button>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

export default function NewTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return value === "creator" || value === "approver" || value === "admin"
      ? value
      : "admin";
  }, [searchParams]);

  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<BuilderStep>("overview");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("service-page");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("service");
  const [audience, setAudience] = useState("");
  const [purpose, setPurpose] = useState("");
  const [defaultAiInstruction, setDefaultAiInstruction] = useState("");

  const [sections, setSections] = useState<SectionForm[]>([]);

  useEffect(() => {
    const preset = TEMPLATE_PRESETS.find((item) => item.id === selectedPresetId);
    if (!preset || sections.length > 0) return;

    const builtSections = preset.sections.map((section, index) =>
      createSectionFromPreset(section, index)
    );

    setCategory(preset.category);
    setSections(builtSections);
    setActiveSectionId(builtSections[0]?.id ?? null);
  }, [selectedPresetId, sections.length]);

  const activeSection =
    sections.find((section) => section.id === activeSectionId) ?? sections[0] ?? null;

  const overviewComplete = Boolean(name.trim());
  const structureComplete =
    sections.length > 0 && sections.every((section) => section.label.trim());
  const rulesComplete =
    sections.length > 0 &&
    sections.every((section) => section.allowedComponentIds.length > 0);

  function updateSection(id: string, patch: Partial<SectionForm>) {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, ...patch } : section
      )
    );
  }

  function reindexSections(next: SectionForm[]) {
    return next.map((section, index) => ({
      ...section,
      mustBeFirst: section.mustBeFirst ? index === 0 : false,
      mustBeLast: section.mustBeLast
        ? index === next.length - 1
        : false,
    }));
  }

  function handleAddEmptySection() {
    const next = createEmptySection(sections.length);
    setSections((prev) => [...prev, next]);
    setActiveSectionId(next.id);
  }

  function handleAddPresetSection(
    preset: (typeof SECTION_PRESETS)[number]
  ) {
    const next = createSectionFromPreset(preset, sections.length);
    setSections((prev) => [...prev, next]);
    setActiveSectionId(next.id);
  }

  function handleDeleteSection(id: string) {
    setSections((prev) => {
      const next = reindexSections(prev.filter((section) => section.id !== id));
      return next;
    });

    if (activeSectionId === id) {
      const remaining = sections.filter((section) => section.id !== id);
      setActiveSectionId(remaining[0]?.id ?? null);
    }
  }

  function handleDuplicateSection(id: string) {
    const source = sections.find((section) => section.id === id);
    if (!source) return;

    const duplicate: SectionForm = {
      ...source,
      id: crypto.randomUUID(),
      key: `${source.key}-copy`,
      label: `${source.label} Copy`,
      mustBeFirst: false,
      mustBeLast: false,
      lockedOrder: false,
    };

    setSections((prev) => [...prev, duplicate]);
    setActiveSectionId(duplicate.id);
  }

  function moveSection(id: string, direction: "up" | "down") {
    setSections((prev) => {
      const index = prev.findIndex((section) => section.id === id);
      if (index === -1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);

      return reindexSections(next);
    });
  }

  function toggleAllowedComponent(sectionId: string, componentId: string, checked: boolean) {
    const section = sections.find((item) => item.id === sectionId);
    if (!section) return;

    const nextAllowed = checked
      ? [...section.allowedComponentIds, componentId]
      : section.allowedComponentIds.filter((id) => id !== componentId);

    updateSection(sectionId, {
      allowedComponentIds: nextAllowed,
      defaultComponentId: nextAllowed.includes(section.defaultComponentId)
        ? section.defaultComponentId
        : nextAllowed[0] || "",
    });
  }

  function applyTemplatePreset(presetId: string) {
    const preset = TEMPLATE_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    const builtSections = preset.sections.map((section, index) =>
      createSectionFromPreset(section, index)
    );

    setSelectedPresetId(presetId);
    setCategory(preset.category);
    setSections(builtSections);
    setActiveSectionId(builtSections[0]?.id ?? null);

    if (!name.trim()) {
      setName(preset.label);
    }
    if (!description.trim()) {
      setDescription(preset.description);
    }
  }

  function goNext() {
    if (step === "overview") {
      setStep("structure");
      return;
    }
    if (step === "structure") {
      setStep("rules");
    }
  }

  function goBack() {
    if (step === "rules") {
      setStep("structure");
      return;
    }
    if (step === "structure") {
      setStep("overview");
    }
  }

  async function handleSaveTemplate() {
    try {
      setIsSaving(true);

      if (!name.trim()) {
        alert("Please enter a template name.");
        setStep("overview");
        return;
      }

      if (sections.length === 0) {
        alert("Please add at least one section.");
        setStep("structure");
        return;
      }

      const payload = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        description: description.trim(),
        category,
        audience: audience.trim(),
        purpose: purpose.trim(),
        defaultAiInstruction: defaultAiInstruction.trim(),
        status: "draft",
        createdByUserId: "user-1",
        updatedByUserId: "user-1",
        sections: sections.map((section, index) => ({
          id: section.id,
          key: section.key.trim() || slugify(section.label || `section-${index + 1}`),
          label: section.label.trim() || `Section ${index + 1}`,
          description: section.description.trim(),
          helpText: section.helpText.trim(),
          order: index,
          required: section.required,
          canSkip: section.canSkip,
          minInstances: section.minInstances,
          maxInstances: section.maxInstances,
          allowedComponentIds: section.allowedComponentIds,
          defaultComponentId: section.defaultComponentId.trim() || null,
          lockedOrder: section.lockedOrder,
          mustBeFirst: section.mustBeFirst,
          mustBeLast: section.mustBeLast,
          imageRequirement: {
            min: section.imageMin,
            max: section.imageMax,
            requiredAltText: false,
          },
          ai: {
            promptHint: section.promptHint.trim(),
            blockedInstructions: section.blockedInstructionsText
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean),
            generateScope: "copy_and_layout",
          },
          permissions: {
            creatorCanEdit: true,
            approverCanEdit: true,
            adminCanEdit: true,
            copyLocked: false,
            layoutLocked: false,
          },
        })),
      };

      const res = await fetch(`/api/templates?role=${role}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.template?.id) {
        throw new Error(json?.error || "Failed to create template.");
      }

      router.push(`/templates/${json.template.id}?role=${role}`);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save template.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[#f5f7fb] text-slate-900">
      <div className="mx-auto max-w-[1880px] px-5 py-5 lg:px-7 lg:py-6">
        <section className="rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_100%)] p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] lg:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/templates?role=${role}`)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Templates
                </button>

                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#4f6fff]">
                  Template Builder
                </p>
              </div>

              <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-slate-900 lg:text-[34px]">
                Create a new governed template
              </h1>

              <p className="mt-2 max-w-[880px] text-sm leading-6 text-slate-500">
                Start with a page type, shape the structure visually, then refine the
                rules section by section.
              </p>
            </div>

            <div className="flex w-full max-w-[520px] flex-col gap-2 xl:items-end">
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Template"}
              </button>

              <p className="text-sm text-slate-500">
                Draft first. Publish once the structure and rules are ready.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-6">
          <div className="grid gap-5 lg:grid-cols-3">
            <StepBarItem
              index={0}
              title="Overview"
              subtitle="Template identity and preset"
              active={step === "overview"}
              complete={overviewComplete}
              onClick={() => setStep("overview")}
            />
            <StepBarItem
              index={1}
              title="Structure"
              subtitle="Visual page blueprint"
              active={step === "structure"}
              complete={structureComplete}
              onClick={() => setStep("structure")}
            />
            <StepBarItem
              index={2}
              title="Rules"
              subtitle="Allowed blocks and section logic"
              active={step === "rules"}
              complete={rulesComplete}
              onClick={() => setStep("rules")}
            />
          </div>
        </div>

        {step === "overview" ? (
          <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-7">
              <div className="mb-8 max-w-[760px]">
                <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
                  Template overview
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Give the template a clear identity, then choose the closest starting
                  point so admins are not building from scratch.
                </p>
              </div>

              <div className="mb-8">
                <FieldLabel hint="Start from a sensible structure, then refine it.">
                  Template Preset
                </FieldLabel>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {TEMPLATE_PRESETS.map((preset) => {
                    const active = selectedPresetId === preset.id;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyTemplatePreset(preset.id)}
                        className={cx(
                          "rounded-[22px] border p-4 text-left transition",
                          active
                            ? "border-[#cfd8f6] bg-[#f7f9ff] shadow-[0_10px_24px_rgba(91,124,255,0.08)]"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {preset.label}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              {preset.description}
                            </p>
                          </div>

                          {active ? (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5b7cff] text-white">
                              <Check className="h-4 w-4" />
                            </div>
                          ) : null}
                        </div>

                        <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                          {preset.sections.length} sections
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <FieldLabel>Template Name</FieldLabel>
                  <TextInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Service Page"
                  />
                </div>

                <div>
                  <FieldLabel hint="Optional. Leave blank to generate from the name.">
                    Slug
                  </FieldLabel>
                  <TextInput
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="service-page"
                  />
                </div>

                <div>
                  <FieldLabel>Category</FieldLabel>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                  >
                    <option value="service">Service</option>
                    <option value="landing">Landing</option>
                    <option value="article">Article</option>
                    <option value="contact">Contact</option>
                    <option value="resource">Resource</option>
                    <option value="custom">Custom</option>
                  </Select>
                </div>

                <div>
                  <FieldLabel>Audience</FieldLabel>
                  <TextInput
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="Enterprise buyers"
                  />
                </div>

                <div className="lg:col-span-2">
                  <FieldLabel>Description</FieldLabel>
                  <TextArea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="A governed template for core service pages."
                  />
                </div>

                <div className="lg:col-span-2">
                  <FieldLabel>Purpose</FieldLabel>
                  <TextInput
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Explain services and drive conversion"
                  />
                </div>

                <div className="lg:col-span-2">
                  <FieldLabel hint="Applies across the full template unless section rules override it.">
                    Default AI Instruction
                  </FieldLabel>
                  <TextArea
                    value={defaultAiInstruction}
                    onChange={(e) => setDefaultAiInstruction(e.target.value)}
                    rows={4}
                    placeholder="Maintain a clear, authoritative, enterprise tone."
                  />
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <Panel
                title="What happens next"
                subtitle="A simpler creation flow."
                icon={<Sparkles className="h-5 w-5" />}
              >
                <div className="space-y-3">
                  {[
                    {
                      title: "Choose a page baseline",
                      text: "Use a preset so admins are not starting from a blank template.",
                    },
                    {
                      title: "Shape the structure visually",
                      text: "Review section order and add or remove parts of the page.",
                    },
                    {
                      title: "Refine section rules",
                      text: "Choose allowed blocks and define section-specific controls.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel
                title="Current draft summary"
                subtitle="A quick snapshot as you build."
                icon={<LayoutTemplate className="h-5 w-5" />}
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <MiniStat label="Preset" value={TEMPLATE_PRESETS.find((p) => p.id === selectedPresetId)?.label ?? "Custom"} />
                  <MiniStat label="Sections" value={sections.length} />
                  <MiniStat label="Required" value={sections.filter((s) => s.required).length} />
                  <MiniStat label="Allowed blocks" value={sections.reduce((sum, section) => sum + section.allowedComponentIds.length, 0)} />
                </div>
              </Panel>
            </aside>
          </div>
        ) : null}

        {step === "structure" ? (
          <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
            <main className="min-w-0">
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-7">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-[760px]">
                    <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
                      Page structure
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Shape the template as a visual page blueprint. Keep the main flow
                      simple and scan-friendly.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddEmptySection}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Custom Section
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Quick section presets
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {SECTION_PRESETS.map((preset) => (
                      <SectionChip
                        key={preset.key}
                        label={preset.label}
                        onClick={() => handleAddPresetSection(preset)}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MiniStat label="Sections" value={sections.length} />
                  <MiniStat
                    label="Required"
                    value={sections.filter((s) => s.required).length}
                  />
                  <MiniStat
                    label="Optional"
                    value={sections.filter((s) => !s.required).length}
                  />
                  <MiniStat
                    label="Locked order"
                    value={sections.filter((s) => s.lockedOrder).length}
                  />
                </div>

                <div className="mt-6 space-y-4">
                  {sections.map((section, index) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSectionId(section.id)}
                      className={cx(
                        "w-full rounded-[26px] border px-5 py-5 text-left transition",
                        activeSection?.id === section.id
                          ? "border-[#cfd8f6] bg-[#f7f9ff] shadow-[0_12px_28px_rgba(91,124,255,0.08)]"
                          : "border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] shadow-sm hover:border-slate-300"
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef3ff] text-sm font-semibold text-[#4f6fff] ring-1 ring-[#dbe5ff]">
                            {index + 1}
                          </div>

                          <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">
                              {section.label.trim() || `Section ${index + 1}`}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span
                                className={cx(
                                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                                  section.required
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                )}
                              >
                                {section.required ? "Required" : "Optional"}
                              </span>

                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                {section.allowedComponentIds.length} blocks
                              </span>

                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                {section.minInstances}–{section.maxInstances} instances
                              </span>

                              {section.mustBeFirst ? (
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                  Must be first
                                </span>
                              ) : null}

                              {section.mustBeLast ? (
                                <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                                  Must be last
                                </span>
                              ) : null}

                              {section.lockedOrder ? (
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                  Order locked
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateSection(section.id);
                            }}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                          >
                            <CopyPlus className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSection(section.id, "up");
                            }}
                            disabled={index === 0}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-40"
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSection(section.id, "down");
                            }}
                            disabled={index === sections.length - 1}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-40"
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSection(section.id);
                            }}
                            className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {section.description ? (
                        <p className="mt-4 text-sm leading-6 text-slate-500">
                          {section.description}
                        </p>
                      ) : null}
                    </button>
                  ))}
                </div>
              </section>
            </main>

            <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              <Panel
                title="Selected section"
                subtitle="Edit the currently selected section while keeping the page blueprint visible."
                icon={<FileText className="h-5 w-5" />}
              >
                {!activeSection ? (
                  <p className="text-sm text-slate-500">
                    Select a section to edit it.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <FieldLabel>Section Label</FieldLabel>
                      <TextInput
                        value={activeSection.label}
                        onChange={(e) =>
                          updateSection(activeSection.id, {
                            label: e.target.value,
                            key:
                              !activeSection.key || activeSection.key.startsWith("section-")
                                ? slugify(e.target.value)
                                : activeSection.key,
                          })
                        }
                        placeholder="Hero"
                      />
                    </div>

                    <div>
                      <FieldLabel>Section Key</FieldLabel>
                      <TextInput
                        value={activeSection.key}
                        onChange={(e) =>
                          updateSection(activeSection.id, {
                            key: slugify(e.target.value),
                          })
                        }
                        placeholder="hero"
                      />
                    </div>

                    <div>
                      <FieldLabel>Description</FieldLabel>
                      <TextArea
                        value={activeSection.description}
                        onChange={(e) =>
                          updateSection(activeSection.id, {
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        placeholder="Describe what this section is for."
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">
                          Required
                        </span>
                        <input
                          type="checkbox"
                          checked={activeSection.required}
                          onChange={(e) =>
                            updateSection(activeSection.id, {
                              required: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-[#5b7cff]"
                        />
                      </label>

                      <label className="flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">
                          Can Skip
                        </span>
                        <input
                          type="checkbox"
                          checked={activeSection.canSkip}
                          onChange={(e) =>
                            updateSection(activeSection.id, {
                              canSkip: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-[#5b7cff]"
                        />
                      </label>

                      <label className="flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">
                          Locked Order
                        </span>
                        <input
                          type="checkbox"
                          checked={activeSection.lockedOrder}
                          onChange={(e) =>
                            updateSection(activeSection.id, {
                              lockedOrder: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-[#5b7cff]"
                        />
                      </label>

                      <label className="flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">
                          Must Be First
                        </span>
                        <input
                          type="checkbox"
                          checked={activeSection.mustBeFirst}
                          onChange={(e) =>
                            updateSection(activeSection.id, {
                              mustBeFirst: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-[#5b7cff]"
                        />
                      </label>

                      <label className="flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2">
                        <span className="text-sm font-medium text-slate-700">
                          Must Be Last
                        </span>
                        <input
                          type="checkbox"
                          checked={activeSection.mustBeLast}
                          onChange={(e) =>
                            updateSection(activeSection.id, {
                              mustBeLast: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-[#5b7cff]"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </Panel>
            </aside>
          </div>
        ) : null}

        {step === "rules" ? (
          <div className="mt-5 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900">
                    Sections
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose a section to configure.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {sections.map((section, index) => {
                  const isActive = activeSection?.id === section.id;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSectionId(section.id)}
                      className={cx(
                        "flex w-full items-center gap-3 rounded-[22px] border px-4 py-4 text-left transition",
                        isActive
                          ? "border-[#cfdcff] bg-[#f7f9ff]"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                    >
                      <div
                        className={cx(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          isActive
                            ? "bg-[#5b7cff] text-white"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {section.label.trim() || `Section ${index + 1}`}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {section.allowedComponentIds.length} allowed blocks
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="min-w-0">
              {!activeSection ? (
                <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <Sparkles className="mx-auto mb-4 h-8 w-8 text-slate-300" />
                  <p className="text-sm font-medium text-slate-700">
                    Select a section to configure it
                  </p>
                </div>
              ) : (
                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-7">
                  <div className="mb-6">
                    <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
                      Section rules
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Control what this section is allowed to use and how it should
                      behave.
                    </p>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="lg:col-span-2">
                      <FieldLabel>Helper Text</FieldLabel>
                      <TextArea
                        value={activeSection.helpText}
                        onChange={(e) =>
                          updateSection(activeSection.id, {
                            helpText: e.target.value,
                          })
                        }
                        rows={3}
                        placeholder="Guidance shown to the marketer using this template."
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <FieldLabel hint="Choose real block types from your registry.">
                        Allowed Components
                      </FieldLabel>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {COMPONENT_OPTIONS.map((component) => {
                          const checked = activeSection.allowedComponentIds.includes(component.id);

                          return (
                            <label
                              key={component.id}
                              className="flex cursor-pointer items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  toggleAllowedComponent(
                                    activeSection.id,
                                    component.id,
                                    e.target.checked
                                  )
                                }
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#5b7cff]"
                              />

                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900">
                                  {component.name}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {component.category} · {component.id}
                                </p>
                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                  {component.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <FieldLabel>Default Component</FieldLabel>
                      <Select
                        value={activeSection.defaultComponentId}
                        onChange={(e) =>
                          updateSection(activeSection.id, {
                            defaultComponentId: e.target.value,
                          })
                        }
                      >
                        <option value="">Select default component</option>
                        {COMPONENT_OPTIONS.filter((component) =>
                          activeSection.allowedComponentIds.includes(component.id)
                        ).map((component) => (
                          <option key={component.id} value={component.id}>
                            {component.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="lg:col-span-2">
                      <FieldLabel>AI Prompt Hint</FieldLabel>
                      <TextInput
                        value={activeSection.promptHint}
                        onChange={(e) =>
                          updateSection(activeSection.id, {
                            promptHint: e.target.value,
                          })
                        }
                        placeholder="Introduce the page clearly."
                      />
                    </div>

                    <div>
                      <FieldLabel>Min Instances</FieldLabel>
                      <TextInput
                        type="number"
                        min={0}
                        value={activeSection.minInstances}
                        onChange={(e) =>
                          updateSection(activeSection.id, {
                            minInstances: Number(e.target.value || 0),
                          })
                        }
                      />
                    </div>

                    <div>
                      <FieldLabel>Max Instances</FieldLabel>
                      <TextInput
                        type="number"
                        min={1}
                        value={activeSection.maxInstances}
                        onChange={(e) =>
                          updateSection(activeSection.id, {
                            maxInstances: Number(e.target.value || 1),
                          })
                        }
                      />
                    </div>

                    <div>
                      <FieldLabel>Minimum Images</FieldLabel>
                      <TextInput
                        type="number"
                        min={0}
                        value={activeSection.imageMin}
                        onChange={(e) =>
                          updateSection(activeSection.id, {
                            imageMin: Number(e.target.value || 0),
                          })
                        }
                      />
                    </div>

                    <div>
                      <FieldLabel>Maximum Images</FieldLabel>
                      <TextInput
                        type="number"
                        min={0}
                        value={activeSection.imageMax}
                        onChange={(e) =>
                          updateSection(activeSection.id, {
                            imageMax: Number(e.target.value || 0),
                          })
                        }
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <FieldLabel hint="One blocked instruction per line.">
                        Blocked Instructions
                      </FieldLabel>
                      <TextArea
                        value={activeSection.blockedInstructionsText}
                        onChange={(e) =>
                          updateSection(activeSection.id, {
                            blockedInstructionsText: e.target.value,
                          })
                        }
                        rows={4}
                        placeholder={"Do not use exaggerated claims\nDo not change legal language"}
                      />
                    </div>
                  </div>
                </section>
              )}
            </main>
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === "overview"}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {step !== "rules" ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5]"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveTemplate}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Template"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}