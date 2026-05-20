"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  LayoutDashboard,
  LayoutTemplate,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react";

type Role = "creator" | "approver" | "admin";

type PageView =
  | "all"
  | "recent"
  | "drafts"
  | "awaiting_approval"
  | "ready_to_publish"
  | "published"
  | "governance_issues";

type SortMode = "updated_desc" | "updated_asc" | "name_asc" | "name_desc" | "completion_desc" | "completion_asc";

type GroupMode = "none" | "status" | "template";

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

function getPageCompletion(page: PageSummary) {
  if (page.sections.length === 0) return 0;

  const completed = page.sections.filter((section) => section.completed).length;
  return Math.round((completed / page.sections.length) * 100);
}

function getAttachedBlockCount(page: PageSummary) {
  return page.sections.reduce(
    (sum, section) => sum + section.blockIds.length,
    0
  );
}

function isReadyToPublish(page: PageSummary) {
  const requiredSections = page.sections.filter((section) => section.required);

  const requiredComplete = requiredSections.every((section) => {
    if (section.completed) return true;

    const minInstances = Math.max(section.minInstances ?? 1, 1);
    return section.blockIds.length >= minInstances;
  });

  return page.status === "approved" && requiredComplete;
}

function hasGovernanceIssue(page: PageSummary) {
  const requiredSections = page.sections.filter((section) => section.required);
  const missingRequiredSection = requiredSections.some((section) => {
    const minInstances = Math.max(section.minInstances ?? 1, 1);
    return !section.completed && section.blockIds.length < minInstances;
  });

  return (
    page.status === "rejected" ||
    page.status === "archived" ||
    missingRequiredSection ||
    getPageCompletion(page) < 60
  );
}

function includesValue(value: string | null | undefined, query: string) {
  return (value || "").toLowerCase().includes(query);
}

function normaliseUrlSearchValue(value: string | null | undefined) {
  if (!value) return "";

  let cleaned = value.trim().toLowerCase();

  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {
    // Keep the original value if it cannot be decoded.
  }

  cleaned = cleaned
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("?")[0]
    .split("#")[0];

  const firstSlashIndex = cleaned.indexOf("/");

  if (firstSlashIndex >= 0) {
    cleaned = cleaned.slice(firstSlashIndex);
  }

  cleaned = cleaned.replace(/^\/+/, "").replace(/\/+$/, "");

  return cleaned;
}

function getPageSearchTerms(page: PageSummary) {
  const slug = page.slug || "";
  const normalisedSlug = normaliseUrlSearchValue(slug);
  const slugParts = normalisedSlug.split("/").filter(Boolean);
  const finalSlugSegment = slugParts[slugParts.length - 1] || "";

  return [
    page.name,
    slug,
    normalisedSlug,
    finalSlugSegment,
    page.templateName,
    getStatusLabel(page.status),
    ...page.sections.flatMap((section) => [
      section.label,
      section.key,
      ...section.allowedComponentIds,
    ]),
  ]
    .map((term) => term.toLowerCase())
    .filter(Boolean);
}

function SelectControl({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-[180px] flex-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#cfd8f6] focus:ring-4 focus:ring-[#eef3ff]"
      >
        {children}
      </select>
    </label>
  );
}

function ViewButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition",
        active
          ? "border-[#dbe5ff] bg-[#eef3ff] text-[#4f6fff]"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <span>{label}</span>
      <span
        className={cx(
          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
          active ? "bg-white/80 text-[#4f6fff]" : "bg-slate-100 text-slate-500"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function QuickPageCard({
  page,
  role,
  region,
}: {
  page: PageSummary;
  role: Role;
  region: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/pages/${page.id}?role=${role}&region=${region}`)}
      className="flex min-w-[260px] flex-1 items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#dbe5ff] hover:bg-[#f8faff]"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {page.name}
        </p>
        <p className="mt-1 truncate text-xs text-slate-500">
          {page.templateName} · {relativeUpdatedLabel(page.updatedAt)}
        </p>
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
    </button>
  );
}

function ActiveFilterPill({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
    >
      {label}
      <X className="h-3.5 w-3.5" />
    </button>
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
  region,
}: {
  page: PageSummary;
  role: Role;
  region: string;
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
      onClick={() => router.push(`/pages/${page.id}?role=${role}&region=${region}`)}
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
  region,
}: {
  page: PageSummary;
  role: Role;
  region: string;
}) {
  const router = useRouter();

  const completedCount = page.sections.filter((section) => section.completed).length;

  return (
    <div
      onClick={() => router.push(`/pages/${page.id}?role=${role}&region=${region}`)}
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

  const region = searchParams.get("region") || "mediascout-uk";
  const isActiveDataRegion = region === "mediascout-uk";
  const regionLabel =
    region === "mediascout-dubai"
      ? "Mediascout Dubai"
      : region === "mediascout-france"
        ? "Mediascout France"
        : "Mediascout UK";

  function withRegion(path: string) {
    const joiner = path.includes("?") ? "&" : "?";
    return `${path}${joiner}role=${role}&region=${region}`;
  }

  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [query, setQuery] = useState("");
  const [activeView, setActiveView] = useState<PageView>("all");
  const [statusFilter, setStatusFilter] = useState<PageStatus | "all">("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [completionFilter, setCompletionFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("updated_desc");
  const [groupMode, setGroupMode] = useState<GroupMode>("none");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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

        setPages(isActiveDataRegion ? rawPages : []);
      } catch (error) {
        console.error("Failed to load pages:", error);
        setPages([]);
      } finally {
        setLoading(false);
      }
    }

    void loadPages();
  }, [role, isActiveDataRegion]);

  const templateOptions = useMemo(() => {
    return Array.from(new Set(pages.map((page) => page.templateName))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [pages]);

  const recentlyEditedPages = useMemo(() => {
    return pages
      .slice()
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 4);
  }, [pages]);

  const viewCounts = useMemo(() => {
    return {
      all: pages.length,
      recent: recentlyEditedPages.length,
      drafts: pages.filter((page) => page.status === "draft").length,
      awaiting_approval: pages.filter((page) => page.status === "pending_approval").length,
      ready_to_publish: pages.filter((page) => isReadyToPublish(page)).length,
      published: pages.filter((page) => page.status === "published").length,
      governance_issues: pages.filter((page) => hasGovernanceIssue(page)).length,
    };
  }, [pages, recentlyEditedPages.length]);

  const visiblePages = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = pages.filter((page) => {
      const normalisedQuery = normaliseUrlSearchValue(q);
      const pageSearchTerms = getPageSearchTerms(page);

      const matchesSearch =
        !q ||
        pageSearchTerms.some(
          (term) =>
            term.includes(q) ||
            (!!normalisedQuery && term.includes(normalisedQuery))
        );

      if (!matchesSearch) return false;

      if (activeView === "recent" && !recentlyEditedPages.some((item) => item.id === page.id)) {
        return false;
      }

      if (activeView === "drafts" && page.status !== "draft") return false;
      if (activeView === "awaiting_approval" && page.status !== "pending_approval") return false;
      if (activeView === "ready_to_publish" && !isReadyToPublish(page)) return false;
      if (activeView === "published" && page.status !== "published") return false;
      if (activeView === "governance_issues" && !hasGovernanceIssue(page)) return false;

      if (statusFilter !== "all" && page.status !== statusFilter) return false;
      if (templateFilter !== "all" && page.templateName !== templateFilter) return false;

      const completion = getPageCompletion(page);

      if (completionFilter === "complete" && completion < 100) return false;
      if (completionFilter === "incomplete" && completion >= 100) return false;
      if (completionFilter === "low" && completion >= 60) return false;

      return true;
    });

    return filtered.sort((a, b) => {
      if (sortMode === "updated_asc") {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }

      if (sortMode === "name_asc") {
        return a.name.localeCompare(b.name);
      }

      if (sortMode === "name_desc") {
        return b.name.localeCompare(a.name);
      }

      if (sortMode === "completion_desc") {
        return getPageCompletion(b) - getPageCompletion(a);
      }

      if (sortMode === "completion_asc") {
        return getPageCompletion(a) - getPageCompletion(b);
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [
    activeView,
    completionFilter,
    pages,
    query,
    recentlyEditedPages,
    sortMode,
    statusFilter,
    templateFilter,
  ]);

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

  const groupedPages = useMemo(() => {
    if (groupMode === "none") return [];

    const groups = new Map<string, PageSummary[]>();

    visiblePages.forEach((page) => {
      const key =
        groupMode === "status"
          ? getStatusLabel(page.status)
          : page.templateName || "No template";

      const existing = groups.get(key) ?? [];
      existing.push(page);
      groups.set(key, existing);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [groupMode, visiblePages]);

  const activeFilterCount =
    (query.trim() ? 1 : 0) +
    (activeView !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (templateFilter !== "all" ? 1 : 0) +
    (completionFilter !== "all" ? 1 : 0);

  function clearFilters() {
    setQuery("");
    setActiveView("all");
    setStatusFilter("all");
    setTemplateFilter("all");
    setCompletionFilter("all");
    setSortMode("updated_desc");
    setGroupMode("none");
  }

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[#f5f7fb] text-slate-900">
      <div className="mx-auto max-w-[1880px] px-5 py-5 lg:px-7 lg:py-6">
        <section className="rounded-[32px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_100%)] p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] lg:p-7">
          <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#4f6fff]">
                Page System
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-[34px] font-semibold tracking-[-0.05em] text-slate-900 lg:text-[40px]">
                  Governed pages
                </h1>

                <span className="inline-flex rounded-full border border-[#dbe5ff] bg-[#eef3ff] px-3 py-1.5 text-xs font-semibold text-[#4f6fff]">
                  {regionLabel}
                </span>
              </div>

              <p className="mt-3 max-w-[900px] text-sm leading-7 text-slate-500">
                Manage the pages created for {regionLabel}. Track completion,
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
                    placeholder="Search by page name, slug, URL, template, section, status..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#cfd8f6] focus:ring-4 focus:ring-[#eef3ff]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => router.push(withRegion("/pages/new"))}
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

        {!isActiveDataRegion ? (
          <section className="mt-6 rounded-[28px] border border-[#dbe5ff] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_100%)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4f6fff]">
                  Region Workspace
                </p>
                <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
                  {regionLabel} is ready for regional page creation.
                </h2>
                <p className="mt-2 max-w-[840px] text-sm leading-6 text-slate-500">
                  This region currently has no pages. Global templates remain available, so the regional team can create governed pages without affecting the UK workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push(withRegion("/pages/new"))}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5]"
              >
                <Plus className="h-4.5 w-4.5" />
                Create first regional page
              </button>
            </div>
          </section>
        ) : null}

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4.5 w-4.5 text-[#4f6fff]" />
                <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
                  Page discovery
                </h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Jump into the right working set without scrolling through the full library.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters((current) => !current)}
              className={cx(
                "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition",
                showAdvancedFilters
                  ? "border-[#dbe5ff] bg-[#eef3ff] text-[#4f6fff]"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[#4f6fff]">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <ViewButton
              active={activeView === "all"}
              label="All pages"
              count={viewCounts.all}
              onClick={() => setActiveView("all")}
            />
            <ViewButton
              active={activeView === "recent"}
              label="Recently edited"
              count={viewCounts.recent}
              onClick={() => setActiveView("recent")}
            />
            <ViewButton
              active={activeView === "drafts"}
              label="Drafts"
              count={viewCounts.drafts}
              onClick={() => setActiveView("drafts")}
            />
            <ViewButton
              active={activeView === "awaiting_approval"}
              label="Awaiting approval"
              count={viewCounts.awaiting_approval}
              onClick={() => setActiveView("awaiting_approval")}
            />
            <ViewButton
              active={activeView === "ready_to_publish"}
              label="Ready to publish"
              count={viewCounts.ready_to_publish}
              onClick={() => setActiveView("ready_to_publish")}
            />
            <ViewButton
              active={activeView === "published"}
              label="Published"
              count={viewCounts.published}
              onClick={() => setActiveView("published")}
            />
            <ViewButton
              active={activeView === "governance_issues"}
              label="Governance issues"
              count={viewCounts.governance_issues}
              onClick={() => setActiveView("governance_issues")}
            />
          </div>

          {recentlyEditedPages.length > 0 ? (
            <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-[#4f6fff]" />
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Recently edited
                </p>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row">
                {recentlyEditedPages.map((page) => (
                  <QuickPageCard key={page.id} page={page} role={role} region={region} />
                ))}
              </div>
            </div>
          ) : null}

          {showAdvancedFilters ? (
            <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-900">
                    Advanced filters
                  </p>
                </div>

                {activeFilterCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm font-semibold text-[#4f6fff] transition hover:text-[#3f5fe0]"
                  >
                    Clear all
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <SelectControl
                  label="Status"
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value as PageStatus | "all")}
                >
                  <option value="all">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="rejected">Rejected</option>
                  <option value="archived">Archived</option>
                </SelectControl>

                <SelectControl
                  label="Template"
                  value={templateFilter}
                  onChange={setTemplateFilter}
                >
                  <option value="all">All templates</option>
                  {templateOptions.map((templateName) => (
                    <option key={templateName} value={templateName}>
                      {templateName}
                    </option>
                  ))}
                </SelectControl>

                <SelectControl
                  label="Completion"
                  value={completionFilter}
                  onChange={setCompletionFilter}
                >
                  <option value="all">All completion levels</option>
                  <option value="complete">Complete pages</option>
                  <option value="incomplete">Incomplete pages</option>
                  <option value="low">Below 60%</option>
                </SelectControl>

                <SelectControl
                  label="Sort by"
                  value={sortMode}
                  onChange={(value) => setSortMode(value as SortMode)}
                >
                  <option value="updated_desc">Recently updated</option>
                  <option value="updated_asc">Oldest updated</option>
                  <option value="name_asc">Name A-Z</option>
                  <option value="name_desc">Name Z-A</option>
                  <option value="completion_desc">Highest completion</option>
                  <option value="completion_asc">Lowest completion</option>
                </SelectControl>

                <SelectControl
                  label="Group by"
                  value={groupMode}
                  onChange={(value) => setGroupMode(value as GroupMode)}
                >
                  <option value="none">No grouping</option>
                  <option value="status">Status</option>
                  <option value="template">Template</option>
                </SelectControl>
              </div>

              {activeFilterCount > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {query.trim() ? (
                    <ActiveFilterPill label={`Search: ${query}`} onClear={() => setQuery("")} />
                  ) : null}
                  {activeView !== "all" ? (
                    <ActiveFilterPill label={`View: ${activeView.replaceAll("_", " ")}`} onClear={() => setActiveView("all")} />
                  ) : null}
                  {statusFilter !== "all" ? (
                    <ActiveFilterPill label={`Status: ${getStatusLabel(statusFilter)}`} onClear={() => setStatusFilter("all")} />
                  ) : null}
                  {templateFilter !== "all" ? (
                    <ActiveFilterPill label={`Template: ${templateFilter}`} onClear={() => setTemplateFilter("all")} />
                  ) : null}
                  {completionFilter !== "all" ? (
                    <ActiveFilterPill label={`Completion: ${completionFilter}`} onClear={() => setCompletionFilter("all")} />
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-6">
            <SectionHeader
              title="Page library"
              subtitle={`${visiblePages.length} page${visiblePages.length === 1 ? "" : "s"} found in ${regionLabel}.`}
              right={
                <button
                  type="button"
                  onClick={() => router.push(withRegion("/pages/new"))}
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
                  {pages.length === 0
                    ? `No pages created for ${regionLabel} yet`
                    : "No matching pages found"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {pages.length === 0
                    ? "This region is ready to use the global templates, but no region-specific pages have been created yet."
                    : "Try adjusting your search, view, or advanced filters."}
                </p>

                <button
                  type="button"
                  onClick={() => router.push(withRegion("/pages/new"))}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
                >
                  <Plus className="h-4 w-4" />
                  Create first page
                </button>
              </div>
            ) : groupMode !== "none" ? (
              <div className="space-y-5">
                {groupedPages.map(([groupName, groupPages]) => (
                  <div
                    key={groupName}
                    className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {groupName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {groupPages.length} page{groupPages.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {groupPages.map((page) => (
                        <PageCard key={page.id} page={page} role={role} region={region} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {featuredPages.map((page) => (
                    <PageCard key={page.id} page={page} role={role} region={region} />
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
                        <PageRow key={page.id} page={page} role={role} region={region} />
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
                title="Navigation tips"
                subtitle="Use views and filters to avoid scrolling through large page libraries."
              />

              <div className="space-y-3">
                {[
                  {
                    step: "1",
                    title: "Search first",
                    text: "Search by page name, URL, slug, template, status, section name, or allowed block type.",
                  },
                  {
                    step: "2",
                    title: "Use operational views",
                    text: "Jump into drafts, approvals, publish-ready pages, or governance issues instantly.",
                  },
                  {
                    step: "3",
                    title: "Filter and group",
                    text: "Narrow by template, status, completion level, and group pages by workflow state or template.",
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
                Start from a global approved template, inherit the correct structure,
                and create a governed page for {regionLabel}.
              </p>

              <button
                type="button"
                onClick={() => router.push(withRegion("/pages/new"))}
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