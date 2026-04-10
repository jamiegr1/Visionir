"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Archive,
  CheckCircle2,
  Copy,
  FileText,
  LayoutTemplate,
  Pencil,
  Plus,
  Sparkles,
} from "lucide-react";

type Role = "creator" | "approver" | "admin";

type TemplateStatus = "draft" | "published" | "archived";

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

function StatusPill({ status }: { status: TemplateStatus }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1",
        status === "published" && "bg-emerald-50 text-emerald-700 ring-emerald-200",
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

  const requiredSections = template.sections.filter((section) => section.required);
  const optionalSections = template.sections.filter((section) => !section.required);

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[#f5f7fb] text-slate-900">
      <div className="mx-auto max-w-[1600px] px-6 py-8">
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
                Template Detail
              </p>

              <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.05em] text-slate-900 lg:text-[40px]">
                {template.name}
              </h1>

              <p className="mt-3 max-w-[900px] text-sm leading-7 text-slate-500">
                {template.description || "No description provided for this template yet."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:max-w-[920px]">
                <OverviewCard label="Category" value={template.category} />
                <OverviewCard label="Version" value={`v${template.version}`} />
                <OverviewCard
                  label="Sections"
                  value={`${template.sections.length}`}
                />
                <OverviewCard
                  label="Required"
                  value={`${requiredSections.length}`}
                />
              </div>
            </div>

            <div className="flex w-full max-w-[720px] flex-col gap-3">
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
                <MetaRow label="Category" value={template.category} />
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
              title="Page Structure"
              subtitle="Ordered template sections marketers will complete."
              icon={<FileText className="h-5 w-5" />}
            >
              <div className="space-y-4">
                {template.sections
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((section, index) => (
                    <div
                      key={section.id}
                      className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
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

                          {section.mustBeFirst ? (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              Must be first
                            </span>
                          ) : null}

                          {section.mustBeLast ? (
                            <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                              Must be last
                            </span>
                          ) : null}

                          {section.lockedOrder ? (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              Order locked
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Allowed Components
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {section.allowedComponentIds.length > 0 ? (
                              section.allowedComponentIds.map((componentId) => (
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

                        <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Rules
                          </p>
                          <div className="mt-2 space-y-1.5 text-sm text-slate-700">
                            <p>
                              Instances: {section.minInstances}–{section.maxInstances}
                            </p>
                            <p>
                              Default component:{" "}
                              {section.defaultComponentId || "—"}
                            </p>
                            <p>
                              Images: {section.imageRequirement?.min ?? 0}–
                              {section.imageRequirement?.max ?? 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      {(section.helpText || section.ai?.promptHint) ? (
                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                          <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                              Help Text
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              {section.helpText || "—"}
                            </p>
                          </div>

                          <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                              AI Prompt Hint
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
      </div>
    </div>
  );
}