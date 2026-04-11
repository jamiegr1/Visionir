"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
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

function relativeUpdatedLabel(value: string | null | undefined) {
  if (!value) return "Updated recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Updated recently";

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.max(1, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `Last edited ${diffMins} min ago`;
  if (diffHours < 24) return `Last edited ${diffHours}h ago`;
  if (diffDays < 7) return `Last edited ${diffDays}d ago`;

  return `Updated ${formatDate(value)}`;
}

function getStatusLabel(status: string) {
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

function getStatusPillClass(status: string) {
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

function MetricCard({
  label,
  value,
  tone = "blue",
  icon,
}: {
  label: string;
  value: string | number;
  tone?: "blue" | "emerald" | "slate";
  icon: React.ReactNode;
}) {
  const ring =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
      : tone === "slate"
        ? "bg-slate-100 text-slate-600 ring-slate-200"
        : "bg-[#eef3ff] text-[#4f6fff] ring-[#dbe5ff]";

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[26px] font-semibold leading-none tracking-[-0.04em] text-slate-900">
            {value}
          </p>
          <p className="mt-2 truncate text-sm text-slate-500">{label}</p>
        </div>

        <div
          className={cx(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1",
            ring
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  role,
}: {
  template: TemplateSummary;
  role: Role;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/templates/${template.id}?role=${role}`)}
      className="group rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
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

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 transition group-hover:bg-[#eef3ff] group-hover:text-[#4f6fff]">
          <LayoutTemplate className="h-4.5 w-4.5" />
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
            {template.category || "custom"} · v{template.version ?? 1}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {relativeUpdatedLabel(template.updatedAt)}
          </p>
        </div>

        <span className="inline-flex items-center gap-1 text-sm font-medium text-[#4f6fff]">
          Open
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}

function TemplateRow({
  template,
  role,
}: {
  template: TemplateSummary;
  role: Role;
}) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/templates/${template.id}?role=${role}`)}
      className="grid cursor-pointer grid-cols-[minmax(0,1.4fr)_120px_120px_150px] items-center gap-4 rounded-[22px] border border-transparent px-3 py-3 transition hover:border-slate-200 hover:bg-slate-50/80"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {template.name}
        </p>
        <p className="mt-1 truncate text-sm text-slate-500">
          {template.category || "custom"} · {template.sectionCount ?? 0} sections
        </p>
      </div>

      <div className="text-sm text-slate-600">
        {template.requiredSectionCount ?? 0} required
      </div>

      <div>
        <span
          className={cx(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
            getStatusPillClass(template.status)
          )}
        >
          {getStatusLabel(template.status)}
        </span>
      </div>

      <div className="text-sm text-slate-500">{formatDate(template.updatedAt)}</div>
    </div>
  );
}

export default function TemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return isRole(value) ? value : "admin";
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function loadTemplates() {
      try {
        setLoading(true);

        const res = await fetch(`/api/templates?role=${role}`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));
        const rawTemplates = Array.isArray(json?.templates)
          ? (json.templates as TemplateSummary[])
          : [];

        setTemplates(rawTemplates);
      } catch (error) {
        console.error("Failed to load templates:", error);
        setTemplates([]);
      } finally {
        setLoading(false);
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

  const totals = useMemo(() => {
    return {
      total: templates.length,
      published: templates.filter((t) => t.status === "published").length,
      drafts: templates.filter((t) => t.status === "draft").length,
      sections: templates.reduce((sum, t) => sum + (t.sectionCount ?? 0), 0),
    };
  }, [templates]);

  const featuredTemplates = useMemo(
    () => visibleTemplates.slice(0, 6),
    [visibleTemplates]
  );

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[#f5f7fb] text-slate-900">
      <div className="mx-auto max-w-[1880px] px-5 py-5 lg:px-7 lg:py-6">
        <section className="rounded-[32px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_100%)] p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] lg:p-7">
          <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#4f6fff]">
                Template System
              </p>

              <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.05em] text-slate-900 lg:text-[40px]">
                Governed page templates
              </h1>

              <p className="mt-3 max-w-[900px] text-sm leading-7 text-slate-500">
                Create structured page types that marketing teams can use confidently.
                Define the page blueprint, control allowed blocks, and keep every page
                aligned to brand, governance, and workflow rules.
              </p>
            </div>

            <div className="flex w-full max-w-[620px] flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3 2xl:justify-end">
                <div className="relative min-w-[280px] flex-1 2xl:max-w-[340px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search templates"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#cfd8f6] focus:ring-4 focus:ring-[#eef3ff]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/templates/new?role=${role}`)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5]"
                >
                  <Plus className="h-4.5 w-4.5" />
                  New Template
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <MetricCard
            label="Total templates"
            value={totals.total}
            icon={<LayoutTemplate className="h-5 w-5" />}
          />
          <MetricCard
            label="Published"
            value={totals.published}
            tone="emerald"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <MetricCard
            label="Drafts"
            value={totals.drafts}
            tone="slate"
            icon={<Clock3 className="h-5 w-5" />}
          />
          <MetricCard
            label="Total sections"
            value={totals.sections}
            icon={<FileText className="h-5 w-5" />}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-6">
            <SectionHeader
              title="Template library"
              subtitle="Browse your most recent page types and governed blueprints."
              right={
                <button
                  type="button"
                  onClick={() => router.push(`/templates/new?role=${role}`)}
                  className="rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
                >
                  Create Template
                </button>
              }
            />

            {loading ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-14 text-center text-sm text-slate-500">
                Loading templates…
              </div>
            ) : visibleTemplates.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
                  <LayoutTemplate className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-700">
                  No templates yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Start by creating a governed page type for your team.
                </p>

                <button
                  type="button"
                  onClick={() => router.push(`/templates/new?role=${role}`)}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
                >
                  <Plus className="h-4 w-4" />
                  Create first template
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {featuredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      role={role}
                    />
                  ))}
                </div>

                {visibleTemplates.length > 6 ? (
                  <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 grid grid-cols-[minmax(0,1.4fr)_120px_120px_150px] gap-4 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      <span>Template</span>
                      <span>Required</span>
                      <span>Status</span>
                      <span>Updated</span>
                    </div>

                    <div className="space-y-1">
                      {visibleTemplates.slice(6).map((template) => (
                        <TemplateRow
                          key={template.id}
                          template={template}
                          role={role}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-6">
              <SectionHeader
                title="How templates work"
                subtitle="A simple governed workflow for structured page creation."
              />

              <div className="space-y-3">
                {[
                  {
                    step: "1",
                    title: "Create the page blueprint",
                    text: "Define the section order, required blocks, and allowed component types.",
                  },
                  {
                    step: "2",
                    title: "Set section-level rules",
                    text: "Control requirements like images, AI instructions, and optional or required sections.",
                  },
                  {
                    step: "3",
                    title: "Let teams build against it",
                    text: "Marketers use the template to complete each section with governed blocks.",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#4f6fff] ring-1 ring-slate-200">
                        {item.step}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_100%)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#4f6fff] ring-1 ring-[#dbe5ff]">
                <Sparkles className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
                Build a new governed page type
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create an enterprise-ready template with structured sections,
                allowed block types, AI guidance, and controlled page composition.
              </p>

              <button
                type="button"
                onClick={() => router.push(`/templates/new?role=${role}`)}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
              >
                Create Template
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}