"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Plus,
  Search,
  Shield,
  Sparkles,
  ClipboardCheck,
  MoreHorizontal,
  LayoutGrid,
  CircleDashed,
  BadgeCheck,
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
  return block.createdByName || block.createdBy || "Jamie";
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

function getActionHref(block: DashboardBlock, role: Role) {
  switch (block.status) {
    case "pending_approval":
      return `/blocks/${block.id}/approval?role=${role}`;
    case "approved":
    case "deployed":
    case "completed":
      return `/blocks/${block.id}/deploy?role=${role}`;
    case "rejected":
    case "draft":
    case "in_review":
    case "generating":
    default:
      return `/blocks/${block.id}/review?role=${role}`;
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

function ActivityItem({
  time,
  title,
  subtitle,
  dotClass,
}: {
  time: string;
  title: string;
  subtitle: string;
  dotClass: string;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.03)]">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cx("h-2 w-2 rounded-full", dotClass)} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            {time}
          </span>
        </div>
        <button
          type="button"
          className="text-slate-300 transition hover:text-slate-500"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</div>
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
      onClick={() => router.push(getActionHref(block, role))}
      className="grid cursor-pointer grid-cols-[56px_minmax(0,1fr)_140px_140px] items-center gap-4 rounded-[22px] border border-transparent px-3 py-3 transition hover:border-slate-200 hover:bg-slate-50/80"
    >
      <div className="flex h-[46px] w-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-[#102746] text-[10px] font-semibold text-white shadow-sm">
        VB
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
            getStatusPillClass(block.status)
          )}
        >
          {getStatusLabel(block.status)}
        </span>
      </div>
    </div>
  );
}

function PendingApprovalRow({
  block,
  role,
}: {
  block: DashboardBlock;
  role: Role;
}) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/blocks/${block.id}/approval?role=${role}`)}
      className="grid cursor-pointer grid-cols-[56px_minmax(0,1fr)_130px_150px] items-center gap-4 rounded-[22px] border border-transparent px-3 py-3 transition hover:border-slate-200 hover:bg-slate-50/80"
    >
      <div className="flex h-[46px] w-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-[#143861] text-[10px] font-semibold text-white shadow-sm">
        AP
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-900">
          {block.name}
        </div>
        <div className="mt-1 truncate text-xs text-slate-500">
          Submitted by {block.owner}
        </div>
      </div>

      <div className="text-sm text-slate-700">{formatDate(block.updatedAt)}</div>

      <div>
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
          Pending Review
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

  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<DashboardBlock[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function loadBlocks() {
      try {
        setLoading(true);

        const res = await fetch(`/api/blocks?role=${role}`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));
        const rawBlocks = Array.isArray(json?.blocks)
          ? (json.blocks as ApiBlockRecord[])
          : [];

        const mapped: DashboardBlock[] = rawBlocks.map((block) => ({
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
        console.error("Failed to load dashboard blocks:", error);
        setBlocks([]);
      } finally {
        setLoading(false);
      }
    }

    void loadBlocks();
  }, [role]);

  const visibleBlocks = useMemo(() => {
    return blocks.filter((block) => {
      if (!query.trim()) return true;

      const q = query.toLowerCase();
      return (
        block.name.toLowerCase().includes(q) ||
        block.owner.toLowerCase().includes(q) ||
        block.component.toLowerCase().includes(q)
      );
    });
  }, [blocks, query]);

  const recentBlocks = useMemo(() => visibleBlocks.slice(0, 7), [visibleBlocks]);

  const pendingApprovals = useMemo(
    () =>
      visibleBlocks
        .filter((block) =>
          ["pending_approval", "in_review"].includes(block.status)
        )
        .slice(0, 7),
    [visibleBlocks]
  );

  const totals = useMemo(() => {
    const liveBlocks = blocks.filter((b) =>
      ["deployed", "completed"].includes(b.status)
    ).length;

    const pending = blocks.filter((b) =>
      ["pending_approval", "in_review"].includes(b.status)
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
      live: liveBlocks,
      pending,
      averageScore,
      blocked: blocks.filter((b) => b.status === "rejected").length,
      drafts: blocks.filter((b) => b.status === "draft").length,
      approved: blocks.filter((b) => b.status === "approved").length,
    };
  }, [blocks]);

  return (
    <div className="h-[calc(100dvh-72px)] overflow-hidden bg-[#f4f7fb] text-slate-900">
      <div className="flex h-full min-h-0">
        <aside className="hidden h-full w-[325px] shrink-0 border-r border-slate-200/90 bg-white xl:flex xl:flex-col">
          <div className="border-b border-slate-200/90 px-7 pb-5 pt-6">
            <div className="rounded-[24px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)] px-5 py-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[13px] text-slate-500">Welcome back</p>
                  <h1 className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.05em] text-slate-900">
                    Kiwa UK
                  </h1>
                </div>

                <div className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <Image
                    src="/kiwalogo.png"
                    alt="Kiwa"
                    width={56}
                    height={18}
                    className="h-auto w-auto object-contain"
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
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900">
                  UK Activity
                </h2>
                <span className="text-xs font-medium text-slate-400">Today</span>
              </div>

              <div className="space-y-3">
                <ActivityItem
                  time="09:03AM"
                  title="Jamie"
                  subtitle="Edited CTA Banner 3h ago"
                  dotClass="bg-[#5b7cff]"
                />
                <ActivityItem
                  time="10:28AM"
                  title="Jamie"
                  subtitle="Submitted Core Services for review"
                  dotClass="bg-amber-400"
                />
                <ActivityItem
                  time="04:24PM"
                  title="Jamie"
                  subtitle="Approved Case Study"
                  dotClass="bg-emerald-400"
                />
              </div>
            </div>

            <div className="mt-auto pt-6">
              <div className="rounded-[28px] border border-slate-200 bg-[#f8fafe] px-5 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.03)]">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900">
                      Governance Snapshot
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">Month to date</p>
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
                      <span>Accessibility</span>
                      <span className="font-semibold text-slate-900">AA</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Blocked</span>
                      <span className="font-semibold text-slate-900">
                        {totals.blocked}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pending</span>
                      <span className="font-semibold text-slate-900">
                        {totals.pending}
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
          <div className="mx-auto max-w-[1650px] px-6 py-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-[340px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search blocks"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#cfd8f6] focus:ring-4 focus:ring-[#eef3ff]"
                />
              </div>

              <button
                type="button"
                onClick={() => router.push(`/blocks/new?role=${role}`)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5]"
              >
                Create Block
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total Blocks"
                value={totals.total}
                tone="blue"
                icon={<LayoutGrid className="h-5 w-5" />}
              />
              <MetricCard
                label="Live Blocks"
                value={totals.live}
                tone="emerald"
                icon={<BadgeCheck className="h-5 w-5" />}
              />
              <MetricCard
                label="Pending Approvals"
                value={totals.pending}
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

            <div className="grid gap-6 2xl:grid-cols-[1.4fr_1fr]">
              <section className="rounded-[30px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
                <SectionHeader
                  title="Recent Block Activity"
                  subtitle="Latest block updates across the workspace."
                  right={
                    <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 text-xs">
                      <button className="rounded-xl px-3 py-2 text-slate-500">
                        Day
                      </button>
                      <button className="rounded-xl px-3 py-2 text-slate-500">
                        Week
                      </button>
                      <button className="rounded-xl bg-white px-3 py-2 font-medium text-slate-800 shadow-sm">
                        Month
                      </button>
                    </div>
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

                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => router.push(`/blocks?role=${role}`)}
                    className="rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
                  >
                    View All Blocks
                  </button>
                  <span className="text-sm text-slate-400">
                    {blocks.length.toLocaleString()} Total Blocks
                  </span>
                </div>
              </section>

              <section className="rounded-[30px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
                <SectionHeader
                  title="Pending Approvals"
                  subtitle="Blocks waiting for review and sign-off."
                  right={
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                      <Clock3 className="h-3.5 w-3.5" />
                      {pendingApprovals.length} awaiting review
                    </div>
                  }
                />

                <div className="mb-3 grid grid-cols-[56px_minmax(0,1fr)_130px_150px] gap-4 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <div />
                  <div>Block</div>
                  <div>Date</div>
                  <div>Status</div>
                </div>

                <div className="space-y-1">
                  {loading ? (
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                      Loading approvals…
                    </div>
                  ) : pendingApprovals.length === 0 ? (
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                      No blocks are currently awaiting approval.
                    </div>
                  ) : (
                    pendingApprovals.map((block) => (
                      <PendingApprovalRow
                        key={block.id}
                        block={block}
                        role={role}
                      />
                    ))
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => router.push(`/blocks?role=${role}`)}
                    className="rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
                  >
                    View All Approvals
                  </button>
                  <span className="text-sm text-slate-400">
                    {pendingApprovals.length} Awaiting Review
                  </span>
                </div>
              </section>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-[30px] border border-slate-200/90 bg-white px-5 py-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
                <SectionHeader
                  title="Workflow Summary"
                  subtitle="Full governed route from creation to deployment."
                />

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-500 ring-1 ring-slate-200">
                      <ClipboardCheck className="h-4 w-4" />
                    </div>
                    <div className="text-[24px] font-semibold tracking-[-0.04em] text-slate-900">
                      {totals.drafts}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Drafts</p>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-500 ring-1 ring-slate-200">
                      <Clock3 className="h-4 w-4" />
                    </div>
                    <div className="text-[24px] font-semibold tracking-[-0.04em] text-slate-900">
                      {totals.pending}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">In Review</p>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-500 ring-1 ring-slate-200">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="text-[24px] font-semibold tracking-[-0.04em] text-slate-900">
                      {totals.approved}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Approved</p>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#5b7cff] ring-1 ring-slate-200">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="text-[24px] font-semibold tracking-[-0.04em] text-slate-900">
                      {totals.live}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Live</p>
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
                    Launch a new governed block
                  </h3>
                  <p className="mt-2 max-w-[420px] text-sm leading-6 text-slate-600">
                    Start a new workflow with AI-assisted generation,
                    governance checks, approval routing and deployment-ready
                    output.
                  </p>

                  <button
                    type="button"
                    onClick={() => router.push(`/blocks/new?role=${role}`)}
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
                  >
                    Continue Workflow
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}