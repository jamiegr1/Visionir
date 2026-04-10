"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  GripVertical,
  LayoutTemplate,
  Plus,
  Save,
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
      <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {children}
      </span>
      {hint ? (
        <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>
      ) : null}
    </label>
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

  function updateSection(
    id: string,
    patch: Partial<SectionForm>
  ) {
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

  async function handleSaveTemplate() {
    try {
      setIsSaving(true);

      if (!name.trim()) {
        alert("Please enter a template name.");
        return;
      }

      if (sections.length === 0) {
        alert("Please add at least one section.");
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
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => router.push(`/templates?role=${role}`)}
              className="mb-3 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Templates
            </button>

            <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-slate-900">
              New Template
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Build a governed page type that marketing teams can use confidently.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveTemplate}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Template"}
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
                  <LayoutTemplate className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900">
                    Template Overview
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Define the page type and its strategic purpose.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <FieldLabel>Template Name</FieldLabel>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Service Page"
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#5b7cff]"
                  />
                </div>

                <div>
                  <FieldLabel hint="Optional. Leave blank to generate from the name.">
                    Slug
                  </FieldLabel>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="service-page"
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#5b7cff]"
                  />
                </div>

                <div>
                  <FieldLabel>Category</FieldLabel>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#5b7cff]"
                  >
                    <option value="service">Service</option>
                    <option value="landing">Landing</option>
                    <option value="article">Article</option>
                    <option value="contact">Contact</option>
                    <option value="resource">Resource</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <FieldLabel>Description</FieldLabel>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="A governed template for core service pages."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#5b7cff]"
                  />
                </div>

                <div>
                  <FieldLabel>Audience</FieldLabel>
                  <input
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="Enterprise buyers"
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#5b7cff]"
                  />
                </div>

                <div>
                  <FieldLabel>Purpose</FieldLabel>
                  <input
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Explain services and drive conversion"
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#5b7cff]"
                  />
                </div>

                <div>
                  <FieldLabel hint="Applies across the full template unless section rules override it.">
                    Default AI Instruction
                  </FieldLabel>
                  <textarea
                    value={defaultAiInstruction}
                    onChange={(e) => setDefaultAiInstruction(e.target.value)}
                    rows={4}
                    placeholder="Maintain a clear, authoritative, enterprise tone."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#5b7cff]"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900">
                    Page Structure
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Add and order the sections marketers will build against.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddSection}
                  className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
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
                      <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {section.label.trim() || `Section ${index + 1}`}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {section.required ? "Required" : "Optional"} ·{" "}
                          {section.allowedComponentIdsText
                            ? section.allowedComponentIdsText
                            : "No components set"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(section.id, "up");
                          }}
                          disabled={index === 0}
                          className="rounded-xl border border-slate-200 px-2 py-1 text-xs text-slate-600 disabled:opacity-40"
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
                          className="rounded-xl border border-slate-200 px-2 py-1 text-xs text-slate-600 disabled:opacity-40"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSection(section.id);
                          }}
                          className="rounded-xl border border-rose-200 px-2 py-1 text-xs text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>

          <main className="min-w-0">
            {!activeSection ? (
              <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
                <Sparkles className="mx-auto mb-4 h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-700">
                  Select a section to configure it
                </p>
              </div>
            ) : (
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
                    Section Settings
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Keep this simple, structured, and easy for marketing teams to use.
                  </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <FieldLabel>Section Label</FieldLabel>
                    <input
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
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#5b7cff]"
                    />
                  </div>

                  <div>
                    <FieldLabel>Section Key</FieldLabel>
                    <input
                      value={activeSection.key}
                      onChange={(e) =>
                        updateSection(activeSection.id, {
                          key: slugify(e.target.value),
                        })
                      }
                      placeholder="hero"
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#5b7cff]"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <FieldLabel>Description</FieldLabel>
                    <textarea
                      value={activeSection.description}
                      onChange={(e) =>
                        updateSection(activeSection.id, {
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Describe what this section is for."
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#5b7cff]"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <FieldLabel>Helper Text</FieldLabel>
                    <textarea
                      value={activeSection.helpText}
                      onChange={(e) =>
                        updateSection(activeSection.id, {
                          helpText: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Guidance shown to the marketer using this template."
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#5b7cff]"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <FieldLabel hint="Comma separated component IDs from your registry.">
                      Allowed Components
                    </FieldLabel>
                    <input
                      value={activeSection.allowedComponentIdsText}
                      onChange={(e) =>
                        updateSection(activeSection.id, {
                          allowedComponentIdsText: e.target.value,
                        })
                      }
                      placeholder="hero-standard, hero-split"
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#5b7cff]"
                    />
                  </div>

                  <div>
                    <FieldLabel>Default Component</FieldLabel>
                    <input
                      value={activeSection.defaultComponentId}
                      onChange={(e) =>
                        updateSection(activeSection.id, {
                          defaultComponentId: e.target.value,
                        })
                      }
                      placeholder="hero-standard"
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#5b7cff]"
                    />
                  </div>

                  <div>
                    <FieldLabel>AI Prompt Hint</FieldLabel>
                    <input
                      value={activeSection.promptHint}
                      onChange={(e) =>
                        updateSection(activeSection.id, {
                          promptHint: e.target.value,
                        })
                      }
                      placeholder="Introduce the page clearly."
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#5b7cff]"
                    />
                  </div>

                  <div>
                    <FieldLabel>Min Instances</FieldLabel>
                    <input
                      type="number"
                      min={0}
                      value={activeSection.minInstances}
                      onChange={(e) =>
                        updateSection(activeSection.id, {
                          minInstances: Number(e.target.value || 0),
                        })
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#5b7cff]"
                    />
                  </div>

                  <div>
                    <FieldLabel>Max Instances</FieldLabel>
                    <input
                      type="number"
                      min={1}
                      value={activeSection.maxInstances}
                      onChange={(e) =>
                        updateSection(activeSection.id, {
                          maxInstances: Number(e.target.value || 1),
                        })
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#5b7cff]"
                    />
                  </div>

                  <div>
                    <FieldLabel>Minimum Images</FieldLabel>
                    <input
                      type="number"
                      min={0}
                      value={activeSection.imageMin}
                      onChange={(e) =>
                        updateSection(activeSection.id, {
                          imageMin: Number(e.target.value || 0),
                        })
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#5b7cff]"
                    />
                  </div>

                  <div>
                    <FieldLabel>Maximum Images</FieldLabel>
                    <input
                      type="number"
                      min={0}
                      value={activeSection.imageMax}
                      onChange={(e) =>
                        updateSection(activeSection.id, {
                          imageMax: Number(e.target.value || 0),
                        })
                      }
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#5b7cff]"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <FieldLabel hint="One blocked instruction per line.">
                      Blocked Instructions
                    </FieldLabel>
                    <textarea
                      value={activeSection.blockedInstructionsText}
                      onChange={(e) =>
                        updateSection(activeSection.id, {
                          blockedInstructionsText: e.target.value,
                        })
                      }
                      rows={4}
                      placeholder={"Do not use exaggerated claims\nDo not change legal language"}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#5b7cff]"
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
      </div>
    </div>
  );
}