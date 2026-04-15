"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  Clock3,
  Filter,
  Search,
  Shield,
  XCircle,
} from "lucide-react";
import type { Role } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";
import type { BlockData } from "@/lib/types";
import { evaluateBlockGovernance } from "@/lib/brand-governance";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isRole(value: string | null): value is Role {
  return value === "creator" || value === "approver" || value === "admin";
}

type PageStatus =
  | "draft"
  | "in_progress"
  | "pending_approval"
  | "approved"
  | "changes_requested"
  | "published"
  | "archived";

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

type ApprovalType = "block" | "page";

type ApprovalStatus =
  | "pending_approval"
  | "in_review"
  | "approved"
  | "changes_requested";

type ApprovalItem = {
  id: string;
  type: ApprovalType;
  name: string;
  owner: string;
  status: ApprovalStatus;
  governanceScore: number | null;
  updatedAt: string | null;
  createdAt: string | null;
  metadata: string;
  href: string;
};

type QueueFilter =
  | "all"
  | "block"
  | "page"
  | "pending"
  | "approved"
  | "changes_requested";

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

function getGovernanceScore(data: BlockData | null) {
  if (!data) return null;
  const governance = evaluateBlockGovernance(data);
  return typeof governance?.score === "number" ? governance.score : null;
}

function getOwnerName(block: ApiBlockRecord) {
  return (
    block.createdByName ||
    block.createdBy ||
    block.createdByUserId ||
    "Jamie"
  );
}

function getStatusLabel(status: ApprovalStatus) {
  switch (status) {
    case "pending_approval":
      return "Pending Approval";
    case "in_review":
      return "In Review";
    case "approved":
      return "Approved";
    case "changes_requested":
      return "Changes Requested";
    default:
      return "Pending Approval";
  }
}

function getStatusPillClass(status: ApprovalStatus) {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "changes_requested":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "in_review":
    case "pending_approval":
    default:
      return "bg-violet-50 text-violet-700 ring-violet-100";
  }
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
  tone?: "blue" | "emerald" | "amber" | "rose";
}) {
  const ring =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
      : tone === "amber"
        ? "bg-amber-50 text-amber-600 ring-amber-100"
        : tone === "rose"
          ? "bg-rose-50 text-rose-600 ring-rose-100"
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

function QueueRow({
  item,
}: {
  item: ApprovalItem;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(item.href)}
      className="grid w-full grid-cols-[120px_minmax(0,1.7fr)_180px_160px_120px_140px] gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
    >
      <div className="flex items-center">
        <span
          className={cx(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
            item.type === "page"
              ? "bg-violet-50 text-violet-700 ring-violet-100"
              : "bg-[#eef3ff] text-[#4f6fff] ring-[#dbe5ff]"
          )}
        >
          {item.type === "page" ? "Page" : "Block"}
        </span>
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-900">
          {item.name}
        </div>
        <div className="mt-1 truncate text-xs text-slate-500">{item.metadata}</div>
      </div>

      <div className="flex items-center text-sm text-slate-700">
        {item.owner}
      </div>

      <div className="flex items-center">
        <span
          className={cx(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
            getStatusPillClass(item.status)
          )}
        >
          {getStatusLabel(item.status)}
        </span>
      </div>

      <div className="flex items-center">
        <span className="inline-flex items-center rounded-full bg-[#eef3ff] px-2.5 py-1 text-xs font-semibold text-[#4f6fff] ring-1 ring-[#dbe5ff]">
          {typeof item.governanceScore === "number"
            ? `${item.governanceScore}%`
            : "—"}
        </span>
      </div>

      <div className="flex flex-col justify-center">
        <span className="text-sm text-slate-700">{formatDate(item.updatedAt)}</span>
        <span className="mt-1 text-xs text-slate-400">
          {relativeUpdatedLabel(item.updatedAt)}
        </span>
      </div>
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}

export default function ApprovalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return isRole(value) ? value : "admin";
  }, [searchParams]);

  const refreshKey = searchParams.get("refresh") ?? "";

  const canAccessApprovals =
    hasPermission(role, "block.approve") || hasPermission(role, "page.approve");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QueueFilter>("pending");

  useEffect(() => {
    async function loadQueue() {
      try {
        setLoading(true);

        const [blocksRes, pagesRes] = await Promise.all([
          fetch(`/api/blocks?role=${role}&refresh=${refreshKey}`, {
            cache: "no-store",
          }),
          fetch(`/api/pages?role=${role}&refresh=${refreshKey}`, {
            cache: "no-store",
          }),
        ]);

        const blocksJson = await blocksRes.json().catch(() => ({}));
        const pagesJson = await pagesRes.json().catch(() => ({}));

        const rawBlocks = Array.isArray(blocksJson?.blocks)
          ? (blocksJson.blocks as ApiBlockRecord[])
          : [];

        const rawPages = Array.isArray(pagesJson?.pages)
          ? (pagesJson.pages as PageSummary[])
          : [];

        const blockItems: ApprovalItem[] = rawBlocks
          .filter((block) =>
            ["pending_approval", "in_review", "approved", "changes_requested"].includes(
              String(block.status || "")
            )
          )
          .map((block) => ({
            id: block.id,
            type: "block",
            name: getBlockName(block.data ?? null, block.id),
            owner: getOwnerName(block),
            status: (
              ["pending_approval", "in_review", "approved", "changes_requested"].includes(
                String(block.status || "")
              )
                ? String(block.status)
                : "pending_approval"
            ) as ApprovalStatus,
            governanceScore: getGovernanceScore(block.data ?? null),
            updatedAt: block.updatedAt || null,
            createdAt: block.createdAt || null,
            metadata: "Governed reusable block",
            href: `/blocks/${block.id}?role=${role}`,
          }));

        const pageItems: ApprovalItem[] = rawPages
          .filter((page) =>
            ["pending_approval", "approved", "changes_requested"].includes(page.status)
          )
          .map((page) => ({
            id: page.id,
            type: "page",
            name: page.name,
            owner: page.createdByUserId || "Jamie",
            status: (
              page.status === "approved" || page.status === "changes_requested"
                ? page.status
                : "pending_approval"
            ) as ApprovalStatus,
            governanceScore: null,
            updatedAt: page.updatedAt || null,
            createdAt: page.createdAt || null,
            metadata: `${page.templateName} · ${page.sections.length} sections`,
            href: `/pages/${page.id}/approval?role=${role}`,
          }));

        const merged = [...blockItems, ...pageItems].sort((a, b) => {
          const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return bTime - aTime;
        });

        setItems(merged);
      } catch (error) {
        console.error("Failed to load approvals:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    if (canAccessApprovals) {
      void loadQueue();
    } else {
      setLoading(false);
      setItems([]);
    }
  }, [role, refreshKey, canAccessApprovals]);

  const searchedItems = useMemo(() => {
    return items.filter((item) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();

      return (
        item.name.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.metadata.toLowerCase().includes(q) ||
        getStatusLabel(item.status).toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const filteredItems = useMemo(() => {
    switch (filter) {
      case "block":
        return searchedItems.filter((item) => item.type === "block");
      case "page":
        return searchedItems.filter((item) => item.type === "page");
      case "approved":
        return searchedItems.filter((item) => item.status === "approved");
      case "changes_requested":
        return searchedItems.filter(
          (item) => item.status === "changes_requested"
        );
      case "pending":
        return searchedItems.filter((item) =>
          ["pending_approval", "in_review"].includes(item.status)
        );
      case "all":
      default:
        return searchedItems;
    }
  }, [searchedItems, filter]);

  const totals = useMemo(() => {
    const blocks = items.filter((item) => item.type === "block").length;
    const pages = items.filter((item) => item.type === "page").length;
    const pending = items.filter((item) =>
      ["pending_approval", "in_review"].includes(item.status)
    ).length;
    const approved = items.filter((item) => item.status === "approved").length;
    const changesRequested = items.filter(
      (item) => item.status === "changes_requested"
    ).length;

    return {
      total: items.length,
      blocks,
      pages,
      pending,
      approved,
      changesRequested,
    };
  }, [items]);

  if (!canAccessApprovals) {
    return (
      <div className="min-h-[calc(100dvh-72px)] bg-[#f4f7fb] text-slate-900">
        <div className="mx-auto max-w-[980px] px-6 py-10 lg:px-8">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-[28px] font-semibold tracking-[-0.04em] text-slate-900">
              Approval access required
            </h1>
            <p className="mx-auto mt-3 max-w-[640px] text-sm leading-6 text-slate-500">
              This workspace is only available to approvers and admins. Your current
              role can still create and manage content, but cannot manage the approval queue.
            </p>

            <button
              type="button"
              onClick={() => router.push(`/dashboard?role=${role}`)}
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5]"
            >
              Back to Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto max-w-[1650px] px-6 py-6 lg:px-8">
        <div className="mb-6 rounded-[32px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)] px-6 py-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#4f6fff]">
                Governance Workspace
              </p>
              <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.05em] text-slate-900">
                Approval Queue
              </h1>
              <p className="mt-2 max-w-[760px] text-sm leading-6 text-slate-500">
                Manage approvals across blocks and pages from one governed workspace,
                so reviewers can keep workflow moving without jumping between libraries.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Role: <span className="font-semibold text-slate-900">{role}</span>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/dashboard?role=${role}`)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Total Queue"
            value={totals.total}
            tone="blue"
            icon={<Shield className="h-5 w-5" />}
          />
          <MetricCard
            label="Pending Review"
            value={totals.pending}
            tone="amber"
            icon={<Clock3 className="h-5 w-5" />}
          />
          <MetricCard
            label="Approved"
            value={totals.approved}
            tone="emerald"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <MetricCard
            label="Changes Requested"
            value={totals.changesRequested}
            tone="rose"
            icon={<XCircle className="h-5 w-5" />}
          />
          <MetricCard
            label="Blocks / Pages"
            value={`${totals.blocks} / ${totals.pages}`}
            tone="blue"
            icon={<Blocks className="h-5 w-5" />}
          />
        </div>

        <section className="mb-6 rounded-[30px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative max-w-[420px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search approvals, owners, types or statuses"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#cfd8f6] focus:ring-4 focus:ring-[#eef3ff]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-1 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <Filter className="h-3.5 w-3.5" />
                Filters
              </div>

              <FilterButton active={filter === "pending"} label="Pending" onClick={() => setFilter("pending")} />
              <FilterButton active={filter === "all"} label="All" onClick={() => setFilter("all")} />
              <FilterButton active={filter === "block"} label="Blocks" onClick={() => setFilter("block")} />
              <FilterButton active={filter === "page"} label="Pages" onClick={() => setFilter("page")} />
              <FilterButton active={filter === "approved"} label="Approved" onClick={() => setFilter("approved")} />
              <FilterButton
                active={filter === "changes_requested"}
                label="Changes Requested"
                onClick={() => setFilter("changes_requested")}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {filteredItems.length}
              </span>{" "}
              matching approval items
            </span>

            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("pending");
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Reset View
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="rounded-[30px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
                    Unified Review Queue
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    One place to review governed work across the platform.
                  </p>
                </div>
              </div>
            </div>

            <div className="shrink-0 inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {filteredItems.length} items
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
            <div className="grid grid-cols-[120px_minmax(0,1.7fr)_180px_160px_120px_140px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <div>Type</div>
              <div>Item</div>
              <div>Owner</div>
              <div>Status</div>
              <div>Governance</div>
              <div>Updated</div>
            </div>

            <div className="divide-y divide-slate-200">
              {loading ? (
                <div className="px-5 py-16 text-center text-sm text-slate-400">
                  Loading approval queue…
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-4">
                  <EmptyState text="No approval items match your current filters." />
                </div>
              ) : (
                filteredItems.map((item) => (
                  <QueueRow key={`${item.type}-${item.id}`} item={item} />
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}