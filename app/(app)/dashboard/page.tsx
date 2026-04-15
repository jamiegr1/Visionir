"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Blocks,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  Clock3,
  FileText,
  LayoutGrid,
  LayoutTemplate,
  Palette,
  Plus,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import type { BlockData } from "@/lib/types";
import type { Role } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";
import { evaluateBlockGovernance } from "@/lib/brand-governance";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isRole(value: string | null): value is Role {
  return value === "creator" || value === "approver" || value === "admin";
}

type ApiBlockRecord = {
  id: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  createdByName?: string;
  createdByUserId?: string;
  data?: BlockData | null;
};

type DashboardBlock = {
  id: string;
  name: string;
  component: string;
  status: string;
  governanceScore: number | null;
  updatedAt: string | null;
  createdAt: string | null;
  owner: string;
  data: BlockData | null;
};

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

function getBlockName(data: BlockData | null, id: string) {
  const headline =
    typeof data?.headline === "string" ? data.headline.trim() : "";
  const eyebrow =
    typeof data?.eyebrow === "string" ? data.eyebrow.trim() : "";

  if (headline) return headline;
  if (eyebrow) return eyebrow;
  return `Block ${id.slice(0, 8)}`;
}

function getComponentName(data: BlockData | null): string {
  if (!data) return "Hero Standard";

  const componentType = (data as Record<string, unknown>)["componentType"];

  return typeof componentType === "string" && componentType.trim()
    ? componentType
    : "Hero Standard";
}

function getOwnerName(block: ApiBlockRecord) {
  return (
    block.createdByName ||
    block.createdBy ||
    block.createdByUserId ||
    "Jamie"
  );
}

function getGovernanceScore(data: BlockData | null) {
  if (!data) return null;
  const governance = evaluateBlockGovernance(data);
  return typeof governance?.score === "number" ? governance.score : null;
}

function getBlockStatusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Draft";
    case "generating":
      return "Generating";
    case "in_review":
      return "In Review";
    case "pending_approval":
      return "Pending Review";
    case "approved":
      return "Approved";
    case "published":
      return "Published";
    case "rejected":
      return "Changes Requested";
    case "deploying":
      return "Deploying";
    case "deployed":
      return "Live";
    case "completed":
      return "Completed";
    default:
      return "Draft";
  }
}

function getBlockStatusPillClass(status: string) {
  switch (status) {
    case "approved":
    case "published":
    case "completed":
    case "deployed":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "pending_approval":
    case "in_review":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "rejected":
      return "bg-rose-50 text-rose-700 ring-rose-100";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function getPageStatusLabel(status: PageStatus) {
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

function getPageStatusPillClass(status: PageStatus) {
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

function getTemplateStatusPillClass(status: string) {
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

function MiniTrend() {
  return (
    <svg
      viewBox="0 0 140 40"
      className="h-10 w-[140px]"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 28C12 36 20 36 28 24C36 12 50 28 60 16C68 7 76 4 84 12C92 20 104 32 116 18C126 6 136 12 138 36"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="84" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

function GovernanceMiniBars() {
  return (
    <div className="flex h-[54px] items-end justify-end gap-2">
      {[26, 40, 30, 48, 34].map((height, i) => (
        <div key={i} className="flex items-end gap-1">
          <div
            className="w-[3px] rounded-full bg-[#5b7cff]"
            style={{ height: `${height}px` }}
          />
          <div
            className="w-[3px] rounded-full bg-emerald-400"
            style={{ height: `${Math.max(12, height - 9)}px` }}
          />
        </div>
      ))}
    </div>
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
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
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
  const accent =
    tone === "emerald"
      ? "text-emerald-500"
      : tone === "slate"
        ? "text-slate-500"
        : "text-[#5b7cff]";

  const ring =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
      : tone === "slate"
        ? "bg-slate-100 text-slate-600 ring-slate-200"
        : "bg-[#eef3ff] text-[#4f6fff] ring-[#dbe5ff]";

  return (
    <div className="rounded-[28px] border border-slate-200/90 bg-white px-5 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div
          className={cx(
            "flex h-11 w-11 items-center justify-center rounded-2xl ring-1",
            ring
          )}
        >
          {icon}
        </div>
        <div className={cx("shrink-0 opacity-90", accent)}>
          <MiniTrend />
        </div>
      </div>

      <div className="text-[31px] font-semibold tracking-[-0.05em] text-slate-900">
        {value}
      </div>
      <p className="mt-1.5 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function RecentBlockRow({
  block,
  role,
}: {
  block: DashboardBlock;
  role: Role;
}) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/blocks/${block.id}/details?role=${role}`)}
      className="grid cursor-pointer grid-cols-[56px_minmax(0,1fr)_140px_140px] items-center gap-4 rounded-[22px] border border-transparent px-3 py-3 transition hover:border-slate-200 hover:bg-slate-50/80"
    >
      <div className="flex h-[46px] w-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-[#102746] text-[10px] font-semibold text-white shadow-sm">
        BL
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-900">
          {block.name}
        </div>
        <div className="mt-1 truncate text-xs text-slate-500">
          {block.component} • {relativeUpdatedLabel(block.updatedAt)}
        </div>
      </div>

      <div className="text-sm text-slate-700">{formatDate(block.updatedAt)}</div>

      <div>
        <span
          className={cx(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
            getBlockStatusPillClass(block.status)
          )}
        >
          {getBlockStatusLabel(block.status)}
        </span>
      </div>
    </div>
  );
}

function RecentPageRow({
  page,
  role,
}: {
  page: PageSummary;
  role: Role;
}) {
  const router = useRouter();
  const completed = page.sections.filter((section) => section.completed).length;

  return (
    <div
      onClick={() => router.push(`/pages/${page.id}?role=${role}`)}
      className="grid cursor-pointer grid-cols-[56px_minmax(0,1fr)_140px_140px] items-center gap-4 rounded-[22px] border border-transparent px-3 py-3 transition hover:border-slate-200 hover:bg-slate-50/80"
    >
      <div className="flex h-[46px] w-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-[#143861] text-[10px] font-semibold text-white shadow-sm">
        PG
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-900">
          {page.name}
        </div>
        <div className="mt-1 truncate text-xs text-slate-500">
          {page.templateName} • {completed}/{page.sections.length} complete
        </div>
      </div>

      <div className="text-sm text-slate-700">{formatDate(page.updatedAt)}</div>

      <div>
        <span
          className={cx(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
            getPageStatusPillClass(page.status)
          )}
        >
          {getPageStatusLabel(page.status)}
        </span>
      </div>
    </div>
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
      className="grid cursor-pointer grid-cols-[minmax(0,1fr)_110px_110px] items-center gap-4 rounded-[22px] border border-transparent px-3 py-3 transition hover:border-slate-200 hover:bg-slate-50/80"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-900">
          {template.name}
        </div>
        <div className="mt-1 truncate text-xs text-slate-500">
          {template.category || "custom"} • {template.sectionCount ?? 0} sections
        </div>
      </div>

      <div className="text-sm text-slate-700">v{template.version ?? 1}</div>

      <div>
        <span
          className={cx(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
            getTemplateStatusPillClass(template.status)
          )}
        >
          {template.status === "published"
            ? "Published"
            : template.status === "archived"
              ? "Archived"
              : "Draft"}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return isRole(value) ? value : "admin";
  }, [searchParams]);

  const canAccessApprovals = useMemo(
    () =>
      hasPermission(role, "block.approve") ||
      hasPermission(role, "page.approve"),
    [role]
  );

  const refreshKey = searchParams.get("refresh") ?? "";

  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<DashboardBlock[]>([]);
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        const [blocksRes, pagesRes, templatesRes] = await Promise.all([
          fetch(`/api/blocks?role=${role}&refresh=${refreshKey}`, {
            cache: "no-store",
          }),
          fetch(`/api/pages?role=${role}&refresh=${refreshKey}`, {
            cache: "no-store",
          }),
          fetch(`/api/templates?role=${role}&refresh=${refreshKey}`, {
            cache: "no-store",
          }),
        ]);

        const blocksJson = await blocksRes.json().catch(() => ({}));
        const pagesJson = await pagesRes.json().catch(() => ({}));
        const templatesJson = await templatesRes.json().catch(() => ({}));

        if (!blocksRes.ok) {
          throw new Error(blocksJson?.error || "Failed to load blocks.");
        }

        const rawBlocks = Array.isArray(blocksJson?.blocks)
          ? (blocksJson.blocks as ApiBlockRecord[])
          : [];

        const mappedBlocks: DashboardBlock[] = rawBlocks.map((block) => ({
          id: block.id,
          name: getBlockName(block.data ?? null, block.id),
          component: getComponentName(block.data ?? null),
          status: block.status || "draft",
          governanceScore: getGovernanceScore(block.data ?? null),
          updatedAt: block.updatedAt || null,
          createdAt: block.createdAt || null,
          owner: getOwnerName(block),
          data: block.data ?? null,
        }));

        mappedBlocks.sort((a, b) => {
          const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return bTime - aTime;
        });

        const rawPages = Array.isArray(pagesJson?.pages)
          ? (pagesJson.pages as PageSummary[])
          : [];

        rawPages.sort((a, b) => {
          const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return bTime - aTime;
        });

        const rawTemplates = Array.isArray(templatesJson?.templates)
          ? (templatesJson.templates as TemplateSummary[])
          : [];

        rawTemplates.sort((a, b) => {
          const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return bTime - aTime;
        });

        setBlocks(mappedBlocks);
        setPages(rawPages);
        setTemplates(rawTemplates);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setBlocks([]);
        setPages([]);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboardData();
  }, [role, refreshKey]);

  const visibleBlocks = useMemo(() => {
    return blocks.filter((block) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();

      return (
        block.name.toLowerCase().includes(q) ||
        block.owner.toLowerCase().includes(q) ||
        block.component.toLowerCase().includes(q) ||
        getBlockStatusLabel(block.status).toLowerCase().includes(q)
      );
    });
  }, [blocks, query]);

  const visiblePages = useMemo(() => {
    return pages.filter((page) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();

      return (
        page.name.toLowerCase().includes(q) ||
        (page.slug || "").toLowerCase().includes(q) ||
        page.templateName.toLowerCase().includes(q) ||
        getPageStatusLabel(page.status).toLowerCase().includes(q)
      );
    });
  }, [pages, query]);

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

  const recentBlocks = useMemo(() => visibleBlocks.slice(0, 6), [visibleBlocks]);
  const recentPages = useMemo(() => visiblePages.slice(0, 6), [visiblePages]);
  const recentTemplates = useMemo(
    () => visibleTemplates.slice(0, 6),
    [visibleTemplates]
  );

  const pendingApprovals = useMemo(() => {
    const pagePending = visiblePages.filter((page) =>
      ["pending_approval"].includes(page.status)
    ).length;

    const blockPending = visibleBlocks.filter((block) =>
      ["pending_approval", "in_review"].includes(block.status)
    ).length;

    return {
      total: pagePending + blockPending,
      pagePending,
      blockPending,
    };
  }, [visibleBlocks, visiblePages]);

  const totals = useMemo(() => {
    const liveBlocks = blocks.filter((b) =>
      ["published", "deployed", "completed"].includes(b.status)
    ).length;

    const blockScores = blocks
      .map((b) => b.governanceScore)
      .filter((value): value is number => typeof value === "number");

    const averageScore =
      blockScores.length > 0
        ? Math.round(
            blockScores.reduce((sum, score) => sum + score, 0) / blockScores.length
          )
        : 98;

    return {
      templates: templates.length,
      pages: pages.length,
      blocks: blocks.length,
      pending: pendingApprovals.total,
      averageScore,
      livePages: pages.filter((page) => page.status === "published").length,
      inProgressPages: pages.filter((page) =>
        ["draft", "in_progress", "pending_approval", "approved", "rejected"].includes(
          page.status
        )
      ).length,
      publishedTemplates: templates.filter((t) => t.status === "published").length,
      draftTemplates: templates.filter((t) => t.status === "draft").length,
      liveBlocks,
      blockedBlocks: blocks.filter((b) => b.status === "rejected").length,
    };
  }, [blocks, pages, templates, pendingApprovals]);

  return (
    <div className="h-[calc(100dvh-72px)] overflow-hidden bg-[#f4f7fb] text-slate-900">
      <div className="flex h-full min-h-0">
        <aside className="hidden h-full w-[325px] shrink-0 border-r border-slate-200/90 bg-white xl:flex xl:flex-col">
          <div className="border-b border-slate-200/90 px-7 pb-5 pt-6">
            <div className="rounded-[24px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)] px-5 py-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-slate-500">Welcome back</p>
                  <h1 className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.05em] text-slate-900">
                    Mediascout
                  </h1>
                </div>

                <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                  <Image
                    src="/mediascout-logo.png"
                    alt="Mediascout"
                    width={52}
                    height={52}
                    className="h-[46px] w-[46px] rounded-lg object-cover"
                    priority
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                  Enterprise Ready
                </span>
                <span className="inline-flex items-center rounded-full bg-[#eef3ff] px-2.5 py-1 text-[11px] font-semibold text-[#4f6fff] ring-1 ring-[#dbe5ff]">
                  Role: {role}
                </span>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-7 py-5">
            <div className="rounded-[24px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)] p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-[#4f6fff] ring-1 ring-slate-200">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Quick Actions</p>
                  <p className="text-xs text-slate-500">
                    Start the next governed workflow.
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3">
                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/templates/new?role=${role}`)}
                      className="flex items-center gap-3 rounded-[16px] border border-slate-200 bg-white px-3 py-2.5 text-left shadow-[0_6px_18px_rgba(15,23,42,0.03)] transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#4f6fff] ring-1 ring-[#dbe5ff]">
                        <LayoutTemplate className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        Create Template
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push(`/pages/new?role=${role}`)}
                      className="flex items-center gap-3 rounded-[16px] border border-slate-200 bg-white px-3 py-2.5 text-left shadow-[0_6px_18px_rgba(15,23,42,0.03)] transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#4f6fff] ring-1 ring-[#dbe5ff]">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        Create Page
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push(`/blocks/new?role=${role}`)}
                      className="flex items-center gap-3 rounded-[16px] border border-slate-200 bg-white px-3 py-2.5 text-left shadow-[0_6px_18px_rgba(15,23,42,0.03)] transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#4f6fff] ring-1 ring-[#dbe5ff]">
                        <Blocks className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        Generate Block
                      </span>
                    </button>

                    {canAccessApprovals ? (
                      <button
                        type="button"
                        onClick={() => router.push(`/approvals?role=${role}`)}
                        className="flex items-center gap-3 rounded-[16px] border border-slate-200 bg-white px-3 py-2.5 text-left shadow-[0_6px_18px_rgba(15,23,42,0.03)] transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#4f6fff] ring-1 ring-[#dbe5ff]">
                          <ClipboardCheck className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          Open Approvals
                        </span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <div className="rounded-[28px] border border-slate-200 bg-[#f8fafe] px-5 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.03)]">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900">
                      Governance Snapshot
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">Platform health</p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_96px] items-end gap-4">
                  <div className="space-y-2 text-[13px] text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>Brand Compliance</span>
                      <span className="font-semibold text-slate-900">
                        {totals.averageScore}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Published Templates</span>
                      <span className="font-semibold text-slate-900">
                        {totals.publishedTemplates}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pending Approvals</span>
                      <span className="font-semibold text-slate-900">
                        {totals.pending}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Rejected Blocks</span>
                      <span className="font-semibold text-slate-900">
                        {totals.blockedBlocks}
                      </span>
                    </div>
                  </div>

                  <GovernanceMiniBars />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1680px] px-6 py-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-[360px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search pages, templates or blocks"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#cfd8f6] focus:ring-4 focus:ring-[#eef3ff]"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/templates/new?role=${role}`)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Template
                  <Plus className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/pages/new?role=${role}`)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Page
                  <Plus className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/blocks/new?role=${role}`)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5]"
                >
                  Generate Block
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Templates"
                value={totals.templates}
                tone="blue"
                icon={<LayoutTemplate className="h-5 w-5" />}
              />
              <MetricCard
                label="Pages"
                value={totals.pages}
                tone="emerald"
                icon={<FileText className="h-5 w-5" />}
              />
              <MetricCard
                label="Blocks"
                value={totals.blocks}
                tone="slate"
                icon={<LayoutGrid className="h-5 w-5" />}
              />
              <MetricCard
                label="Pending Approvals"
                value={totals.pending}
                tone="blue"
                icon={<CircleDashed className="h-5 w-5" />}
              />
              <MetricCard
                label="Compliance Score"
                value={`${totals.averageScore}%`}
                tone="blue"
                icon={<Shield className="h-5 w-5" />}
              />
            </div>

            <div className="grid gap-6 2xl:grid-cols-[1.25fr_1fr]">
              <section className="rounded-[30px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
                <SectionHeader
                  title="Recent Page Activity"
                  subtitle="Latest governed pages moving through the platform."
                  right={
                    <button
                      type="button"
                      onClick={() => router.push(`/pages?role=${role}`)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      View Pages
                    </button>
                  }
                />

                <div className="mb-3 grid grid-cols-[56px_minmax(0,1fr)_140px_140px] gap-4 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <div />
                  <div>Page</div>
                  <div>Date</div>
                  <div>Status</div>
                </div>

                <div className="space-y-1">
                  {loading ? (
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                      Loading page activity…
                    </div>
                  ) : recentPages.length === 0 ? (
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                      No pages yet.
                    </div>
                  ) : (
                    recentPages.map((page) => (
                      <RecentPageRow key={page.id} page={page} role={role} />
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-[30px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
                <SectionHeader
                  title="Approval Queue"
                  subtitle="Everything currently waiting for governance review."
                  right={
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                      <Clock3 className="h-3.5 w-3.5" />
                      {pendingApprovals.total} awaiting review
                    </div>
                  }
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-500 ring-1 ring-slate-200">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="text-[24px] font-semibold tracking-[-0.04em] text-slate-900">
                      {pendingApprovals.pagePending}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Pages Pending</p>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-500 ring-1 ring-slate-200">
                      <Blocks className="h-4 w-4" />
                    </div>
                    <div className="text-[24px] font-semibold tracking-[-0.04em] text-slate-900">
                      {pendingApprovals.blockPending}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Blocks Pending</p>
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-[#dbe5ff] bg-[linear-gradient(135deg,#f8faff_0%,#eef3ff_100%)] p-5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#4f6fff] shadow-sm ring-1 ring-[#dbe5ff]">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>

                  <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
                    Keep the workflow moving
                  </h3>
                  <p className="mt-2 max-w-[420px] text-sm leading-6 text-slate-600">
                    Review pending work across pages and blocks so teams can keep
                    building within governance.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        canAccessApprovals
                          ? `/approvals?role=${role}`
                          : `/pages?role=${role}`
                      )
                    }
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
                  >
                    {canAccessApprovals ? "Open Approvals" : "Open Workspace"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </section>
            </div>

            <div className="mt-6 grid gap-6 2xl:grid-cols-[1.2fr_1fr]">
              <section className="rounded-[30px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
                <SectionHeader
                  title="Recent Block Activity"
                  subtitle="Latest governed blocks across the workspace."
                  right={
                    <button
                      type="button"
                      onClick={() => router.push(`/blocks?role=${role}`)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      View Blocks
                    </button>
                  }
                />

                <div className="mb-3 grid grid-cols-[56px_minmax(0,1fr)_140px_140px] gap-4 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <div />
                  <div>Blocks</div>
                  <div>Date</div>
                  <div>Status</div>
                </div>

                <div className="space-y-1">
                  {loading ? (
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                      Loading recent activity…
                    </div>
                  ) : recentBlocks.length === 0 ? (
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                      No recent blocks yet.
                    </div>
                  ) : (
                    recentBlocks.map((block) => (
                      <RecentBlockRow key={block.id} block={block} role={role} />
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-[30px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
                <SectionHeader
                  title="Template Snapshot"
                  subtitle="Current governed template blueprints."
                  right={
                    <button
                      type="button"
                      onClick={() => router.push(`/templates?role=${role}`)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      View Templates
                    </button>
                  }
                />

                <div className="mb-3 grid grid-cols-[minmax(0,1fr)_110px_110px] gap-4 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <div>Template</div>
                  <div>Version</div>
                  <div>Status</div>
                </div>

                <div className="space-y-1">
                  {loading ? (
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                      Loading templates…
                    </div>
                  ) : recentTemplates.length === 0 ? (
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                      No templates yet.
                    </div>
                  ) : (
                    recentTemplates.map((template) => (
                      <TemplateRow key={template.id} template={template} role={role} />
                    ))
                  )}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#4f6fff] ring-1 ring-slate-200">
                      <LayoutTemplate className="h-4 w-4" />
                    </div>
                    <div className="text-[24px] font-semibold tracking-[-0.04em] text-slate-900">
                      {totals.publishedTemplates}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Published Templates</p>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-500 ring-1 ring-slate-200">
                      <CircleDashed className="h-4 w-4" />
                    </div>
                    <div className="text-[24px] font-semibold tracking-[-0.04em] text-slate-900">
                      {totals.draftTemplates}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Draft Templates</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-[30px] border border-slate-200/90 bg-white px-5 py-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
                <SectionHeader
                  title="Platform Summary"
                  subtitle="A governed operating view across templates, pages and blocks."
                />

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-500 ring-1 ring-slate-200">
                      <Palette className="h-4 w-4" />
                    </div>
                    <div className="text-[24px] font-semibold tracking-[-0.04em] text-slate-900">
                      {totals.averageScore}%
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Compliance</p>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-500 ring-1 ring-slate-200">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="text-[24px] font-semibold tracking-[-0.04em] text-slate-900">
                      {totals.inProgressPages}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Active Pages</p>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-500 ring-1 ring-slate-200">
                      <BadgeCheck className="h-4 w-4" />
                    </div>
                    <div className="text-[24px] font-semibold tracking-[-0.04em] text-slate-900">
                      {totals.livePages}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Published Pages</p>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#5b7cff] ring-1 ring-slate-200">
                      <Blocks className="h-4 w-4" />
                    </div>
                    <div className="text-[24px] font-semibold tracking-[-0.04em] text-slate-900">
                      {totals.liveBlocks}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Live Blocks</p>
                  </div>
                </div>
              </section>

              <section className="rounded-[30px] border border-slate-200/90 bg-white px-5 py-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
                <SectionHeader
                  title="Next Action"
                  subtitle="Continue the governed workflow."
                />

                <div className="rounded-[24px] border border-[#dbe5ff] bg-[linear-gradient(135deg,#f8faff_0%,#eef3ff_100%)] p-5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#4f6fff] shadow-sm ring-1 ring-[#dbe5ff]">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
                    Build with governance from the start
                  </h3>
                  <p className="mt-2 max-w-[420px] text-sm leading-6 text-slate-600">
                    Create templates, launch pages from approved structures, and
                    generate governed blocks inside a platform built for controlled
                    web evolution.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/templates/new?role=${role}`)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-700 ring-1 ring-[#dbe5ff] transition hover:bg-slate-50"
                    >
                      Create Template
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push(`/pages/new?role=${role}`)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-700 ring-1 ring-[#dbe5ff] transition hover:bg-slate-50"
                    >
                      Create Page
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push(`/blocks/new?role=${role}`)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
                    >
                      Generate Block
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}