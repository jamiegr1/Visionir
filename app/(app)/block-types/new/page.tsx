"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  ComponentCategory,
  ComponentField,
  ComponentVariant,
  FieldType,
  UserRole,
} from "@/lib/component-schema";
import { hasPermission, type Role } from "@/lib/permissions";

type Step = "details" | "structure" | "variants" | "review";

const categories: ComponentCategory[] = [
  "hero",
  "content",
  "media",
  "conversion",
  "proof",
  "navigation",
  "utility",
];

const fieldTypes: FieldType[] = [
  "text",
  "textarea",
  "richtext",
  "number",
  "boolean",
  "select",
  "image",
  "url",
  "repeater",
];

const basePermissions = {
  canView: ["creator", "approver", "admin"] as UserRole[],
  canEdit: ["creator", "approver", "admin"] as UserRole[],
  canApprove: ["approver", "admin"] as UserRole[],
  canPublish: ["admin"] as UserRole[],
};

const editableAiRule = {
  aiEditable: true,
  aiGenerate: true,
  aiRewrite: true,
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isRole(value: string | null): value is Role {
  return value === "creator" || value === "approver" || value === "admin";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stepNumber(step: Step) {
  if (step === "details") return 1;
  if (step === "structure") return 2;
  if (step === "variants") return 3;
  return 4;
}

function TopBar({ step }: { step: Step }) {
  return (
    <div className="sticky top-0 z-40 border-b border-[#e8ebf3] bg-[#f6f7fb]/95 px-8 py-4 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold tracking-[-0.03em] text-[#111827]">
            Create Block Type
          </h1>
          <p className="mt-1 text-[13px] font-medium text-[#7d859d]">
            Step {stepNumber(step)} of 4
          </p>
        </div>

        <span className="rounded-full border border-[#dfe5ff] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#5b7cff]">
          Pending approval workflow
        </span>
      </div>
    </div>
  );
}

function ProgressHeader({
  step,
  title,
  subtitle,
}: {
  step: Step;
  title: string;
  subtitle: string;
}) {
  const current = stepNumber(step);
  const percent = current * 25;

  return (
    <div className="mb-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <div className="text-[22px] font-semibold tracking-[-0.04em] text-[#111827]">
            {title}
          </div>
          <p className="mt-1 text-[13px] leading-6 text-[#7d859d]">
            {subtitle}
          </p>
        </div>

        <div className="shrink-0 rounded-full border border-[#ebeef5] bg-[#fafbfc] px-3 py-1.5 text-[12px] font-medium text-[#7b849d]">
          Step {current} of 4
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

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#e8ecf4] bg-white">
      {children}
    </div>
  );
}

function FormRow({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-[#e9edf5] px-6 py-4 first:border-t-0">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="text-[14px] font-medium text-[#20263a]">{label}</div>
        {helper ? (
          <div className="text-[12px] font-medium text-[#98a1ba]">
            {helper}
          </div>
        ) : null}
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

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full resize-none rounded-xl border border-[#e3e7f2] bg-[#fafbff] px-4 py-3 text-[14px] leading-[1.7] text-[#2c3348] outline-none transition placeholder:text-[#b6bdd2] hover:border-[#d2d8ea] focus:border-[#5b7cff] focus:bg-white focus:shadow-[0_0_0_4px_rgba(91,124,255,0.08)]"
    />
  );
}

function SelectInput({
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
      className="w-full rounded-xl border border-[#e3e7f2] bg-[#fafbff] px-4 py-3 text-[14px] font-medium text-[#2c3348] outline-none transition focus:border-[#5b7cff] focus:bg-white"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl border border-[#e6eaf3] bg-[#fafbff] px-4 py-3 text-left transition hover:bg-white"
    >
      <span className="text-[13px] font-semibold text-[#20263a]">{label}</span>
      <span
        className={cx(
          "relative inline-flex h-7 w-12 items-center rounded-full transition",
          checked ? "bg-[#5b7cff]" : "bg-slate-300"
        )}
      >
        <span
          className={cx(
            "inline-block h-5 w-5 rounded-full bg-white transition",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </span>
    </button>
  );
}

function NewBlockTypePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return isRole(value) ? value : "admin";
  }, [searchParams]);

  const canCreate = hasPermission(role, "block_type.create");

  const [step, setStep] = useState<Step>("details");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("Location Map");
  const [category, setCategory] = useState<ComponentCategory>("utility");
  const [purpose, setPurpose] = useState(
    "Show one or more office locations with address, contact details and optional CTA."
  );
  const [description, setDescription] = useState(
    "A governed map and location component for contact, office and regional pages."
  );
  const [aiInstructions, setAiInstructions] = useState(
    "Generate a clean, enterprise-grade location block with clear address hierarchy, optional contact CTA and accessible map fallback content."
  );

  const [fields, setFields] = useState<ComponentField[]>([
    {
      id: "heading",
      label: "Heading",
      type: "text",
      required: true,
      validation: [{ type: "maxLength", value: 80 }],
      permissions: basePermissions,
      ai: {
        ...editableAiRule,
        promptHint: "Use a clear location-focused heading.",
      },
      localisable: true,
    },
    {
      id: "intro",
      label: "Intro",
      type: "textarea",
      required: false,
      validation: [{ type: "maxLength", value: 180 }],
      permissions: basePermissions,
      ai: editableAiRule,
      localisable: true,
    },
    {
      id: "address",
      label: "Address",
      type: "textarea",
      required: true,
      validation: [{ type: "maxLength", value: 240 }],
      permissions: basePermissions,
      ai: editableAiRule,
      localisable: true,
    },
    {
      id: "mapEmbedUrl",
      label: "Map Embed URL",
      type: "url",
      required: true,
      validation: [{ type: "url" }],
      permissions: basePermissions,
      ai: {
        aiEditable: false,
        aiGenerate: false,
        aiRewrite: false,
      },
    },
  ]);

  const [variants, setVariants] = useState<ComponentVariant[]>([
    {
      id: "split-map-info",
      label: "Split Map / Info",
      description: "Map on one side with address and CTA on the other.",
      allowedLayouts: ["split"],
      allowedBackgrounds: ["white", "surface"],
      preview: {
        key: "split-map-info",
        label: "Split Map",
        style: "wireframe",
        aspectRatio: "wide",
      },
    },
    {
      id: "full-width-map",
      label: "Full Width Map",
      description: "Full-width map with contact details above or below.",
      allowedLayouts: ["stacked"],
      allowedBackgrounds: ["white", "surface"],
      preview: {
        key: "full-width-map",
        label: "Full Map",
        style: "wireframe",
        aspectRatio: "wide",
      },
    },
  ]);

  const [requiresLegalReview, setRequiresLegalReview] = useState(false);
  const [maxPerPage, setMaxPerPage] = useState("2");

  function addField() {
    setFields((current) => [
      ...current,
      {
        id: `field-${current.length + 1}`,
        label: `Field ${current.length + 1}`,
        type: "text",
        required: false,
        permissions: basePermissions,
        ai: editableAiRule,
        localisable: true,
      },
    ]);
  }

  function updateField(index: number, updates: Partial<ComponentField>) {
    setFields((current) =>
      current.map((field, itemIndex) =>
        itemIndex === index ? { ...field, ...updates } : field
      )
    );
  }

  function removeField(index: number) {
    setFields((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function addVariant() {
    setVariants((current) => [
      ...current,
      {
        id: `variant-${current.length + 1}`,
        label: `Variant ${current.length + 1}`,
        description: "Describe when this layout should be used.",
        allowedLayouts: ["stacked"],
        allowedBackgrounds: ["white", "surface"],
        preview: {
          key: `variant-${current.length + 1}`,
          label: `Variant ${current.length + 1}`,
          style: "wireframe",
          aspectRatio: "wide",
        },
      },
    ]);
  }

  function updateVariant(index: number, updates: Partial<ComponentVariant>) {
    setVariants((current) =>
      current.map((variant, itemIndex) =>
        itemIndex === index ? { ...variant, ...updates } : variant
      )
    );
  }

  function removeVariant(index: number) {
    setVariants((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function next() {
    setError(null);

    if (step === "details") {
      if (!name.trim() || !description.trim() || !purpose.trim()) {
        setError("Please complete the block type name, purpose and description.");
        return;
      }

      setStep("structure");
      return;
    }

    if (step === "structure") {
      if (!fields.length) {
        setError("Add at least one field to define the block type structure.");
        return;
      }

      setFields((current) =>
        current.map((field) => ({
          ...field,
          id: slugify(field.id || field.label),
          label: field.label.trim(),
        }))
      );

      setStep("variants");
      return;
    }

    if (step === "variants") {
      if (!variants.length) {
        setError("Add at least one variant.");
        return;
      }

      setVariants((current) =>
        current.map((variant) => ({
          ...variant,
          id: slugify(variant.id || variant.label),
          label: variant.label.trim(),
        }))
      );

      setStep("review");
    }
  }

  function back() {
    setError(null);

    if (step === "review") setStep("variants");
    else if (step === "variants") setStep("structure");
    else if (step === "structure") setStep("details");
  }

  async function submit() {
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/block-types?role=${role}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          purpose,
          description,
          fields,
          variants,
          requiresLegalReview,
          maxPerPage: Number(maxPerPage) || 2,
          tags: ["custom", "ai-generated", category],
          aiInstructions,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.blockType?.id) {
        throw new Error(json?.error || "Failed to create block type.");
      }

      router.push(`/block-types?role=${role}`);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
      setSaving(false);
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
            Your current role does not have permission to create block types.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f6f7fb] text-slate-900">
      <TopBar step={step} />

      <div className="flex flex-1 items-center justify-center overflow-hidden px-8 py-6">
        <div className="mx-auto flex max-h-[calc(100dvh-150px)] w-full max-w-[1040px] flex-col rounded-[30px] bg-white px-7 pb-6 pt-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] ring-1 ring-[#eef1f6]">
          {step === "details" ? (
            <>
              <ProgressHeader
                step={step}
                title="Define the Block Type"
                subtitle="Describe the purpose, category and role this new reusable block type will play in the system."
              />

              <FormCard>
                <FormRow label="Block Type Name" helper="Required">
                  <TextInput
                    value={name}
                    onChange={setName}
                    placeholder="Location Map"
                  />
                </FormRow>

                <FormRow label="Category">
                  <SelectInput
                    value={category}
                    onChange={(value) => setCategory(value as ComponentCategory)}
                    options={categories}
                  />
                </FormRow>

                <FormRow label="Purpose" helper="Required">
                  <Textarea
                    value={purpose}
                    onChange={setPurpose}
                    placeholder="Explain what this block type is for..."
                    rows={3}
                  />
                </FormRow>

                <FormRow label="Description" helper="Required">
                  <Textarea
                    value={description}
                    onChange={setDescription}
                    placeholder="Describe the reusable component pattern..."
                    rows={4}
                  />
                </FormRow>

                <FormRow label="AI Generation Instructions">
                  <Textarea
                    value={aiInstructions}
                    onChange={setAiInstructions}
                    placeholder="Tell Visionir how AI should generate content for this block type..."
                    rows={4}
                  />
                </FormRow>
              </FormCard>
            </>
          ) : null}

          {step === "structure" ? (
            <>
              <ProgressHeader
                step={step}
                title="Define Structure"
                subtitle="Set the fields that make up this block type. This becomes the schema AI and templates use."
              />

              <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                <div className="grid gap-4">
                  {fields.map((field, index) => (
                    <div
                      key={index}
                      className="rounded-[22px] border border-[#e8ecf4] bg-[#fafbff] p-5"
                    >
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-[15px] font-semibold text-[#111827]">
                            Field {index + 1}
                          </div>
                          <p className="mt-1 text-[12px] text-[#7d859d]">
                            Define the content field and whether AI can generate it.
                          </p>
                        </div>

                        {fields.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeField(index)}
                            className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="mb-2 text-[13px] font-semibold text-[#20263a]">
                            Field Label
                          </div>
                          <TextInput
                            value={field.label}
                            onChange={(value) =>
                              updateField(index, {
                                label: value,
                                id: slugify(value),
                              })
                            }
                            placeholder="Heading"
                          />
                        </div>

                        <div>
                          <div className="mb-2 text-[13px] font-semibold text-[#20263a]">
                            Field Type
                          </div>
                          <SelectInput
                            value={field.type}
                            onChange={(value) =>
                              updateField(index, {
                                type: value as FieldType,
                              })
                            }
                            options={fieldTypes}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <Toggle
                          checked={Boolean(field.required)}
                          onChange={(value) =>
                            updateField(index, { required: value })
                          }
                          label="Required"
                        />
                        <Toggle
                          checked={Boolean(field.localisable)}
                          onChange={(value) =>
                            updateField(index, { localisable: value })
                          }
                          label="Localisable"
                        />
                        <Toggle
                          checked={Boolean(field.ai?.aiGenerate)}
                          onChange={(value) =>
                            updateField(index, {
                              ai: {
                                ...field.ai,
                                aiEditable: value,
                                aiGenerate: value,
                                aiRewrite: value,
                              },
                            })
                          }
                          label="AI can generate"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addField}
                  className="mt-4 w-full rounded-[18px] border border-dashed border-[#cfd6eb] bg-[#fafbff] px-5 py-4 text-[13px] font-semibold text-[#5b7cff] transition hover:bg-white"
                >
                  + Add another field
                </button>
              </div>
            </>
          ) : null}

          {step === "variants" ? (
            <>
              <ProgressHeader
                step={step}
                title="Generate Variants"
                subtitle="Define the approved layout variants that this block type can support."
              />

              <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                <div className="grid gap-4">
                  {variants.map((variant, index) => (
                    <div
                      key={index}
                      className="rounded-[22px] border border-[#e8ecf4] bg-[#fafbff] p-5"
                    >
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-[15px] font-semibold text-[#111827]">
                            Variant {index + 1}
                          </div>
                          <p className="mt-1 text-[12px] text-[#7d859d]">
                            Variants are approved layout options under this block type.
                          </p>
                        </div>

                        {variants.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="mb-2 text-[13px] font-semibold text-[#20263a]">
                            Variant Label
                          </div>
                          <TextInput
                            value={variant.label}
                            onChange={(value) =>
                              updateVariant(index, {
                                label: value,
                                id: slugify(value),
                                preview: {
                                  ...variant.preview,
                                  key: slugify(value),
                                  label: value,
                                },
                              })
                            }
                            placeholder="Split Map / Info"
                          />
                        </div>

                        <div>
                          <div className="mb-2 text-[13px] font-semibold text-[#20263a]">
                            Layout
                          </div>
                          <SelectInput
                            value={variant.allowedLayouts?.[0] || "stacked"}
                            onChange={(value) =>
                              updateVariant(index, {
                                allowedLayouts: [value],
                              })
                            }
                            options={[
                              "stacked",
                              "split",
                              "grid",
                              "grid-2",
                              "grid-3",
                              "grid-4",
                              "row",
                            ]}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 text-[13px] font-semibold text-[#20263a]">
                          Description
                        </div>
                        <Textarea
                          value={variant.description || ""}
                          onChange={(value) =>
                            updateVariant(index, { description: value })
                          }
                          placeholder="Explain when this layout should be used..."
                          rows={3}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addVariant}
                  className="mt-4 w-full rounded-[18px] border border-dashed border-[#cfd6eb] bg-[#fafbff] px-5 py-4 text-[13px] font-semibold text-[#5b7cff] transition hover:bg-white"
                >
                  + Add another variant
                </button>
              </div>
            </>
          ) : null}

          {step === "review" ? (
            <>
              <ProgressHeader
                step={step}
                title="Review & Submit"
                subtitle="Submit this new block type for approval. Once approved, it can be added to templates and used in pages."
              />

              <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                <div className="grid gap-4">
                  <div className="rounded-[24px] border border-[#e8ecf4] bg-[#fafbff] p-5">
                    <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#5b7cff]">
                      Block type
                    </div>
                    <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-[#111827]">
                      {name}
                    </h2>
                    <p className="mt-2 text-[13px] leading-6 text-[#7d859d]">
                      {description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#5b7cff] ring-1 ring-[#dfe5ff]">
                        {category}
                      </span>
                      <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[12px] font-semibold text-amber-700 ring-1 ring-amber-100">
                        Pending approval
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] border border-[#e8ecf4] bg-white p-5">
                      <h3 className="text-[15px] font-semibold text-[#111827]">
                        Fields
                      </h3>
                      <div className="mt-4 space-y-2">
                        {fields.map((field) => (
                          <div
                            key={field.id}
                            className="rounded-2xl border border-[#edf0f6] bg-[#fafbff] px-4 py-3"
                          >
                            <div className="text-[13px] font-semibold text-[#20263a]">
                              {field.label}
                            </div>
                            <div className="mt-1 text-[12px] text-[#7d859d]">
                              {field.type}
                              {field.required ? " · Required" : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-[#e8ecf4] bg-white p-5">
                      <h3 className="text-[15px] font-semibold text-[#111827]">
                        Variants
                      </h3>
                      <div className="mt-4 space-y-2">
                        {variants.map((variant) => (
                          <div
                            key={variant.id}
                            className="rounded-2xl border border-[#edf0f6] bg-[#fafbff] px-4 py-3"
                          >
                            <div className="text-[13px] font-semibold text-[#20263a]">
                              {variant.label}
                            </div>
                            <div className="mt-1 text-[12px] text-[#7d859d]">
                              {variant.allowedLayouts?.[0] || "stacked"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[#e8ecf4] bg-white p-5">
                    <h3 className="text-[15px] font-semibold text-[#111827]">
                      Approval & Governance
                    </h3>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <Toggle
                        checked={requiresLegalReview}
                        onChange={setRequiresLegalReview}
                        label="Requires legal review"
                      />

                      <div>
                        <div className="mb-2 text-[13px] font-semibold text-[#20263a]">
                          Max per page
                        </div>
                        <TextInput
                          value={maxPerPage}
                          onChange={setMaxPerPage}
                          placeholder="2"
                        />
                      </div>
                    </div>

                    <p className="mt-4 text-[13px] leading-6 text-[#7d859d]">
                      This block type will be saved as pending approval. An admin
                      must approve it before it becomes available in the approved
                      block type library.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-center gap-3">
            {step !== "details" ? (
              <button
                type="button"
                onClick={back}
                className="min-w-[120px] rounded-lg bg-[#eef2fb] px-6 py-3 text-sm font-semibold text-[#7380b3] transition-all duration-200 hover:bg-[#dfe6fb]"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push(`/block-types?role=${role}`)}
                className="min-w-[120px] rounded-lg bg-[#eef2fb] px-6 py-3 text-sm font-semibold text-[#7380b3] transition-all duration-200 hover:bg-[#dfe6fb]"
              >
                Cancel
              </button>
            )}

            {step === "review" ? (
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="min-w-[190px] rounded-lg bg-[#5b7cff] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#3f5ff0] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Submitting..." : "Submit for Approval"}
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
                className="min-w-[170px] rounded-lg bg-[#5b7cff] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#3f5ff0] hover:shadow-lg"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewBlockTypePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-0 items-center justify-center bg-[#f6f7fb] text-sm font-medium text-slate-500">
          Loading block type creator…
        </div>
      }
    >
      <NewBlockTypePageContent />
    </Suspense>
  );
}