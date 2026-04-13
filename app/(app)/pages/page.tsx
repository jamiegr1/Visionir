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

type PageStatus =
  | "draft"
  | "in_progress"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "published"
  | "archived";

type PageSummary = {
  id: string;
  name: string;
  slug?: string;
  status: PageStatus;
  templateId: string;
  templateName: string;
  templateVersion: number;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
  sections: Array<{
    sectionId: string;
    key: string;
    label: string;
    order: number;
    required: boolean;
    canSkip?: boolean;
    minInstances: number;
    maxInstances: number;
    allowedComponentIds: string[];
    defaultComponentId?: string | null;
    completed: boolean;
    blockIds: string[];
  }>;
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

function getStatusLabel(status: PageStatus) {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "pending_approval":
      return "Pending Approval";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "published":
      return "Published";
    case "archived":
      return "Archived";
    case "draft":
    default:
      return "Draft";
  }
}

function getStatusPillClass(status: PageStatus) {
  switch (status) {
    case "in_progress":
      return "bg-blue-50 text-blue-700 ring-blue-100";
    case "pending_approval":
      return "bg-violet-50 text-violet-700 ring-violet-100";
    case "approved":
      return "bg-sky-50 text-sky-700 ring-sky-100";
    case "rejected":
      return "bg-rose-50 text-rose-700 ring-rose-100";
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

function PageCard({
  page,
  role,
}: {
  page: PageSummary;
  role: Role;
}) {
  const router = useRouter();

  const sectionCount = page.sections.length;
  const completedCount = page.sections.filter((section) => section.completed).length;
  const attachedBlockCount = page.sections.reduce(
    (sum, section) => sum + section.blockIds.length,
    0
  );

  return (
    <button
      type="button"
      onClick={() => router.push(`/pages/${page.id}?role=${role}`)}
      className="group rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <span
          className={cx(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
            getStatusPillClass(page.status)
          )}
        >
          {getStatusLabel(page.status)}
        </span>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 transition group-hover:bg-[#eef3ff] group-hover:text-[#4f6fff]">
          <FileText className="h-4.5 w-4.5" />
        </div>
      </div>

      <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900">
        {page.name}
      </h3>

      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
        Built from {page.templateName} · v{page.templateVersion}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Sections
          </p>
          <p className="mt-1.5 text-sm font-medium text-slate-900">
            {sectionCount}
          </p>
        </div>

        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Complete
          </p>
          <p className="mt-1.5 text-sm font-medium text-slate-900">
            {completedCount}
          </p>
        </div>

        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Blocks
          </p>
          <p className="mt-1.5 text-sm font-medium text-slate-900">
            {attachedBlockCount}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-700">
            {page.slug || "No slug"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {relativeUpdatedLabel(page.updatedAt)}
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

function PageRow({
  page,
  role,
}: {
  page: PageSummary;
  role: Role;
}) {
  const router = useRouter();

  const completedCount = page.sections.filter((section) => section.completed).length;

  return (
    <div
      onClick={() => router.push(`/pages/${page.id}?role=${role}`)}
      className="grid cursor-pointer grid-cols-[minmax(0,1.3fr)_170px_120px_150px] items-center gap-4 rounded-[22px] border border-transparent px-3 py-3 transition hover:border-slate-200 hover:bg-slate-50/80"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {page.name}
        </p>
        <p className="mt-1 truncate text-sm text-slate-500">
          {page.templateName} · {page.sections.length} sections
        </p>
      </div>

      <div className="text-sm text-slate-600">
        {completedCount}/{page.sections.length} complete
      </div>

      <div>
        <span
          className={cx(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
            getStatusPillClass(page.status)
          )}
        >
          {getStatusLabel(page.status)}
        </span>
      </div>

      <div className="text-sm text-slate-500">{formatDate(page.updatedAt)}</div>
    </div>
  );
}

export default function PagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return isRole(value) ? value : "admin";
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function loadPages() {
      try {
        setLoading(true);

        const res = await fetch(`/api/pages?role=${role}`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));
        const rawPages = Array.isArray(json?.pages)
          ? (json.pages as PageSummary[])
          : [];

        setPages(rawPages);
      } catch (error) {
        console.error("Failed to load pages:", error);
        setPages([]);
      } finally {
        setLoading(false);
      }
    }

    void loadPages();
  }, [role]);

  const visiblePages = useMemo(() => {
    return pages.filter((page) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();

      return (
        page.name.toLowerCase().includes(q) ||
        (page.slug || "").toLowerCase().includes(q) ||
        page.templateName.toLowerCase().includes(q)
      );
    });
  }, [pages, query]);

  const totals = useMemo(() => {
    const published = pages.filter((page) => page.status === "published").length;
    const drafts = pages.filter((page) => page.status === "draft").length;
    const totalBlocks = pages.reduce(
      (sum, page) =>
        sum + page.sections.reduce((sectionSum, section) => sectionSum + section.blockIds.length, 0),
      0
    );

    return {
      total: pages.length,
      published,
      drafts,
      blocks: totalBlocks,
    };
  }, [pages]);

  const featuredPages = useMemo(() => visiblePages.slice(0, 6), [visiblePages]);

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[#f5f7fb] text-slate-900">
      <div className="mx-auto max-w-[1880px] px-5 py-5 lg:px-7 lg:py-6">
        <section className="rounded-[32px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_100%)] p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] lg:p-7">
          <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#4f6fff]">
                Page System
              </p>

              <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.05em] text-slate-900 lg:text-[40px]">
                Governed pages
              </h1>

              <p className="mt-3 max-w-[900px] text-sm leading-7 text-slate-500">
                Manage the pages created from your governed templates. Track completion,
                workflow status, and how each page is progressing against its approved structure.
              </p>
            </div>

            <div className="flex w-full max-w-[620px] flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3 2xl:justify-end">
                <div className="relative min-w-[280px] flex-1 2xl:max-w-[340px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search pages"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#cfd8f6] focus:ring-4 focus:ring-[#eef3ff]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/pages/new?role=${role}`)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5]"
                >
                  <Plus className="h-4.5 w-4.5" />
                  New Page
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <MetricCard
            label="Total pages"
            value={totals.total}
            icon={<FileText className="h-5 w-5" />}
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
            label="Attached blocks"
            value={totals.blocks}
            icon={<LayoutTemplate className="h-5 w-5" />}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-6">
            <SectionHeader
              title="Page library"
              subtitle="Browse the latest governed pages created from your templates."
              right={
                <button
                  type="button"
                  onClick={() => router.push(`/pages/new?role=${role}`)}
                  className="rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
                >
                  Create Page
                </button>
              }
            />

            {loading ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-14 text-center text-sm text-slate-500">
                Loading pages…
              </div>
            ) : visiblePages.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-700">
                  No pages yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Start by creating a new page from an approved template.
                </p>

                <button
                  type="button"
                  onClick={() => router.push(`/pages/new?role=${role}`)}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
                >
                  <Plus className="h-4 w-4" />
                  Create first page
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {featuredPages.map((page) => (
                    <PageCard key={page.id} page={page} role={role} />
                  ))}
                </div>

                {visiblePages.length > 6 ? (
                  <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 grid grid-cols-[minmax(0,1.3fr)_170px_120px_150px] gap-4 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      <span>Page</span>
                      <span>Progress</span>
                      <span>Status</span>
                      <span>Updated</span>
                    </div>

                    <div className="space-y-1">
                      {visiblePages.slice(6).map((page) => (
                        <PageRow key={page.id} page={page} role={role} />
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
                title="How pages work"
                subtitle="A simple governed workflow from template to published page."
              />

              <div className="space-y-3">
                {[
                  {
                    step: "1",
                    title: "Choose a template",
                    text: "Start with an approved page blueprint rather than building from scratch.",
                  },
                  {
                    step: "2",
                    title: "Build within the structure",
                    text: "Add blocks into the allowed sections and work through the required page areas.",
                  },
                  {
                    step: "3",
                    title: "Move through workflow",
                    text: "Submit, approve, and publish pages through the governed process.",
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
                Create a new governed page
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Start from an approved template, inherit the correct structure,
                and move the page through the right workflow.
              </p>

              <button
                type="button"
                onClick={() => router.push(`/pages/new?role=${role}`)}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
              >
                Create Page
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}