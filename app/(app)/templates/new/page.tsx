"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  GripVertical,
  Plus,
  Save,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";

type Role = "creator" | "approver" | "admin";

type TemplateCategory =
  | "service"
  | "landing"
  | "article"
  | "contact"
  | "resource"
  | "custom";

type BuilderStep = "overview" | "structure" | "settings";

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
  allowedComponentIdsText: string;
  defaultComponentId: string;
  lockedOrder: boolean;
  mustBeFirst: boolean;
  mustBeLast: boolean;
  imageMin: number;
  imageMax: number;
  promptHint: string;
  blockedInstructionsText: string;
};

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
    allowedComponentIdsText: "",
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
    <button
      type="button"
      onClick={onClick}
      className="group min-w-0 text-left"
    >
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
          {index + 1}
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

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("service");
  const [audience, setAudience] = useState("");
  const [purpose, setPurpose] = useState("");
  const [defaultAiInstruction, setDefaultAiInstruction] = useState("");

  const [sections, setSections] = useState<SectionForm[]>([
    {
      ...createEmptySection(0),
      label: "Hero",
      key: "hero",
      allowedComponentIdsText: "hero-standard, hero-split",
      defaultComponentId: "hero-standard",
      promptHint: "Introduce the page clearly and confidently.",
      description: "Primary opening section for the page.",
      helpText: "Explain the main purpose of the page immediately.",
      required: true,
      minInstances: 1,
      maxInstances: 1,
      lockedOrder: true,
      mustBeFirst: true,
    },
    {
      ...createEmptySection(1),
      label: "Content",
      key: "content",
      allowedComponentIdsText: "value-points-grid",
      defaultComponentId: "value-points-grid",
      promptHint: "Support the core proposition with structured content.",
      description: "Main explanatory body section.",
      helpText: "Add benefits, proof, or structured supporting detail.",
      required: true,
      minInstances: 1,
      maxInstances: 3,
    },
    {
      ...createEmptySection(2),
      label: "Call to Action",
      key: "cta",
      allowedComponentIdsText: "cta-banner",
      defaultComponentId: "cta-banner",
      promptHint: "Drive a clear next step for the user.",
      description: "Closing conversion section.",
      helpText: "Use a strong, direct CTA aligned to the page goal.",
      required: true,
      minInstances: 1,
      maxInstances: 1,
      mustBeLast: true,
    },
  ]);

  const activeSection =
    sections.find((section) => section.id === activeSectionId) ?? sections[0] ?? null;

  const overviewComplete = Boolean(name.trim());
  const structureComplete =
    sections.length > 0 && sections.every((section) => section.label.trim());
  const settingsComplete =
    sections.length > 0 &&
    sections.every((section) => section.allowedComponentIdsText.trim());

  function updateSection(id: string, patch: Partial<SectionForm>) {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, ...patch } : section
      )
    );
  }

  function handleAddSection() {
    const next = createEmptySection(sections.length);
    setSections((prev) => [...prev, next]);
    setActiveSectionId(next.id);
  }

  function handleDeleteSection(id: string) {
    setSections((prev) => {
      const next = prev.filter((section) => section.id !== id);
      return next.map((section, index) => ({
        ...section,
        mustBeFirst: section.mustBeFirst && index === 0,
      }));
    });

    if (activeSectionId === id) {
      const remaining = sections.filter((section) => section.id !== id);
      setActiveSectionId(remaining[0]?.id ?? null);
    }
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

      return next;
    });
  }

  function goNext() {
    if (step === "overview") {
      setStep("structure");
      return;
    }
    if (step === "structure") {
      setStep("settings");
    }
  }

  function goBack() {
    if (step === "settings") {
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
          allowedComponentIds: section.allowedComponentIdsText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
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
                Draft first. Publish when the structure is ready.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-6">
          <div className="grid gap-5 lg:grid-cols-3">
            <StepBarItem
              index={0}
              title="Overview"
              subtitle="Name, purpose and page type"
              active={step === "overview"}
              complete={overviewComplete}
              onClick={() => setStep("overview")}
            />
            <StepBarItem
              index={1}
              title="Page Structure"
              subtitle="Define the page sections"
              active={step === "structure"}
              complete={structureComplete}
              onClick={() => setStep("structure")}
            />
            <StepBarItem
              index={2}
              title="Section Settings"
              subtitle="Control each section in detail"
              active={step === "settings"}
              complete={settingsComplete}
              onClick={() => setStep("settings")}
            />
          </div>
        </div>

        {step === "overview" && (
          <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-7">
            <div className="mb-8 max-w-[760px]">
              <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
                Template overview
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Start with the essentials. Give this template a clear identity so teams
                understand when to use it and what kind of page it is meant to produce.
              </p>
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
        )}

        {step === "structure" && (
          <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-7">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-[760px]">
                <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
                  Page structure
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This is the core of the template. Define the sections marketers will
                  move through and set the page structure in the right order.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddSection}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                Add Section
              </button>
            </div>

            <div className="space-y-4">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className="rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] px-5 py-5 shadow-sm"
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
                            {section.allowedComponentIdsText
                              ? section.allowedComponentIdsText
                              : "No components yet"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSectionId(section.id);
                          setStep("settings");
                        }}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit Settings
                      </button>

                      <button
                        type="button"
                        onClick={() => moveSection(section.id, "up")}
                        disabled={index === 0}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-40"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() => moveSection(section.id, "down")}
                        disabled={index === sections.length - 1}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-40"
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSection(section.id)}
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
                </div>
              ))}
            </div>
          </section>
        )}

        {step === "settings" && (
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
                          {section.required ? "Required" : "Optional"}
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
                      Section settings
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Define what this section allows, how it behaves, and what guidance
                      marketers should see.
                    </p>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
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

                    <div className="lg:col-span-2">
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
                      <FieldLabel hint="Comma separated component IDs from your registry.">
                        Allowed Components
                      </FieldLabel>
                      <TextInput
                        value={activeSection.allowedComponentIdsText}
                        onChange={(e) =>
                          updateSection(activeSection.id, {
                            allowedComponentIdsText: e.target.value,
                          })
                        }
                        placeholder="hero-standard, hero-split"
                      />
                    </div>

                    <div>
                      <FieldLabel>Default Component</FieldLabel>
                      <TextInput
                        value={activeSection.defaultComponentId}
                        onChange={(e) =>
                          updateSection(activeSection.id, {
                            defaultComponentId: e.target.value,
                          })
                        }
                        placeholder="hero-standard"
                      />
                    </div>

                    <div>
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

                    <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {[
                        {
                          label: "Required Section",
                          checked: activeSection.required,
                          onChange: (checked: boolean) =>
                            updateSection(activeSection.id, { required: checked }),
                        },
                        {
                          label: "Can Skip",
                          checked: activeSection.canSkip,
                          onChange: (checked: boolean) =>
                            updateSection(activeSection.id, { canSkip: checked }),
                        },
                        {
                          label: "Locked Order",
                          checked: activeSection.lockedOrder,
                          onChange: (checked: boolean) =>
                            updateSection(activeSection.id, { lockedOrder: checked }),
                        },
                        {
                          label: "Must Be First",
                          checked: activeSection.mustBeFirst,
                          onChange: (checked: boolean) =>
                            updateSection(activeSection.id, { mustBeFirst: checked }),
                        },
                        {
                          label: "Must Be Last",
                          checked: activeSection.mustBeLast,
                          onChange: (checked: boolean) =>
                            updateSection(activeSection.id, { mustBeLast: checked }),
                        },
                      ].map((item) => (
                        <label
                          key={item.label}
                          className="flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <span className="text-sm font-medium text-slate-700">
                            {item.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => item.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-[#5b7cff]"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </main>
          </div>
        )}

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

          {step !== "settings" ? (
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