"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  LayoutTemplate,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";

type Role = "creator" | "approver" | "admin";

type TemplateSummary = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  status: "draft" | "published" | "archived";
  version?: number;
  updatedAt?: string | null;
  publishedAt?: string | null;
  sectionCount?: number;
  requiredSectionCount?: number;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isRole(value: string | null): value is Role {
  return value === "creator" || value === "approver" || value === "admin";
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getStatusLabel(status: TemplateSummary["status"]) {
  switch (status) {
    case "published":
      return "Published";
    case "archived":
      return "Archived";
    case "draft":
    default:
      return "Draft";
  }
}

function getStatusPillClass(status: TemplateSummary["status"]) {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "archived":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    case "draft":
    default:
      return "bg-amber-50 text-amber-700 ring-amber-100";
  }
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

function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>

      {right}
    </div>
  );
}

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: TemplateSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cx(
        "group rounded-[26px] border p-5 text-left transition",
        selected
          ? "border-[#cfd8f6] bg-[#f7f9ff] shadow-[0_14px_30px_rgba(91,124,255,0.10)]"
          : "border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <span
          className={cx(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
            getStatusPillClass(template.status)
          )}
        >
          {getStatusLabel(template.status)}
        </span>

        <div
          className={cx(
            "flex h-10 w-10 items-center justify-center rounded-2xl transition",
            selected
              ? "bg-[#eef3ff] text-[#4f6fff]"
              : "bg-slate-50 text-slate-500 group-hover:bg-[#eef3ff] group-hover:text-[#4f6fff]"
          )}
        >
          {selected ? (
            <CheckCircle2 className="h-4.5 w-4.5" />
          ) : (
            <LayoutTemplate className="h-4.5 w-4.5" />
          )}
        </div>
      </div>

      <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900">
        {template.name}
      </h3>

      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
        {template.description || "No description provided yet."}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Sections
          </p>
          <p className="mt-1.5 text-sm font-medium text-slate-900">
            {template.sectionCount ?? 0}
          </p>
        </div>

        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Required
          </p>
          <p className="mt-1.5 text-sm font-medium text-slate-900">
            {template.requiredSectionCount ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-700">
            {(template.category || "custom").toLowerCase()} · v{template.version ?? 1}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Updated {formatDate(template.updatedAt)}
          </p>
        </div>

        <span
          className={cx(
            "inline-flex items-center gap-1 text-sm font-medium",
            selected ? "text-[#4f6fff]" : "text-slate-500"
          )}
        >
          {selected ? "Selected" : "Choose"}
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
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

export default function NewPagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return isRole(value) ? value : "admin";
  }, [searchParams]);

  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [isCreatingPage, setIsCreatingPage] = useState(false);

  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [query, setQuery] = useState("");

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const [pageName, setPageName] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [pageDescription, setPageDescription] = useState("");

  useEffect(() => {
    async function loadTemplates() {
      try {
        setLoadingTemplates(true);

        const res = await fetch(`/api/templates?role=${role}`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));
        const rawTemplates = Array.isArray(json?.templates)
          ? (json.templates as TemplateSummary[])
          : [];

        const usableTemplates = rawTemplates.filter(
          (template) => template.status !== "archived"
        );

        setTemplates(usableTemplates);

        const firstPublished =
          usableTemplates.find((template) => template.status === "published") ??
          usableTemplates[0] ??
          null;

        if (firstPublished) {
          setSelectedTemplateId(firstPublished.id);
        }
      } catch (error) {
        console.error("Failed to load templates:", error);
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    }

    void loadTemplates();
  }, [role]);

  const visibleTemplates = useMemo(() => {
    return templates.filter((template) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();

      return (
        template.name.toLowerCase().includes(q) ||
        (template.description || "").toLowerCase().includes(q) ||
        (template.category || "").toLowerCase().includes(q)
      );
    });
  }, [templates, query]);

  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ?? null;

  useEffect(() => {
    if (!selectedTemplate) return;

    setPageName((current) => current || `${selectedTemplate.name} Page`);
    setPageSlug((current) =>
      current || slugify(`${selectedTemplate.slug || selectedTemplate.name}-page`)
    );
  }, [selectedTemplate]);

  async function handleCreatePage() {
    if (!selectedTemplate) {
      alert("Please select a template first.");
      return;
    }

    if (!pageName.trim()) {
      alert("Please enter a page name.");
      return;
    }

    try {
      setIsCreatingPage(true);

      const res = await fetch(`/api/pages?role=${role}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          name: pageName.trim(),
          slug: pageSlug.trim() || slugify(pageName),
          description: pageDescription.trim(),
          createdByUserId: "user-1",
          updatedByUserId: "user-1",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.page?.id) {
        throw new Error(json?.error || "Failed to create page.");
      }

      router.push(`/pages/${json.page.id}?role=${role}`);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to create page.");
    } finally {
      setIsCreatingPage(false);
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
                  Back
                </button>

                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#4f6fff]">
                  Page Creation
                </p>
              </div>

              <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-slate-900 lg:text-[34px]">
                Create a page from a governed template
              </h1>

              <p className="mt-2 max-w-[880px] text-sm leading-6 text-slate-500">
                Choose the right page blueprint first, then create a new page that
                inherits the approved structure.
              </p>
            </div>

            <div className="flex w-full max-w-[520px] flex-col gap-2 xl:items-end">
              <button
                type="button"
                onClick={handleCreatePage}
                disabled={isCreatingPage || !selectedTemplate}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {isCreatingPage ? "Creating Page..." : "Create Page"}
              </button>

              <p className="text-sm text-slate-500">
                Start with structure first. Refine content after creation.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_400px]">
          <main className="min-w-0 space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-6">
              <SectionHeader
                title="Choose a template"
                subtitle="Select the page blueprint this new page should use."
                right={
                  <div className="relative min-w-[240px] flex-1 xl:max-w-[320px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search templates"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#cfd8f6] focus:ring-4 focus:ring-[#eef3ff]"
                    />
                  </div>
                }
              />

              {loadingTemplates ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-14 text-center text-sm text-slate-500">
                  Loading templates...
                </div>
              ) : visibleTemplates.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-14 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
                    <LayoutTemplate className="h-5 w-5" />
                  </div>

                  <p className="mt-4 text-sm font-medium text-slate-700">
                    No templates available
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Create a governed template before creating a page.
                  </p>

                  <button
                    type="button"
                    onClick={() => router.push(`/templates/new?role=${role}`)}
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
                  >
                    <Plus className="h-4 w-4" />
                    Create Template
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                  {visibleTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      selected={selectedTemplateId === template.id}
                      onSelect={() => setSelectedTemplateId(template.id)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-7">
              <div className="mb-6 max-w-[760px]">
                <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
                  New page details
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Give the new page a clear identity. The selected template will handle
                  the structure.
                </p>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <FieldLabel>Page Name</FieldLabel>
                  <TextInput
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                    placeholder="Kiwa UK Service Page"
                  />
                </div>

                <div>
                  <FieldLabel hint="Optional. Leave blank to generate from the page name.">
                    Slug
                  </FieldLabel>
                  <TextInput
                    value={pageSlug}
                    onChange={(e) => setPageSlug(slugify(e.target.value))}
                    placeholder="kiwa-uk-service-page"
                  />
                </div>

                <div className="lg:col-span-2">
                  <FieldLabel>Description</FieldLabel>
                  <TextArea
                    value={pageDescription}
                    onChange={(e) => setPageDescription(e.target.value)}
                    rows={4}
                    placeholder="A new page created from the approved service page template."
                  />
                </div>
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-6">
              <SectionHeader
                title="Selected template"
                subtitle="A quick summary of the page blueprint you are using."
              />

              {!selectedTemplate ? (
                <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    No template selected
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose a template to continue.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
                        {selectedTemplate.name}
                      </h3>

                      <span
                        className={cx(
                          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                          getStatusPillClass(selectedTemplate.status)
                        )}
                      >
                        {getStatusLabel(selectedTemplate.status)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {selectedTemplate.description || "No description provided yet."}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                    <MiniStat
                      label="Sections"
                      value={selectedTemplate.sectionCount ?? 0}
                    />
                    <MiniStat
                      label="Required"
                      value={selectedTemplate.requiredSectionCount ?? 0}
                    />
                    <MiniStat
                      label="Category"
                      value={selectedTemplate.category || "custom"}
                    />
                    <MiniStat
                      label="Version"
                      value={`v${selectedTemplate.version ?? 1}`}
                    />
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Template metadata
                    </p>

                    <div className="mt-3">
                      <MetaRow label="Slug" value={selectedTemplate.slug} />
                      <MetaRow
                        label="Published"
                        value={formatDate(selectedTemplate.publishedAt)}
                      />
                      <MetaRow
                        label="Updated"
                        value={formatDate(selectedTemplate.updatedAt)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_100%)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#4f6fff] ring-1 ring-[#dbe5ff]">
                <Sparkles className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
                How this flow works
              </h3>

              <div className="mt-4 space-y-3">
                {[
                  {
                    title: "1. Choose the template",
                    text: "Start from an approved page structure rather than building from scratch.",
                  },
                  {
                    title: "2. Create the page",
                    text: "The new page inherits the governed blueprint and section logic.",
                  },
                  {
                    title: "3. Refine content next",
                    text: "After creation, editors can complete the page within the template guardrails.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[20px] border border-slate-200 bg-white px-4 py-4"
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

              <button
                type="button"
                onClick={handleCreatePage}
                disabled={isCreatingPage || !selectedTemplate}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4c6ff5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileText className="h-4 w-4" />
                {isCreatingPage ? "Creating Page..." : "Create Page"}
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}