"use client";

import { useMemo, useState } from "react";

type UserRole = "creator" | "approver" | "admin";

type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "boolean"
  | "select"
  | "multi-select"
  | "image"
  | "icon"
  | "url"
  | "cta"
  | "group"
  | "repeater";

type ValidationRule =
  | { type: "required"; message?: string }
  | { type: "minLength"; value: number; message?: string }
  | { type: "maxLength"; value: number; message?: string }
  | { type: "minItems"; value: number; message?: string }
  | { type: "maxItems"; value: number; message?: string }
  | { type: "regex"; value: string; message?: string }
  | { type: "allowedValues"; value: string[]; message?: string };

type RolePermission = {
  canView: UserRole[];
  canEdit: UserRole[];
  canApprove?: UserRole[];
  canPublish?: UserRole[];
};

type AiRule = {
  aiEditable: boolean;
  aiGenerate: boolean;
  aiRewrite: boolean;
  promptHint?: string;
  blockedInstructions?: string[];
};

type FieldOption = {
  label: string;
  value: string;
};

type ComponentField = {
  id: string;
  label: string;
  type: FieldType;
  description?: string;
  placeholder?: string;
  defaultValue?: unknown;
  options?: FieldOption[];
  validation?: ValidationRule[];
  permissions: RolePermission;
  ai: AiRule;
  locked?: boolean;
  localisable?: boolean;
  tokenBound?: boolean;
  hidden?: boolean;
  children?: ComponentField[];
};

type ComponentVariant = {
  id: string;
  label: string;
  description?: string;
  allowedLayouts?: string[];
  allowedBackgrounds?: string[];
  deprecated?: boolean;
};

type ApprovalRule = {
  requiresApproval: boolean;
  approvalReason?: string;
  requiresLegalReview?: boolean;
  requiresRegionalReview?: boolean;
};

type CompositionRule = {
  allowedParents?: string[];
  allowedChildren?: string[];
  cannotFollow?: string[];
  mustBeFirst?: boolean;
  maxPerPage?: number;
};

type DeploymentRule = {
  deployable: boolean;
  targetCms: Array<"optimizely" | "sitecore" | "adobe" | "framer" | "custom">;
  requiredMappings?: string[];
};

type ComponentSchema = {
  id: string;
  name: string;
  category:
    | "hero"
    | "content"
    | "media"
    | "conversion"
    | "proof"
    | "navigation"
    | "utility";
  description: string;
  status: "draft" | "approved" | "deprecated";
  variants: ComponentVariant[];
  fields: ComponentField[];
  approvals: ApprovalRule;
  composition: CompositionRule;
  deployment: DeploymentRule;
  allowedLocales?: string[];
  tags?: string[];
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function parseCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toCommaList(value?: string[]) {
  return (value || []).join(", ");
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

function SectionCard({
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

function Grid({
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

const INITIAL_COMPONENTS: ComponentSchema[] = [
  {
    id: "hero-standard",
    name: "Hero Standard",
    category: "hero",
    description:
      "Primary hero component for service and solution pages with headline, copy and CTA.",
    status: "approved",
    variants: [
      {
        id: "left-content-right-image",
        label: "Left Content / Right Image",
        description: "Split layout with content on the left and media on the right.",
        allowedLayouts: ["split"],
        allowedBackgrounds: ["white", "surface"],
      },
      {
        id: "centered",
        label: "Centered",
        description: "Stacked, centered hero for high-level brand or campaign pages.",
        allowedLayouts: ["stacked"],
        allowedBackgrounds: ["white", "surface", "tint"],
      },
    ],
    fields: [
      {
        id: "eyebrow",
        label: "Eyebrow",
        type: "text",
        placeholder: "Optional category label",
        validation: [{ type: "maxLength", value: 40 }],
        permissions: {
          canView: ["creator", "approver", "admin"],
          canEdit: ["creator", "approver", "admin"],
          canApprove: ["approver", "admin"],
          canPublish: ["admin"],
        },
        ai: {
          aiEditable: true,
          aiGenerate: true,
          aiRewrite: true,
          promptHint: "Keep concise, credibility-led and category-specific.",
        },
        localisable: true,
      },
      {
        id: "headline",
        label: "Headline",
        type: "text",
        placeholder: "Primary headline",
        validation: [
          { type: "required" },
          { type: "maxLength", value: 70 },
        ],
        permissions: {
          canView: ["creator", "approver", "admin"],
          canEdit: ["creator", "approver", "admin"],
          canApprove: ["approver", "admin"],
          canPublish: ["admin"],
        },
        ai: {
          aiEditable: true,
          aiGenerate: true,
          aiRewrite: true,
          promptHint: "Enterprise-grade headline. Clear, direct, non-hype.",
        },
        localisable: true,
      },
      {
        id: "subheading",
        label: "Subheading",
        type: "textarea",
        placeholder: "Supporting paragraph",
        validation: [
          { type: "required" },
          { type: "maxLength", value: 180 },
        ],
        permissions: {
          canView: ["creator", "approver", "admin"],
          canEdit: ["creator", "approver", "admin"],
          canApprove: ["approver", "admin"],
          canPublish: ["admin"],
        },
        ai: {
          aiEditable: true,
          aiGenerate: true,
          aiRewrite: true,
          promptHint: "Support headline with detail and technical credibility.",
        },
        localisable: true,
      },
      {
        id: "primaryCtaLabel",
        label: "Primary CTA Label",
        type: "text",
        validation: [
          { type: "required" },
          { type: "maxLength", value: 28 },
        ],
        permissions: {
          canView: ["creator", "approver", "admin"],
          canEdit: ["creator", "approver", "admin"],
          canApprove: ["approver", "admin"],
          canPublish: ["admin"],
        },
        ai: {
          aiEditable: true,
          aiGenerate: true,
          aiRewrite: true,
          promptHint: "Use approved CTA styles only.",
        },
        localisable: true,
      },
      {
        id: "primaryCtaUrl",
        label: "Primary CTA URL",
        type: "url",
        validation: [{ type: "required" }],
        permissions: {
          canView: ["creator", "approver", "admin"],
          canEdit: ["creator", "approver", "admin"],
          canApprove: ["approver", "admin"],
          canPublish: ["admin"],
        },
        ai: {
          aiEditable: false,
          aiGenerate: false,
          aiRewrite: false,
        },
      },
      {
        id: "image",
        label: "Hero Image",
        type: "image",
        permissions: {
          canView: ["creator", "approver", "admin"],
          canEdit: ["creator", "approver", "admin"],
          canApprove: ["approver", "admin"],
          canPublish: ["admin"],
        },
        ai: {
          aiEditable: false,
          aiGenerate: false,
          aiRewrite: false,
        },
      },
    ],
    approvals: {
      requiresApproval: true,
      approvalReason: "Primary top-of-page component",
      requiresLegalReview: false,
      requiresRegionalReview: false,
    },
    composition: {
      allowedParents: ["page"],
      allowedChildren: [],
      cannotFollow: ["hero-standard"],
      mustBeFirst: true,
      maxPerPage: 1,
    },
    deployment: {
      deployable: true,
      targetCms: ["optimizely", "framer", "custom"],
      requiredMappings: [
        "headline",
        "subheading",
        "primaryCtaLabel",
        "primaryCtaUrl",
      ],
    },
    allowedLocales: ["en-GB", "en-US"],
    tags: ["core", "high-visibility"],
  },
  {
    id: "value-points-grid",
    name: "Value Points Grid",
    category: "content",
    description:
      "Structured value-point cards used to communicate service benefits or differentiators.",
    status: "approved",
    variants: [
      {
        id: "three-up",
        label: "3 Column Grid",
        description: "Three-card value-point layout.",
        allowedLayouts: ["grid-3"],
        allowedBackgrounds: ["white", "surface"],
      },
      {
        id: "four-up",
        label: "4 Column Grid",
        description: "Four-card value-point layout.",
        allowedLayouts: ["grid-4"],
        allowedBackgrounds: ["white", "surface"],
      },
    ],
    fields: [
      {
        id: "sectionHeading",
        label: "Section Heading",
        type: "text",
        validation: [{ type: "maxLength", value: 70 }],
        permissions: {
          canView: ["creator", "approver", "admin"],
          canEdit: ["creator", "approver", "admin"],
          canApprove: ["approver", "admin"],
          canPublish: ["admin"],
        },
        ai: {
          aiEditable: true,
          aiGenerate: true,
          aiRewrite: true,
        },
        localisable: true,
      },
      {
        id: "items",
        label: "Value Points",
        type: "repeater",
        validation: [
          { type: "required" },
          { type: "minItems", value: 3 },
          { type: "maxItems", value: 4 },
        ],
        permissions: {
          canView: ["creator", "approver", "admin"],
          canEdit: ["creator", "approver", "admin"],
          canApprove: ["approver", "admin"],
          canPublish: ["admin"],
        },
        ai: {
          aiEditable: true,
          aiGenerate: true,
          aiRewrite: true,
          promptHint: "Keep items distinct, concise and value-led.",
        },
        children: [
          {
            id: "title",
            label: "Title",
            type: "text",
            validation: [
              { type: "required" },
              { type: "maxLength", value: 40 },
            ],
            permissions: {
              canView: ["creator", "approver", "admin"],
              canEdit: ["creator", "approver", "admin"],
              canApprove: ["approver", "admin"],
              canPublish: ["admin"],
            },
            ai: {
              aiEditable: true,
              aiGenerate: true,
              aiRewrite: true,
            },
            localisable: true,
          },
          {
            id: "text",
            label: "Text",
            type: "textarea",
            validation: [
              { type: "required" },
              { type: "maxLength", value: 140 },
            ],
            permissions: {
              canView: ["creator", "approver", "admin"],
              canEdit: ["creator", "approver", "admin"],
              canApprove: ["approver", "admin"],
              canPublish: ["admin"],
            },
            ai: {
              aiEditable: true,
              aiGenerate: true,
              aiRewrite: true,
            },
            localisable: true,
          },
          {
            id: "accent",
            label: "Accent",
            type: "select",
            options: [
              { label: "Blue", value: "blue" },
              { label: "Green", value: "green" },
              { label: "Orange", value: "orange" },
              { label: "Purple", value: "purple" },
            ],
            validation: [{ type: "required" }],
            permissions: {
              canView: ["creator", "approver", "admin"],
              canEdit: ["creator", "approver", "admin"],
              canApprove: ["approver", "admin"],
              canPublish: ["admin"],
            },
            ai: {
              aiEditable: false,
              aiGenerate: false,
              aiRewrite: false,
            },
            tokenBound: true,
          },
        ],
      },
    ],
    approvals: {
      requiresApproval: true,
      approvalReason: "Reusable content pattern",
      requiresLegalReview: false,
      requiresRegionalReview: false,
    },
    composition: {
      allowedParents: ["page"],
      allowedChildren: [],
      cannotFollow: [],
      mustBeFirst: false,
      maxPerPage: 2,
    },
    deployment: {
      deployable: true,
      targetCms: ["optimizely", "framer", "custom"],
      requiredMappings: ["items"],
    },
    allowedLocales: ["en-GB", "en-US"],
    tags: ["core", "repeatable"],
  },
];

function RegistrySidebar({
  components,
  activeId,
  setActiveId,
}: {
  components: ComponentSchema[];
  activeId: string;
  setActiveId: (id: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b border-slate-200 px-6 py-6">
        <div>
          <h2 className="text-[19px] font-semibold tracking-[-0.03em] text-slate-900">
            Component Registry
          </h2>
          <p className="mt-1.5 max-w-[260px] text-[13px] leading-5 text-slate-500">
            Define approved component schemas, field rules and deployment constraints.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pr-3">
        <div className="rounded-[26px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] p-2 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
          {components.map((component, index) => {
            const isActive = activeId === component.id;
            const isLast = index === components.length - 1;

            return (
              <button
                key={component.id}
                type="button"
                onClick={() => setActiveId(component.id)}
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
                  <div className="flex items-center gap-2">
                    <div
                      className={cx(
                        "text-[13.5px] font-semibold tracking-[-0.01em] transition-colors duration-200",
                        isActive
                          ? "text-slate-900"
                          : "text-slate-700 group-hover:text-slate-900"
                      )}
                    >
                      {component.name}
                    </div>
                    <StatusPill
                      tone={
                        component.status === "approved"
                          ? "green"
                          : component.status === "deprecated"
                            ? "rose"
                            : "amber"
                      }
                    >
                      {component.status}
                    </StatusPill>
                  </div>

                  <div className="mt-1 text-[12px] leading-5 text-slate-500">
                    {component.category} • {component.fields.length} fields •{" "}
                    {component.variants.length} variants
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-[22px] border border-[#dbe5ff] bg-[linear-gradient(180deg,#f8faff_0%,#f3f7ff_100%)] px-4 py-3.5 shadow-[0_6px_18px_rgba(79,108,255,0.04)]">
          <p className="text-[13px] leading-5 text-[#4f6fff]">
            The registry is the source of truth for allowed components, field rules and publish readiness.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ComponentRegistryPage() {
  const [components, setComponents] =
    useState<ComponentSchema[]>(INITIAL_COMPONENTS);
  const [activeId, setActiveId] = useState(INITIAL_COMPONENTS[0].id);

  const activeComponent = useMemo(
    () => components.find((component) => component.id === activeId) || components[0],
    [components, activeId]
  );

  function updateComponent(path: string, value: unknown) {
    setComponents((prev) =>
      prev.map((component) => {
        if (component.id !== activeId) return component;

        const next = { ...component } as Record<string, any>;
        const keys = path.split(".");
        let obj = next;

        keys.slice(0, -1).forEach((key) => {
          if (Array.isArray(obj[key])) {
            obj[key] = [...obj[key]];
          } else {
            obj[key] = { ...obj[key] };
          }
          obj = obj[key];
        });

        obj[keys[keys.length - 1]] = value;
        return next as ComponentSchema;
      })
    );
  }

  function updateVariant(index: number, key: keyof ComponentVariant, value: unknown) {
    setComponents((prev) =>
      prev.map((component) => {
        if (component.id !== activeId) return component;
        const next = { ...component, variants: [...component.variants] };
        next.variants[index] = { ...next.variants[index], [key]: value };
        return next;
      })
    );
  }

  function updateField(index: number, key: keyof ComponentField, value: unknown) {
    setComponents((prev) =>
      prev.map((component) => {
        if (component.id !== activeId) return component;
        const next = { ...component, fields: [...component.fields] };
        next.fields[index] = { ...next.fields[index], [key]: value };
        return next;
      })
    );
  }

  if (!activeComponent) return null;

  return (
    <div className="h-[calc(100dvh-72px)] overflow-hidden bg-[#f5f7fb] text-slate-900">
      <div className="flex h-[calc(100dvh-72px)] overflow-hidden">
        <aside className="w-full max-w-[360px] shrink-0 border-r border-slate-200 bg-white">
          <RegistrySidebar
            components={components}
            activeId={activeId}
            setActiveId={setActiveId}
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
                    {activeComponent.name}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Configure schema, field-level rules, approval logic and deployment readiness for this governed component.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusPill tone="blue">{activeComponent.category}</StatusPill>
                <StatusPill
                  tone={
                    activeComponent.status === "approved"
                      ? "green"
                      : activeComponent.status === "deprecated"
                        ? "rose"
                        : "amber"
                  }
                >
                  {activeComponent.status}
                </StatusPill>
                <StatusPill tone="slate">
                  {activeComponent.fields.length} fields
                </StatusPill>
              </div>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto px-8 py-6">
            <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
              <SectionCard
                title="Component Overview"
                description="Core identity and status for this registry item."
              >
                <Grid cols={3}>
                  <FieldGroup label="Component Name">
                    <Input
                      value={activeComponent.name}
                      onChange={(v) => updateComponent("name", v)}
                    />
                  </FieldGroup>

                  <FieldGroup label="Category">
                    <Select
                      value={activeComponent.category}
                      onChange={(v) => updateComponent("category", v)}
                      options={[
                        "hero",
                        "content",
                        "media",
                        "conversion",
                        "proof",
                        "navigation",
                        "utility",
                      ]}
                    />
                  </FieldGroup>

                  <FieldGroup label="Status">
                    <Select
                      value={activeComponent.status}
                      onChange={(v) => updateComponent("status", v)}
                      options={["draft", "approved", "deprecated"]}
                    />
                  </FieldGroup>
                </Grid>

                <div className="mt-5 space-y-5">
                  <FieldGroup label="Component ID" helper="SYSTEM ID">
                    <Input
                      value={activeComponent.id}
                      onChange={(v) => updateComponent("id", v)}
                    />
                  </FieldGroup>

                  <FieldGroup label="Description">
                    <Textarea
                      value={activeComponent.description}
                      onChange={(v) => updateComponent("description", v)}
                      rows={4}
                    />
                  </FieldGroup>

                  <FieldGroup label="Tags" helper="COMMA SEPARATED">
                    <Textarea
                      value={toCommaList(activeComponent.tags)}
                      onChange={(v) => updateComponent("tags", parseCommaList(v))}
                      rows={3}
                    />
                  </FieldGroup>

                  <FieldGroup label="Allowed Locales" helper="COMMA SEPARATED">
                    <Textarea
                      value={toCommaList(activeComponent.allowedLocales)}
                      onChange={(v) =>
                        updateComponent("allowedLocales", parseCommaList(v))
                      }
                      rows={3}
                    />
                  </FieldGroup>
                </div>
              </SectionCard>

              <SectionCard
                title="Variants"
                description="Approved visual and structural variants for this component."
              >
                <div className="space-y-4">
                  {activeComponent.variants.map((variant, index) => (
                    <div
                      key={variant.id}
                      className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                    >
                      <Grid cols={2}>
                        <FieldGroup label="Variant Label">
                          <Input
                            value={variant.label}
                            onChange={(v) => updateVariant(index, "label", v)}
                          />
                        </FieldGroup>

                        <FieldGroup label="Variant ID">
                          <Input
                            value={variant.id}
                            onChange={(v) => updateVariant(index, "id", v)}
                          />
                        </FieldGroup>
                      </Grid>

                      <div className="mt-4 space-y-4">
                        <FieldGroup label="Description">
                          <Textarea
                            value={variant.description || ""}
                            onChange={(v) =>
                              updateVariant(index, "description", v)
                            }
                            rows={3}
                          />
                        </FieldGroup>

                        <Grid cols={2}>
                          <FieldGroup label="Allowed Layouts" helper="COMMA SEPARATED">
                            <Textarea
                              value={toCommaList(variant.allowedLayouts)}
                              onChange={(v) =>
                                updateVariant(index, "allowedLayouts", parseCommaList(v))
                              }
                              rows={3}
                            />
                          </FieldGroup>

                          <FieldGroup
                            label="Allowed Backgrounds"
                            helper="COMMA SEPARATED"
                          >
                            <Textarea
                              value={toCommaList(variant.allowedBackgrounds)}
                              onChange={(v) =>
                                updateVariant(
                                  index,
                                  "allowedBackgrounds",
                                  parseCommaList(v)
                                )
                              }
                              rows={3}
                            />
                          </FieldGroup>
                        </Grid>

                        <Toggle
                          checked={!!variant.deprecated}
                          onChange={(v) => updateVariant(index, "deprecated", v)}
                          label="Deprecated variant"
                          description="Marks this variant as no longer recommended for new content."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="Field Schema"
                description="Field-level rules, AI permissions and validation constraints."
              >
                <div className="space-y-4">
                  {activeComponent.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[14px] font-semibold text-slate-900">
                            {field.label}
                          </div>
                          <div className="mt-1 text-[12px] text-slate-500">
                            {field.type} • {field.id}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {field.locked && <StatusPill tone="amber">Locked</StatusPill>}
                          {field.localisable && (
                            <StatusPill tone="blue">Localisable</StatusPill>
                          )}
                          {field.tokenBound && (
                            <StatusPill tone="slate">Token Bound</StatusPill>
                          )}
                        </div>
                      </div>

                      <Grid cols={2}>
                        <FieldGroup label="Field Label">
                          <Input
                            value={field.label}
                            onChange={(v) => updateField(index, "label", v)}
                          />
                        </FieldGroup>

                        <FieldGroup label="Field ID">
                          <Input
                            value={field.id}
                            onChange={(v) => updateField(index, "id", v)}
                          />
                        </FieldGroup>

                        <FieldGroup label="Field Type">
                          <Select
                            value={field.type}
                            onChange={(v) =>
                              updateField(index, "type", v as FieldType)
                            }
                            options={[
                              "text",
                              "textarea",
                              "richtext",
                              "number",
                              "boolean",
                              "select",
                              "multi-select",
                              "image",
                              "icon",
                              "url",
                              "cta",
                              "group",
                              "repeater",
                            ]}
                          />
                        </FieldGroup>

                        <FieldGroup label="Placeholder">
                          <Input
                            value={field.placeholder || ""}
                            onChange={(v) =>
                              updateField(index, "placeholder", v)
                            }
                          />
                        </FieldGroup>
                      </Grid>

                      <div className="mt-4 space-y-4">
                        <FieldGroup label="Description">
                          <Textarea
                            value={field.description || ""}
                            onChange={(v) => updateField(index, "description", v)}
                            rows={3}
                          />
                        </FieldGroup>

                        <FieldGroup label="Validation Rules" helper="READ ONLY SNAPSHOT">
                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {(field.validation || []).length === 0 ? (
                                <span className="text-sm text-slate-400">
                                  No validation rules set
                                </span>
                              ) : (
                                field.validation?.map((rule, ruleIndex) => (
                                  <StatusPill key={ruleIndex} tone="slate">
                                    {rule.type}
                                    {"value" in rule ? `: ${String(rule.value)}` : ""}
                                  </StatusPill>
                                ))
                              )}
                            </div>
                          </div>
                        </FieldGroup>

                        <FieldGroup label="Prompt Hint">
                          <Textarea
                            value={field.ai.promptHint || ""}
                            onChange={(v) =>
                              updateField(index, "ai", {
                                ...field.ai,
                                promptHint: v,
                              })
                            }
                            rows={3}
                          />
                        </FieldGroup>

                        <FieldGroup
                          label="Blocked Instructions"
                          helper="COMMA SEPARATED"
                        >
                          <Textarea
                            value={toCommaList(field.ai.blockedInstructions)}
                            onChange={(v) =>
                              updateField(index, "ai", {
                                ...field.ai,
                                blockedInstructions: parseCommaList(v),
                              })
                            }
                            rows={3}
                          />
                        </FieldGroup>

                        <Grid cols={2}>
                          <Toggle
                            checked={!!field.ai.aiEditable}
                            onChange={(v) =>
                              updateField(index, "ai", {
                                ...field.ai,
                                aiEditable: v,
                              })
                            }
                            label="AI editable"
                          />

                          <Toggle
                            checked={!!field.ai.aiGenerate}
                            onChange={(v) =>
                              updateField(index, "ai", {
                                ...field.ai,
                                aiGenerate: v,
                              })
                            }
                            label="AI generate"
                          />

                          <Toggle
                            checked={!!field.ai.aiRewrite}
                            onChange={(v) =>
                              updateField(index, "ai", {
                                ...field.ai,
                                aiRewrite: v,
                              })
                            }
                            label="AI rewrite"
                          />

                          <Toggle
                            checked={!!field.locked}
                            onChange={(v) => updateField(index, "locked", v)}
                            label="Locked field"
                          />

                          <Toggle
                            checked={!!field.localisable}
                            onChange={(v) =>
                              updateField(index, "localisable", v)
                            }
                            label="Localisable"
                          />

                          <Toggle
                            checked={!!field.tokenBound}
                            onChange={(v) =>
                              updateField(index, "tokenBound", v)
                            }
                            label="Token bound"
                          />

                          <Toggle
                            checked={!!field.hidden}
                            onChange={(v) => updateField(index, "hidden", v)}
                            label="Hidden field"
                          />
                        </Grid>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="Approval Rules"
                description="Control approval, legal review and regional review requirements."
              >
                <div className="space-y-4">
                  <Toggle
                    checked={!!activeComponent.approvals.requiresApproval}
                    onChange={(v) =>
                      updateComponent("approvals.requiresApproval", v)
                    }
                    label="Require approval"
                    description="The component cannot be published without approval."
                  />

                  <Toggle
                    checked={!!activeComponent.approvals.requiresLegalReview}
                    onChange={(v) =>
                      updateComponent("approvals.requiresLegalReview", v)
                    }
                    label="Require legal review"
                  />

                  <Toggle
                    checked={!!activeComponent.approvals.requiresRegionalReview}
                    onChange={(v) =>
                      updateComponent("approvals.requiresRegionalReview", v)
                    }
                    label="Require regional review"
                  />

                  <FieldGroup label="Approval Reason">
                    <Textarea
                      value={activeComponent.approvals.approvalReason || ""}
                      onChange={(v) =>
                        updateComponent("approvals.approvalReason", v)
                      }
                      rows={3}
                    />
                  </FieldGroup>
                </div>
              </SectionCard>

              <SectionCard
                title="Composition Rules"
                description="Define where this component can appear and what it can sit beside."
              >
                <div className="space-y-5">
                  <Grid cols={2}>
                    <FieldGroup label="Allowed Parents" helper="COMMA SEPARATED">
                      <Textarea
                        value={toCommaList(activeComponent.composition.allowedParents)}
                        onChange={(v) =>
                          updateComponent(
                            "composition.allowedParents",
                            parseCommaList(v)
                          )
                        }
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Allowed Children" helper="COMMA SEPARATED">
                      <Textarea
                        value={toCommaList(activeComponent.composition.allowedChildren)}
                        onChange={(v) =>
                          updateComponent(
                            "composition.allowedChildren",
                            parseCommaList(v)
                          )
                        }
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Cannot Follow" helper="COMMA SEPARATED">
                      <Textarea
                        value={toCommaList(activeComponent.composition.cannotFollow)}
                        onChange={(v) =>
                          updateComponent(
                            "composition.cannotFollow",
                            parseCommaList(v)
                          )
                        }
                        rows={3}
                      />
                    </FieldGroup>

                    <FieldGroup label="Max Per Page">
                      <Input
                        type="number"
                        value={activeComponent.composition.maxPerPage || 0}
                        onChange={(v) =>
                          updateComponent("composition.maxPerPage", Number(v))
                        }
                      />
                    </FieldGroup>
                  </Grid>

                  <Toggle
                    checked={!!activeComponent.composition.mustBeFirst}
                    onChange={(v) =>
                      updateComponent("composition.mustBeFirst", v)
                    }
                    label="Must be first on page"
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Deployment Rules"
                description="Control target CMS support and required field mappings."
              >
                <div className="space-y-5">
                  <Toggle
                    checked={!!activeComponent.deployment.deployable}
                    onChange={(v) => updateComponent("deployment.deployable", v)}
                    label="Deployable component"
                    description="Marks whether this schema is approved for deployment."
                  />

                  <FieldGroup label="Target CMS Platforms" helper="COMMA SEPARATED">
                    <Textarea
                      value={toCommaList(activeComponent.deployment.targetCms)}
                      onChange={(v) =>
                        updateComponent("deployment.targetCms", parseCommaList(v))
                      }
                      rows={3}
                    />
                  </FieldGroup>

                  <FieldGroup
                    label="Required Mappings"
                    helper="COMMA SEPARATED"
                  >
                    <Textarea
                      value={toCommaList(activeComponent.deployment.requiredMappings)}
                      onChange={(v) =>
                        updateComponent(
                          "deployment.requiredMappings",
                          parseCommaList(v)
                        )
                      }
                      rows={3}
                    />
                  </FieldGroup>
                </div>
              </SectionCard>
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-[#f5f7fb] px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                <span>Schema Registry: Active</span>
                <span>Field Governance: Enabled</span>
                <span>Deployment Rules: Structured</span>
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
                  Save Registry
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}