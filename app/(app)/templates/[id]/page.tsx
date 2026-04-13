"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Archive,
  CheckCircle2,
  Copy,
  Eye,
  FileText,
  LayoutTemplate,
  Pencil,
  Plus,
  Settings2,
  Sparkles,
  Wand2,
} from "lucide-react";

type Role = "creator" | "approver" | "admin";
type TemplateStatus = "draft" | "published" | "archived";
type TemplateTab = "overview" | "structure" | "rules" | "preview";

type TemplateSectionRule = {
  id: string;
  key: string;
  label: string;
  description?: string;
  helpText?: string;
  order: number;
  required: boolean;
  canSkip?: boolean;
  minInstances: number;
  maxInstances: number;
  allowedComponentIds: string[];
  defaultComponentId?: string | null;
  lockedOrder?: boolean;
  mustBeFirst?: boolean;
  mustBeLast?: boolean;
  imageRequirement?: {
    min: number;
    max: number;
    requiredAltText?: boolean;
  };
  ai?: {
    promptHint?: string;
    blockedInstructions?: string[];
    generateScope?: "copy_only" | "copy_and_layout";
  };
};

type TemplateRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category:
    | "service"
    | "landing"
    | "article"
    | "contact"
    | "resource"
    | "custom";
  status: TemplateStatus;
  version: number;
  audience?: string;
  purpose?: string;
  defaultAiInstruction?: string;
  sections: TemplateSectionRule[];
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCategoryLabel(value: TemplateRecord["category"]) {
  switch (value) {
    case "service":
      return "Service";
    case "landing":
      return "Landing";
    case "article":
      return "Article";
    case "contact":
      return "Contact";
    case "resource":
      return "Resource";
    case "custom":
    default:
      return "Custom";
  }
}

function StatusPill({ status }: { status: TemplateStatus }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1",
        status === "published" &&
          "bg-emerald-50 text-emerald-700 ring-emerald-200",
        status === "draft" && "bg-amber-50 text-amber-700 ring-amber-200",
        status === "archived" && "bg-slate-100 text-slate-600 ring-slate-200"
      )}
    >
      {status === "published"
        ? "Published"
        : status === "draft"
          ? "Draft"
          : "Archived"}
    </span>
  );
}

function OverviewCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="max-w-[62%] break-words text-right text-sm leading-6 text-slate-700">
        {value}
      </p>
    </div>
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
        "rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-6",
        className
      )}
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
          {icon}
        </div>

        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1.5 text-sm leading-6 text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {children}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-medium transition",
        active
          ? "bg-[#5b7cff] text-white shadow-[0_12px_28px_rgba(91,124,255,0.22)]"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "blue" | "emerald" | "amber" | "purple";
}) {
  const styles =
    tone === "blue"
      ? "bg-blue-50 text-blue-700"
      : tone === "emerald"
        ? "bg-emerald-50 text-emerald-700"
        : tone === "amber"
          ? "bg-amber-50 text-amber-700"
          : tone === "purple"
            ? "bg-purple-50 text-purple-700"
            : "bg-slate-100 text-slate-600";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        styles
      )}
    >
      {children}
    </span>
  );
}

function EmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function SectionSummaryCard({
  section,
  index,
  isSelected,
  onClick,
}: {
  section: TemplateSectionRule;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const allowedCount = section.allowedComponentIds.length;
  const hasAiHint = Boolean(section.ai?.promptHint);
  const hasImageRules = Boolean(section.imageRequirement);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-[24px] border p-4 text-left transition",
        isSelected
          ? "border-[#cfd8f6] bg-[#f7f9ff] shadow-[0_12px_28px_rgba(91,124,255,0.08)]"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              {index + 1}
            </span>

            <h3 className="truncate text-[16px] font-semibold text-slate-900">
              {section.label}
            </h3>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {section.description || "No section description provided."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone={section.required ? "emerald" : "slate"}>
            {section.required ? "Required" : "Optional"}
          </Badge>

          {section.mustBeFirst ? <Badge tone="blue">Must be first</Badge> : null}
          {section.mustBeLast ? <Badge tone="purple">Must be last</Badge> : null}
          {section.lockedOrder ? <Badge tone="amber">Order locked</Badge> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Allowed blocks
          </p>
          <p className="mt-1.5 text-sm font-medium text-slate-900">
            {allowedCount}
          </p>
        </div>

        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Instances
          </p>
          <p className="mt-1.5 text-sm font-medium text-slate-900">
            {section.minInstances}–{section.maxInstances}
          </p>
        </div>

        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Signals
          </p>
          <p className="mt-1.5 text-sm font-medium text-slate-900">
            {[hasAiHint ? "AI" : null, hasImageRules ? "Images" : null]
              .filter(Boolean)
              .join(" • ") || "Basic"}
          </p>
        </div>
      </div>
    </button>
  );
}

function RuleRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <div className="max-w-[60%] text-right text-sm leading-6 text-slate-900">
        {value}
      </div>
    </div>
  );
}

export default function TemplateDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return value === "creator" || value === "approver" || value === "admin"
      ? value
      : "admin";
  }, [searchParams]);

  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [copied, setCopied] = useState(false);
  const [template, setTemplate] = useState<TemplateRecord | null>(null);
  const [activeTab, setActiveTab] = useState<TemplateTab>("structure");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);

        const res = await fetch(`/api/templates/${id}?role=${role}`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.template) {
          setTemplate(null);
          return;
        }

        setTemplate(json.template as TemplateRecord);
      } catch (error) {
        console.error("Failed to load template:", error);
        setTemplate(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      void loadTemplate();
    }
  }, [id, role]);

  useEffect(() => {
    if (!template?.sections?.length) {
      setSelectedSectionId(null);
      return;
    }

    setSelectedSectionId((current) => {
      const exists = template.sections.some((section) => section.id === current);
      return exists ? current : template.sections.slice().sort((a, b) => a.order - b.order)[0]?.id ?? null;
    });
  }, [template]);

  async function refreshTemplate() {
    const res = await fetch(`/api/templates/${id}?role=${role}`, {
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    if (res.ok && json?.template) {
      setTemplate(json.template as TemplateRecord);
    }
  }

  async function handlePublish() {
    try {
      setIsPublishing(true);

      const res = await fetch(`/api/templates/${id}?role=${role}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          updatedByUserId: "user-1",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to publish template.");
      }

      await refreshTemplate();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to publish template.");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleArchive() {
    try {
      setIsArchiving(true);

      const res = await fetch(`/api/templates/${id}?role=${role}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "archive",
          updatedByUserId: "user-1",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to archive template.");
      }

      await refreshTemplate();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to archive template.");
    } finally {
      setIsArchiving(false);
    }
  }

  async function handleCreatePage() {
    if (!template) return;

    try {
      setIsCreatingPage(true);

      const res = await fetch(`/api/pages?role=${role}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          name: `${template.name} Page`,
          createdByUserId: "user-1",
          updatedByUserId: "user-1",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.page?.id) {
        throw new Error(json?.error || "Failed to create page from template.");
      }

      router.push(`/pages/${json.page.id}?role=${role}`);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create page from template."
      );
    } finally {
      setIsCreatingPage(false);
    }
  }

  async function handleCopyTemplateId() {
    if (!template) return;

    try {
      await navigator.clipboard.writeText(template.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Failed to copy template id:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-72px)] items-center justify-center bg-[#f5f7fb] text-slate-500">
        Loading template…
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex min-h-[calc(100dvh-72px)] items-center justify-center bg-[#f5f7fb] text-slate-500">
        Template not found.
      </div>
    );
  }

  const sortedSections = template.sections.slice().sort((a, b) => a.order - b.order);
  const requiredSections = sortedSections.filter((section) => section.required);
  const optionalSections = sortedSections.filter((section) => !section.required);
  const selectedSection =
    sortedSections.find((section) => section.id === selectedSectionId) ?? null;

  const totalAllowedBlocks = sortedSections.reduce(
    (sum, section) => sum + section.allowedComponentIds.length,
    0
  );

  const totalAiHints = sortedSections.filter((section) => section.ai?.promptHint).length;
  const lockedSections = sortedSections.filter((section) => section.lockedOrder).length;

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[#f5f7fb] text-slate-900">
      <div className="mx-auto max-w-[1680px] px-6 py-8">
        <section className="rounded-[32px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_100%)] p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] lg:p-7">
          <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/templates?role=${role}`)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Templates
                </button>

                <StatusPill status={template.status} />
              </div>

              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#4f6fff]">
                Template Workspace
              </p>

              <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.05em] text-slate-900 lg:text-[40px]">
                {template.name}
              </h1>

              <p className="mt-3 max-w-[920px] text-sm leading-7 text-slate-500">
                {template.description || "No description provided for this template yet."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:max-w-[980px]">
                <OverviewCard
                  label="Category"
                  value={formatCategoryLabel(template.category)}
                />
                <OverviewCard label="Version" value={`v${template.version}`} />
                <OverviewCard label="Sections" value={`${sortedSections.length}`} />
                <OverviewCard label="Required" value={`${requiredSections.length}`} />
              </div>
            </div>

            <div className="flex w-full max-w-[760px] flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3 2xl:justify-end">
                <button
                  type="button"
                  onClick={handleCreatePage}
                  disabled={isCreatingPage}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {isCreatingPage ? "Creating Page…" : "Use Template"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/templates/new?role=${role}`)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" />
                  New Template
                </button>

                <button
                  type="button"
                  onClick={handleCopyTemplateId}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied ID" : "Copy ID"}
                </button>

                {template.status === "draft" ? (
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isPublishing ? "Publishing…" : "Publish"}
                  </button>
                ) : null}

                {template.status !== "archived" ? (
                  <button
                    type="button"
                    onClick={handleArchive}
                    disabled={isArchiving}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Archive className="h-4 w-4" />
                    {isArchiving ? "Archiving…" : "Archive"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-2">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            icon={<LayoutTemplate className="h-4 w-4" />}
            label="Overview"
          />
          <TabButton
            active={activeTab === "structure"}
            onClick={() => setActiveTab("structure")}
            icon={<FileText className="h-4 w-4" />}
            label="Structure"
          />
          <TabButton
            active={activeTab === "rules"}
            onClick={() => setActiveTab("rules")}
            icon={<Settings2 className="h-4 w-4" />}
            label="Rules"
          />
          <TabButton
            active={activeTab === "preview"}
            onClick={() => setActiveTab("preview")}
            icon={<Eye className="h-4 w-4" />}
            label="Preview"
          />
        </div>

        {activeTab === "overview" ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              <Panel
                title="Template Metadata"
                subtitle="Ownership and publishing information."
                icon={<LayoutTemplate className="h-5 w-5" />}
              >
                <div>
                  <MetaRow label="Template ID" value={template.id} />
                  <MetaRow label="Slug" value={template.slug} />
                  <MetaRow label="Status" value={template.status} />
                  <MetaRow
                    label="Category"
                    value={formatCategoryLabel(template.category)}
                  />
                  <MetaRow label="Audience" value={template.audience || "—"} />
                  <MetaRow label="Purpose" value={template.purpose || "—"} />
                  <MetaRow label="Created At" value={formatDateTime(template.createdAt)} />
                  <MetaRow label="Updated At" value={formatDateTime(template.updatedAt)} />
                  <MetaRow
                    label="Published At"
                    value={formatDateTime(template.publishedAt)}
                  />
                </div>
              </Panel>

              <Panel
                title="AI Guidance"
                subtitle="Template-level generation direction."
                icon={<Sparkles className="h-5 w-5" />}
              >
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm leading-6 text-slate-700">
                    {template.defaultAiInstruction || "No default AI instruction set."}
                  </p>
                </div>
              </Panel>
            </aside>

            <main className="min-w-0 space-y-6">
              <Panel
                title="Template Summary"
                subtitle="High-level structure and governance signals."
                icon={<FileText className="h-5 w-5" />}
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <OverviewCard
                    label="Total sections"
                    value={`${sortedSections.length}`}
                  />
                  <OverviewCard
                    label="Required sections"
                    value={`${requiredSections.length}`}
                  />
                  <OverviewCard
                    label="Allowed blocks"
                    value={`${totalAllowedBlocks}`}
                  />
                  <OverviewCard
                    label="Locked sections"
                    value={`${lockedSections}`}
                  />
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Structure overview
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {sortedSections.map((section, index) => (
                        <span
                          key={section.id}
                          className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                        >
                          <span className="text-slate-400">{index + 1}</span>
                          {section.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Governance signals
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone="emerald">{requiredSections.length} required</Badge>
                      <Badge tone="slate">{optionalSections.length} optional</Badge>
                      <Badge tone="amber">{lockedSections} locked order</Badge>
                      <Badge tone="blue">{totalAiHints} AI hints</Badge>
                    </div>
                  </div>
                </div>
              </Panel>

              <div className="grid gap-6 xl:grid-cols-2">
                <Panel
                  title="Required Sections"
                  subtitle="Core sections that must be completed."
                  icon={<CheckCircle2 className="h-5 w-5" />}
                >
                  <div className="space-y-3">
                    {requiredSections.length > 0 ? (
                      requiredSections.map((section) => (
                        <div
                          key={section.id}
                          className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <p className="text-sm font-medium text-slate-900">
                            {section.label}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {section.defaultComponentId || "No default component set"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No required sections.</p>
                    )}
                  </div>
                </Panel>

                <Panel
                  title="Optional Sections"
                  subtitle="Additional sections available to the marketer."
                  icon={<FileText className="h-5 w-5" />}
                >
                  <div className="space-y-3">
                    {optionalSections.length > 0 ? (
                      optionalSections.map((section) => (
                        <div
                          key={section.id}
                          className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <p className="text-sm font-medium text-slate-900">
                            {section.label}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {section.defaultComponentId || "No default component set"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No optional sections configured.
                      </p>
                    )}
                  </div>
                </Panel>
              </div>
            </main>
          </div>
        ) : null}

        {activeTab === "structure" ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_380px]">
            <main className="min-w-0">
              <Panel
                title="Page Structure"
                subtitle="A clearer page blueprint showing how this template is assembled."
                icon={<FileText className="h-5 w-5" />}
              >
                <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <OverviewCard
                    label="Sections"
                    value={`${sortedSections.length}`}
                  />
                  <OverviewCard
                    label="Required"
                    value={`${requiredSections.length}`}
                  />
                  <OverviewCard
                    label="Allowed blocks"
                    value={`${totalAllowedBlocks}`}
                  />
                  <OverviewCard
                    label="Locked order"
                    value={`${lockedSections}`}
                  />
                </div>

                {sortedSections.length === 0 ? (
                  <EmptyState
                    title="No sections configured"
                    text="This template does not have any sections yet."
                  />
                ) : (
                  <div className="space-y-4">
                    {sortedSections.map((section, index) => (
                      <SectionSummaryCard
                        key={section.id}
                        section={section}
                        index={index}
                        isSelected={selectedSection?.id === section.id}
                        onClick={() => setSelectedSectionId(section.id)}
                      />
                    ))}
                  </div>
                )}
              </Panel>
            </main>

            <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              <Panel
                title="Selected Section"
                subtitle="Focused detail for the section currently selected in the blueprint."
                icon={<LayoutTemplate className="h-5 w-5" />}
              >
                {selectedSection ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
                          {selectedSection.label}
                        </h3>

                        <Badge tone={selectedSection.required ? "emerald" : "slate"}>
                          {selectedSection.required ? "Required" : "Optional"}
                        </Badge>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {selectedSection.description ||
                          "No section description provided."}
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Section signals
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedSection.mustBeFirst ? (
                          <Badge tone="blue">Must be first</Badge>
                        ) : null}
                        {selectedSection.mustBeLast ? (
                          <Badge tone="purple">Must be last</Badge>
                        ) : null}
                        {selectedSection.lockedOrder ? (
                          <Badge tone="amber">Order locked</Badge>
                        ) : (
                          <Badge tone="slate">Order flexible</Badge>
                        )}
                        {selectedSection.canSkip ? (
                          <Badge tone="slate">Can skip</Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                      <RuleRow
                        label="Instances"
                        value={`${selectedSection.minInstances}–${selectedSection.maxInstances}`}
                      />
                      <RuleRow
                        label="Default block"
                        value={selectedSection.defaultComponentId || "—"}
                      />
                      <RuleRow
                        label="Allowed blocks"
                        value={`${selectedSection.allowedComponentIds.length}`}
                      />
                      <RuleRow
                        label="AI scope"
                        value={selectedSection.ai?.generateScope || "—"}
                      />
                    </div>

                    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Allowed blocks
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedSection.allowedComponentIds.length > 0 ? (
                          selectedSection.allowedComponentIds.map((componentId) => (
                            <span
                              key={componentId}
                              className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                            >
                              {componentId}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">None set</span>
                        )}
                      </div>
                    </div>

                    {(selectedSection.helpText || selectedSection.ai?.promptHint) ? (
                      <div className="grid gap-4">
                        <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Help text
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {selectedSection.helpText || "—"}
                          </p>
                        </div>

                        <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            AI prompt hint
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {selectedSection.ai?.promptHint || "—"}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Select a section to inspect it.</p>
                )}
              </Panel>
            </aside>
          </div>
        ) : null}

        {activeTab === "rules" ? (
          <div className="mt-6 grid gap-6">
            <Panel
              title="Section Rules"
              subtitle="A separate rules view so governance does not clutter the page blueprint."
              icon={<Settings2 className="h-5 w-5" />}
            >
              {sortedSections.length === 0 ? (
                <EmptyState
                  title="No section rules available"
                  text="This template does not currently contain any rule-bearing sections."
                />
              ) : (
                <div className="space-y-4">
                  {sortedSections.map((section, index) => (
                    <div
                      key={section.id}
                      className="rounded-[24px] border border-slate-200 bg-white p-5"
                    >
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                              {index + 1}
                            </span>
                            <h3 className="text-[16px] font-semibold text-slate-900">
                              {section.label}
                            </h3>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {section.description || "No section description provided."}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge tone={section.required ? "emerald" : "slate"}>
                            {section.required ? "Required" : "Optional"}
                          </Badge>
                          {section.mustBeFirst ? (
                            <Badge tone="blue">Must be first</Badge>
                          ) : null}
                          {section.mustBeLast ? (
                            <Badge tone="purple">Must be last</Badge>
                          ) : null}
                          {section.lockedOrder ? (
                            <Badge tone="amber">Locked order</Badge>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                          <RuleRow
                            label="Min / max instances"
                            value={`${section.minInstances}–${section.maxInstances}`}
                          />
                          <RuleRow
                            label="Default block"
                            value={section.defaultComponentId || "—"}
                          />
                          <RuleRow
                            label="Can skip"
                            value={section.canSkip ? "Yes" : "No"}
                          />
                          <RuleRow
                            label="Allowed blocks"
                            value={`${section.allowedComponentIds.length}`}
                          />
                        </div>

                        <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                          <RuleRow
                            label="Image min / max"
                            value={
                              section.imageRequirement
                                ? `${section.imageRequirement.min}–${section.imageRequirement.max}`
                                : "—"
                            }
                          />
                          <RuleRow
                            label="Alt text required"
                            value={
                              section.imageRequirement?.requiredAltText ? "Yes" : "No"
                            }
                          />
                          <RuleRow
                            label="AI scope"
                            value={section.ai?.generateScope || "—"}
                          />
                          <RuleRow
                            label="Blocked instructions"
                            value={`${section.ai?.blockedInstructions?.length ?? 0}`}
                          />
                        </div>
                      </div>

                      {(section.helpText || section.ai?.promptHint) ? (
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                              Help text
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              {section.helpText || "—"}
                            </p>
                          </div>

                          <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                              AI prompt hint
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              {section.ai?.promptHint || "—"}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        ) : null}

        {activeTab === "preview" ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
            <main className="min-w-0">
              <Panel
                title="Template Preview"
                subtitle="A simplified page-level preview showing how the template is structured."
                icon={<Eye className="h-5 w-5" />}
              >
                {sortedSections.length === 0 ? (
                  <EmptyState
                    title="Nothing to preview"
                    text="Add sections to this template to generate a preview."
                  />
                ) : (
                  <div className="space-y-4">
                    {sortedSections.map((section, index) => (
                      <div
                        key={section.id}
                        className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                              {index + 1}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {section.label}
                              </p>
                              <p className="text-xs text-slate-500">
                                {section.required ? "Required section" : "Optional section"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge tone={section.required ? "emerald" : "slate"}>
                              {section.required ? "Required" : "Optional"}
                            </Badge>
                            <Badge tone="slate">
                              {section.allowedComponentIds.length} blocks
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-4 rounded-[20px] border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
                          <p className="text-sm font-medium text-slate-700">
                            {section.defaultComponentId || "Representative block preview"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            This is a placeholder preview area for the section.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </main>

            <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              <Panel
                title="Preview Modes"
                subtitle="A foundation for richer visualisation in the next iteration."
                icon={<Wand2 className="h-5 w-5" />}
              >
                <div className="space-y-3">
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Structure view
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Shows the order and composition of the page.
                    </p>
                  </div>

                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Content view
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Can later show representative blocks and real sample content.
                    </p>
                  </div>

                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Governance view
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Can later visualise locked areas, optional sections, and review
                      requirements.
                    </p>
                  </div>
                </div>
              </Panel>
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}