"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CircleDashed,
  Clock3,
  Filter,
  LayoutGrid,
  Plus,
  Search,
  Shield,
  XCircle,
} from "lucide-react";
import type { BlockData } from "@/lib/types";
import type { Role } from "@/lib/permissions";
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

type LibraryBlock = {
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

type FilterStatus =
  | "all"
  | "draft"
  | "pending_approval"
  | "approved"
  | "published"
  | "rejected";

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function relativeUpdatedLabel(value: string | null) {
  if (!value) return "Updated recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Updated recently";

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.max(1, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(value);
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

function getStatusLabel(status: string) {
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

function getStatusPillClass(status: string) {
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

function getActionHref(block: LibraryBlock, role: Role) {
    return `/blocks/${block.id}/details?role=${role}`;
  }

function MetricCard({
  label,
  value,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: "blue" | "emerald" | "amber" | "slate";
}) {
  const ring =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
      : tone === "amber"
        ? "bg-amber-50 text-amber-600 ring-amber-100"
        : tone === "slate"
          ? "bg-slate-100 text-slate-600 ring-slate-200"
          : "bg-[#eef3ff] text-[#4f6fff] ring-[#dbe5ff]";

  return (
    <div className="rounded-[28px] border border-slate-200/90 bg-white px-5 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div
        className={cx(
          "mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ring-1",
          ring
        )}
      >
        {icon}
      </div>

      <div className="text-[30px] font-semibold tracking-[-0.05em] text-slate-900">
        {value}
      </div>
      <p className="mt-1.5 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-2xl px-4 py-2.5 text-sm font-medium transition",
        active
          ? "bg-[#5b7cff] text-white shadow-[0_12px_24px_rgba(91,124,255,0.20)]"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      )}
    >
      {label}
    </button>
  );
}

function SectionHeader({
  title,
  subtitle,
  count,
  icon,
}: {
  title: string;
  subtitle: string;
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="shrink-0 inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {count} items
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}

function BlockRow({
  block,
  role,
}: {
  block: LibraryBlock;
  role: Role;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(getActionHref(block, role))}
      className="grid w-full grid-cols-[minmax(0,1.7fr)_180px_150px_140px_140px] gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-900">
          {block.name}
        </div>
        <div className="mt-1 truncate text-xs text-slate-500">
          {block.component} • Created {formatDate(block.createdAt)}
        </div>
      </div>

      <div className="flex items-center text-sm text-slate-700">
        {block.owner}
      </div>

      <div className="flex flex-col justify-center">
        <span className="text-sm text-slate-700">{formatDate(block.updatedAt)}</span>
        <span className="mt-1 text-xs text-slate-400">
          {relativeUpdatedLabel(block.updatedAt)}
        </span>
      </div>

      <div className="flex items-center">
        <span
          className={cx(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
            getStatusPillClass(block.status)
          )}
        >
          {getStatusLabel(block.status)}
        </span>
      </div>

      <div className="flex items-center">
        <span className="inline-flex items-center rounded-full bg-[#eef3ff] px-2.5 py-1 text-xs font-semibold text-[#4f6fff] ring-1 ring-[#dbe5ff]">
          {typeof block.governanceScore === "number"
            ? `${block.governanceScore}%`
            : "—"}
        </span>
      </div>
    </button>
  );
}

function CompactBlockCard({
  block,
  role,
}: {
  block: LibraryBlock;
  role: Role;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(getActionHref(block, role))}
      className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">
            {block.name}
          </div>
          <div className="mt-1 truncate text-xs text-slate-500">
            {block.component}
          </div>
        </div>

        <span
          className={cx(
            "shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
            getStatusPillClass(block.status)
          )}
        >
          {getStatusLabel(block.status)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Owner
          </p>
          <p className="mt-1 truncate text-sm text-slate-700">{block.owner}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Updated
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {relativeUpdatedLabel(block.updatedAt)}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Created
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {formatDate(block.createdAt)}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Governance
          </p>
          <p className="mt-1 text-sm font-medium text-[#4f6fff]">
            {typeof block.governanceScore === "number"
              ? `${block.governanceScore}%`
              : "—"}
          </p>
        </div>
      </div>
    </button>
  );
}

function SectionPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const maxVisible = 3;

  let startPage = Math.max(1, page - 1);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const visiblePages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <div className="text-sm text-slate-400">
        Page <span className="font-semibold text-slate-700">{page}</span> of{" "}
        <span className="font-semibold text-slate-700">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex items-center gap-2">
          {startPage > 1 ? (
            <>
              <button
                type="button"
                onClick={() => onPageChange(1)}
                className="h-10 min-w-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                1
              </button>
              {startPage > 2 ? (
                <span className="px-1 text-sm text-slate-400">…</span>
              ) : null}
            </>
          ) : null}

          {visiblePages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={cx(
                "h-10 min-w-10 rounded-2xl px-3 text-sm font-medium transition",
                pageNumber === page
                  ? "bg-[#5b7cff] text-white shadow-[0_10px_20px_rgba(91,124,255,0.20)]"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {pageNumber}
            </button>
          ))}

          {endPage < totalPages ? (
            <>
              {endPage < totalPages - 1 ? (
                <span className="px-1 text-sm text-slate-400">…</span>
              ) : null}
              <button
                type="button"
                onClick={() => onPageChange(totalPages)}
                className="h-10 min-w-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {totalPages}
              </button>
            </>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="hidden sm:inline">Next</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function paginateBlocks<T>(items: T[], page: number, perPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * perPage;
  const end = start + perPage;

  return {
    items: items.slice(start, end),
    page: safePage,
    totalPages,
  };
}

function BlockTableSection({
  blocks,
  role,
  loading,
  emptyText,
  page,
  onPageChange,
  perPage,
}: {
  blocks: LibraryBlock[];
  role: Role;
  loading: boolean;
  emptyText: string;
  page: number;
  onPageChange: (page: number) => void;
  perPage: number;
}) {
  const paginated = useMemo(
    () => paginateBlocks(blocks, page, perPage),
    [blocks, page, perPage]
  );

  return (
    <>
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
        <div className="grid grid-cols-[minmax(0,1.7fr)_180px_150px_140px_140px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          <div>Block</div>
          <div>Owner</div>
          <div>Updated</div>
          <div>Status</div>
          <div>Governance</div>
        </div>

        <div className="divide-y divide-slate-200">
          {loading ? (
            <div className="px-5 py-16 text-center text-sm text-slate-400">
              Loading blocks…
            </div>
          ) : paginated.items.length === 0 ? (
            <div className="p-4">
              <EmptyState text={emptyText} />
            </div>
          ) : (
            paginated.items.map((block) => (
              <BlockRow key={block.id} block={block} role={role} />
            ))
          )}
        </div>
      </div>

      {!loading && blocks.length > 0 ? (
        <SectionPagination
          page={paginated.page}
          totalPages={paginated.totalPages}
          onPageChange={onPageChange}
        />
      ) : null}
    </>
  );
}

function CompactBlockSection({
  blocks,
  role,
  loading,
  emptyText,
  page,
  onPageChange,
  perPage,
}: {
  blocks: LibraryBlock[];
  role: Role;
  loading: boolean;
  emptyText: string;
  page: number;
  onPageChange: (page: number) => void;
  perPage: number;
}) {
  const paginated = useMemo(
    () => paginateBlocks(blocks, page, perPage),
    [blocks, page, perPage]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        {loading ? (
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
            Loading blocks…
          </div>
        ) : paginated.items.length === 0 ? (
          <EmptyState text={emptyText} />
        ) : (
          <div className="space-y-3">
            {paginated.items.map((block) => (
              <CompactBlockCard key={block.id} block={block} role={role} />
            ))}
          </div>
        )}
      </div>

      {!loading && blocks.length > 0 ? (
        <SectionPagination
          page={paginated.page}
          totalPages={paginated.totalPages}
          onPageChange={onPageChange}
        />
      ) : null}
    </div>
  );
}

export default function BlocksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return isRole(value) ? value : "admin";
  }, [searchParams]);

  const refreshKey = searchParams.get("refresh") ?? "";

  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<LibraryBlock[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const [publishedPage, setPublishedPage] = useState(1);
  const [approvalPage, setApprovalPage] = useState(1);
  const [draftPage, setDraftPage] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);

  const PUBLISHED_PER_PAGE = 6;
  const COMPACT_PER_PAGE = 4;
  const REJECTED_PER_PAGE = 4;

  useEffect(() => {
    async function loadBlocks() {
      try {
        setLoading(true);

        const res = await fetch(`/api/blocks?role=${role}&refresh=${refreshKey}`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json?.error || `Failed to load blocks (${res.status})`);
        }

        const rawBlocks = Array.isArray(json?.blocks)
          ? (json.blocks as ApiBlockRecord[])
          : [];

        const mapped: LibraryBlock[] = rawBlocks.map((block) => ({
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

        mapped.sort((a, b) => {
          const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return bTime - aTime;
        });

        setBlocks(mapped);
      } catch (error) {
        console.error("Failed to load blocks:", error);
        setBlocks([]);
      } finally {
        setLoading(false);
      }
    }

    void loadBlocks();
  }, [role, refreshKey]);

  const searchedBlocks = useMemo(() => {
    return blocks.filter((block) => {
      if (!query.trim()) return true;

      const q = query.toLowerCase();

      return (
        block.name.toLowerCase().includes(q) ||
        block.owner.toLowerCase().includes(q) ||
        block.component.toLowerCase().includes(q) ||
        getStatusLabel(block.status).toLowerCase().includes(q)
      );
    });
  }, [blocks, query]);

  const filteredBlocks = useMemo(() => {
    if (statusFilter === "all") return searchedBlocks;

    return searchedBlocks.filter((block) => {
      if (statusFilter === "published") {
        return ["published", "deployed", "completed"].includes(block.status);
      }

      if (statusFilter === "pending_approval") {
        return ["pending_approval", "in_review"].includes(block.status);
      }

      if (statusFilter === "draft") {
        return ["draft", "generating"].includes(block.status);
      }

      return block.status === statusFilter;
    });
  }, [searchedBlocks, statusFilter]);

  const publishedBlocks = useMemo(
    () =>
      filteredBlocks.filter((block) =>
        ["published", "deployed", "completed"].includes(block.status)
      ),
    [filteredBlocks]
  );

  const approvalBlocks = useMemo(
    () =>
      filteredBlocks.filter((block) =>
        ["pending_approval", "in_review"].includes(block.status)
      ),
    [filteredBlocks]
  );

  const draftBlocks = useMemo(
    () =>
      filteredBlocks.filter((block) =>
        ["draft", "generating", "approved"].includes(block.status)
      ),
    [filteredBlocks]
  );

  const rejectedBlocks = useMemo(
    () => filteredBlocks.filter((block) => block.status === "rejected"),
    [filteredBlocks]
  );

  useEffect(() => {
    setPublishedPage(1);
    setApprovalPage(1);
    setDraftPage(1);
    setRejectedPage(1);
  }, [query, statusFilter, refreshKey]);

  const totals = useMemo(() => {
    const live = blocks.filter((b) =>
      ["published", "deployed", "completed"].includes(b.status)
    ).length;

    const pending = blocks.filter((b) =>
      ["pending_approval", "in_review"].includes(b.status)
    ).length;

    const drafts = blocks.filter((b) =>
      ["draft", "generating", "approved"].includes(b.status)
    ).length;

    const scores = blocks
      .map((b) => b.governanceScore)
      .filter((value): value is number => typeof value === "number");

    const averageScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length
          )
        : 98;

    return {
      total: blocks.length,
      live,
      pending,
      drafts,
      rejected: blocks.filter((b) => b.status === "rejected").length,
      averageScore,
    };
  }, [blocks]);

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto max-w-[1650px] px-6 py-6 lg:px-8">
        <div className="mb-6 rounded-[32px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)] px-6 py-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#4f6fff]">
                Visionir Library
              </p>
              <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.05em] text-slate-900">
                Governed Block Library
              </h1>
              <p className="mt-2 max-w-[760px] text-sm leading-6 text-slate-500">
                Manage all reusable blocks across the Visionir workflow — from
                draft creation through approval and into published,
                deployment-ready assets.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                <BadgeCheck className="h-4 w-4 text-emerald-500" />
                Role: <span className="font-semibold text-slate-900">{role}</span>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/dashboard?role=${role}`)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Back to Dashboard
              </button>

              <button
                type="button"
                onClick={() => router.push(`/blocks/new?role=${role}`)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5]"
              >
                Create Block
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Total Blocks"
            value={totals.total}
            tone="blue"
            icon={<LayoutGrid className="h-5 w-5" />}
          />
          <MetricCard
            label="Published"
            value={totals.live}
            tone="emerald"
            icon={<BadgeCheck className="h-5 w-5" />}
          />
          <MetricCard
            label="Awaiting Review"
            value={totals.pending}
            tone="amber"
            icon={<Clock3 className="h-5 w-5" />}
          />
          <MetricCard
            label="Drafts & In Progress"
            value={totals.drafts}
            tone="slate"
            icon={<CircleDashed className="h-5 w-5" />}
          />
          <MetricCard
            label="Compliance Score"
            value={`${totals.averageScore}%`}
            tone="blue"
            icon={<Shield className="h-5 w-5" />}
          />
        </div>

        <section className="mb-6 rounded-[30px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative max-w-[420px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search blocks, owners, components or statuses"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#cfd8f6] focus:ring-4 focus:ring-[#eef3ff]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-1 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <Filter className="h-3.5 w-3.5" />
                Filters
              </div>

              <FilterButton
                active={statusFilter === "all"}
                label="All"
                onClick={() => setStatusFilter("all")}
              />
              <FilterButton
                active={statusFilter === "published"}
                label="Published"
                onClick={() => setStatusFilter("published")}
              />
              <FilterButton
                active={statusFilter === "pending_approval"}
                label="Pending"
                onClick={() => setStatusFilter("pending_approval")}
              />
              <FilterButton
                active={statusFilter === "approved"}
                label="Approved"
                onClick={() => setStatusFilter("approved")}
              />
              <FilterButton
                active={statusFilter === "draft"}
                label="Drafts"
                onClick={() => setStatusFilter("draft")}
              />
              <FilterButton
                active={statusFilter === "rejected"}
                label="Rejected"
                onClick={() => setStatusFilter("rejected")}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {filteredBlocks.length}
              </span>{" "}
              matching blocks
            </span>

            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Reset View
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="mb-6 rounded-[30px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
          <SectionHeader
            title="Published Blocks"
            subtitle="Reusable, governed assets ready for deployment and reuse across pages."
            count={publishedBlocks.length}
            icon={<BadgeCheck className="h-5 w-5 text-emerald-500" />}
          />

          <BlockTableSection
            blocks={publishedBlocks}
            role={role}
            loading={loading}
            emptyText="No published blocks match your current filters."
            page={publishedPage}
            onPageChange={setPublishedPage}
            perPage={PUBLISHED_PER_PAGE}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
          <section className="flex h-full flex-col self-start rounded-[30px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
            <SectionHeader
              title="Awaiting Approval"
              subtitle="Blocks currently moving through governance review and sign-off."
              count={approvalBlocks.length}
              icon={<Clock3 className="h-5 w-5 text-amber-500" />}
            />

            <CompactBlockSection
              blocks={approvalBlocks}
              role={role}
              loading={loading}
              emptyText="No blocks are currently awaiting approval."
              page={approvalPage}
              onPageChange={setApprovalPage}
              perPage={COMPACT_PER_PAGE}
            />
          </section>

          <section className="flex h-full flex-col self-start rounded-[30px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
            <SectionHeader
              title="Drafts & In Progress"
              subtitle="Blocks still being developed, refined or prepared for deployment."
              count={draftBlocks.length}
              icon={<CircleDashed className="h-5 w-5 text-slate-500" />}
            />

            <CompactBlockSection
              blocks={draftBlocks}
              role={role}
              loading={loading}
              emptyText="No draft or in-progress blocks match your current filters."
              page={draftPage}
              onPageChange={setDraftPage}
              perPage={COMPACT_PER_PAGE}
            />
          </section>
        </div>

        <section className="mt-6 rounded-[30px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
          <SectionHeader
            title="Rejected / Changes Requested"
            subtitle="Blocks that need updates before they can continue through the workflow."
            count={rejectedBlocks.length}
            icon={<XCircle className="h-5 w-5 text-rose-500" />}
          />

          <CompactBlockSection
            blocks={rejectedBlocks}
            role={role}
            loading={loading}
            emptyText="No rejected blocks match your current filters."
            page={rejectedPage}
            onPageChange={setRejectedPage}
            perPage={REJECTED_PER_PAGE}
          />
        </section>
      </div>
    </div>
  );
}