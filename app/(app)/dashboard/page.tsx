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
  const headline = typeof data?.headline === "string" ? data.headline.trim() : "";
  const eyebrow = typeof data?.eyebrow === "string" ? data.eyebrow.trim() : "";

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
    case "published":
      return "Published";
    case "rejected":
      return "Changes Requested";
    case "changes_requested":
      return "Changes Requested";
    case "deploying":
      return "Deploying";
    case "deployed":
      return "Live";
    case "completed":
      return "Completed";
    case "archived":
      return "Archived";
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
    case "changes_requested":
      return "bg-rose-50 text-rose-700 ring-rose-100";
    case "archived":
      return "bg-slate-100 text-slate-500 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function getActionHref(block: DashboardBlock, role: Role) {
  switch (block.status) {
    case "pending_approval":
      return `/blocks/${block.id}/approval?role=${role}`;
    case "approved":
      return `/blocks/${block.id}/deploy?role=${role}`;
    case "published":
    case "deployed":
    case "completed":
      return `/blocks/${block.id}/deploy/embed?role=${role}`;
    case "rejected":
    case "changes_requested":
    case "draft":
    case "in_review":
    case "generating":
    default:
      return `/blocks/${block.id}/review?role=${role}`;
  }
}

function MiniTrend() {
  return (
    <div className="flex items-end gap-1.5">
      {[26, 44, 36, 58, 48, 64].map((height, i) => (
        <span
          key={i}
          className="w-2 rounded-full bg-[#5b7cff]/80"
          style={{ height }}
        />
      ))}
    </div>
  );
}

function GovernanceMiniBars() {
  return (
    <div className="flex items-end gap-1.5">
      {[26, 40, 30, 48, 34].map((height, i) => (
        <span
          key={i}
          className="w-2 rounded-full bg-emerald-400/80"
          style={{ height }}
        />
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
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">
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
    <div className="grid grid-cols-[72px_10px_minmax(0,1fr)] items-start gap-3">
      <span className="pt-0.5 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
        {time}
      </span>
      <span className={cx("mt-1.5 h-2.5 w-2.5 rounded-full", dotClass)} />
      <div>
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
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
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div
        className={cx(
          "inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1",
          ring,
          accent
        )}
      >
        {icon}
      </div>
      <div className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
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
    <button
      type="button"
      onClick={() => router.push(getActionHref(block, role))}
      className="grid w-full cursor-pointer grid-cols-[56px_minmax(0,1fr)_140px_140px] items-center gap-4 rounded-[22px] border border-transparent px-3 py-3 text-left transition hover:border-slate-200 hover:bg-slate-50/80"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef3ff] text-sm font-semibold text-[#4f6fff]">
        VB
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-950">{block.name}</p>
        <p className="truncate text-sm text-slate-500">
          {block.component} • {relativeUpdatedLabel(block.updatedAt)}
        </p>
      </div>

      <div className="text-sm text-slate-500">{formatDate(block.updatedAt)}</div>

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
    </button>
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
    <button
      type="button"
      onClick={() => router.push(`/blocks/${block.id}/approval?role=${role}`)}
      className="grid w-full cursor-pointer grid-cols-[56px_minmax(0,1fr)_130px_150px] items-center gap-4 rounded-[22px] border border-transparent px-3 py-3 text-left transition hover:border-slate-200 hover:bg-slate-50/80"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-sm font-semibold text-amber-700">
        AP
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-950">{block.name}</p>
        <p className="truncate text-sm text-slate-500">Submitted by {block.owner}</p>
      </div>

      <div className="text-sm text-slate-500">{formatDate(block.updatedAt)}</div>

      <div>
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
          Pending Review
        </span>
      </div>
    </button>
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
        const rawBlocks = Array.isArray(json?.blocks) ? (json.blocks as ApiBlockRecord[]) : [];

        const mapped: DashboardBlock[] = rawBlocks
          .map((block) => ({
            id: block.id,
            name: getBlockName(block.data ?? null, block.id),
            component: getComponentName(block.data ?? null),
            status: block.status ?? "draft",
            governanceScore: getGovernanceScore(block.data ?? null),
            updatedAt: block.updatedAt ?? null,
            createdAt: block.createdAt ?? null,
            owner: getOwnerName(block),
            data: block.data ?? null,
          }))
          .sort((a, b) => {
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
    const term = query.trim().toLowerCase();
    if (!term) return blocks;

    return blocks.filter((block) => {
      return (
        block.name.toLowerCase().includes(term) ||
        block.component.toLowerCase().includes(term) ||
        block.owner.toLowerCase().includes(term) ||
        getStatusLabel(block.status).toLowerCase().includes(term)
      );
    });
  }, [blocks, query]);

  const recentBlocks = useMemo(() => visibleBlocks.slice(0, 7), [visibleBlocks]);

  const pendingApprovals = useMemo(
    () =>
      visibleBlocks
        .filter((block) => ["pending_approval", "in_review"].includes(block.status))
        .slice(0, 7),
    [visibleBlocks]
  );

  const totals = useMemo(() => {
    const liveBlocks = blocks.filter((b) =>
      ["published", "deployed", "completed"].includes(b.status)
    ).length;

    const pending = blocks.filter((b) =>
      ["pending_approval", "in_review"].includes(b.status)
    ).length;

    const scores = blocks
      .map((b) => b.governanceScore)
      .filter((value): value is number => typeof value === "number");

    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 98;

    return {
      total: blocks.length,
      live: liveBlocks,
      pending,
      averageScore,
      blocked: blocks.filter((b) =>
        ["rejected", "changes_requested"].includes(b.status)
      ).length,
      drafts: blocks.filter((b) => b.status === "draft").length,
      approved: blocks.filter((b) => b.status === "approved").length,
    };
  }, [blocks]);

  const activity = useMemo(() => {
    return blocks.slice(0, 4).map((block) => ({
      id: block.id,
      time: block.updatedAt ? formatDate(block.updatedAt) : "Today",
      title: `${getStatusLabel(block.status)} • ${block.name}`,
      subtitle: `${block.component} updated by ${block.owner}`,
      dotClass:
        block.status === "published" || block.status === "deployed" || block.status === "completed"
          ? "bg-emerald-500"
          : block.status === "pending_approval" || block.status === "in_review"
          ? "bg-amber-500"
          : block.status === "rejected" || block.status === "changes_requested"
          ? "bg-rose-500"
          : "bg-[#5b7cff]",
    }));
  }, [blocks]);

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[#f5f7fb] text-slate-900">
      <div className="mx-auto grid w-full max-w-[1520px] gap-6 px-6 py-6 xl:grid-cols-[310px_minmax(0,1fr)] xl:px-8">
        <aside className="flex min-h-[calc(100dvh-120px)] flex-col rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
          <div className="mb-8">
            <div className="mb-5">
              <div className="flex h-14 min-w-[88px] shrink-0 items-center rounded-2xl border border-slate-200 bg-white px-3 shadow-sm">
                <Image
                  src="/kiwalogo.png"
                  alt="Kiwa"
                  width={72}
                  height={24}
                  className="h-auto max-w-full object-contain"
                  priority
                />
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Visionir Workspace
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Governance-led block creation, approvals, and deployment across the Kiwa environment.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => router.push(`/dashboard?role=${role}`)}
              className="flex w-full items-center justify-between rounded-2xl border border-[#dbe5ff] bg-[#eef3ff] px-4 py-3 text-left text-sm font-medium text-[#3352d6]"
            >
              <span>Dashboard Overview</span>
              <LayoutGrid className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => router.push(`/blocks/new?role=${role}`)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <span>Create New Block</span>
              <Plus className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => router.push(`/dashboard?role=${role}`)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <span>{role.charAt(0).toUpperCase() + role.slice(1)} Workspace</span>
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-auto rounded-[28px] border border-slate-200 bg-[#f8fafc] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Governance Snapshot</p>
                <p className="mt-1 text-sm text-slate-500">
                  Average compliance across the current block set.
                </p>
              </div>
              <GovernanceMiniBars />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  {totals.averageScore}%
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                  Brand Score
                </div>
              </div>
              <div>
                <div className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  {totals.live}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                  Live Blocks
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Enterprise Component Operations
                </p>
                <h2 className="mt-3 text-[32px] font-semibold tracking-[-0.05em] text-slate-950">
                  Controlled block delivery across teams
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                  Track approved, published, and pending blocks in one governed dashboard built for enterprise marketing teams.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
                  Role: {role}
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/blocks/new?role=${role}`)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1f36b8]"
                >
                  <Plus className="h-4 w-4" />
                  Create Block
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total Blocks"
              value={totals.total}
              icon={<LayoutGrid className="h-5 w-5" />}
            />
            <MetricCard
              label="Live / Published"
              value={totals.live}
              tone="emerald"
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
            <MetricCard
              label="Pending Review"
              value={totals.pending}
              tone="slate"
              icon={<Clock3 className="h-5 w-5" />}
            />
            <MetricCard
              label="Average Governance"
              value={`${totals.averageScore}%`}
              tone="blue"
              icon={<Shield className="h-5 w-5" />}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
              <SectionHeader
                title="Recent Blocks"
                subtitle="Latest activity across created, reviewed, and published blocks."
                right={
                  <div className="relative w-full max-w-[280px]">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search blocks"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#b8c7ff] focus:bg-white"
                    />
                  </div>
                }
              />

              <div className="space-y-1">
                {loading ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                    Loading dashboard…
                  </div>
                ) : recentBlocks.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                    No blocks found.
                  </div>
                ) : (
                  recentBlocks.map((block) => (
                    <RecentBlockRow key={block.id} block={block} role={role} />
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
              <SectionHeader
                title="Approval Queue"
                subtitle="Blocks currently awaiting approver action."
                right={<ClipboardCheck className="h-5 w-5 text-slate-400" />}
              />

              <div className="space-y-1">
                {loading ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                    Loading approvals…
                  </div>
                ) : pendingApprovals.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                    No blocks are currently awaiting review.
                  </div>
                ) : (
                  pendingApprovals.map((block) => (
                    <PendingApprovalRow key={block.id} block={block} role={role} />
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
              <SectionHeader
                title="Governance Performance"
                subtitle="Overview of live delivery and compliance patterns."
                right={<MiniTrend />}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#4f6fff]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Approved Blocks</p>
                      <p className="text-sm text-slate-500">Ready for deployment</p>
                    </div>
                  </div>
                  <p className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                    {totals.approved}
                  </p>
                </div>

                <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <BadgeCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Published Blocks</p>
                      <p className="text-sm text-slate-500">Currently live or deployed</p>
                    </div>
                  </div>
                  <p className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                    {totals.live}
                  </p>
                </div>

                <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-200 text-slate-600">
                      <CircleDashed className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Draft Blocks</p>
                      <p className="text-sm text-slate-500">Still being iterated on</p>
                    </div>
                  </div>
                  <p className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                    {totals.drafts}
                  </p>
                </div>

                <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Blocked / Rework</p>
                      <p className="text-sm text-slate-500">Needs changes before launch</p>
                    </div>
                  </div>
                  <p className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                    {totals.blocked}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
              <SectionHeader
                title="Recent Activity"
                subtitle="Latest operational movement across the workspace."
                right={
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </button>
                }
              />

              <div className="space-y-5">
                {activity.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                    No recent activity yet.
                  </div>
                ) : (
                  activity.map((item) => (
                    <ActivityItem
                      key={item.id}
                      time={item.time}
                      title={item.title}
                      subtitle={item.subtitle}
                      dotClass={item.dotClass}
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}