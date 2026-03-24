"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

function isRole(value: string | null | undefined): value is Role {
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

function getActionHref(block: DashboardBlock) {
  switch (block.status) {
    case "pending_approval":
      return `/blocks/${block.id}/approval`;
    case "approved":
    case "deployed":
    case "completed":
      return `/blocks/${block.id}/deploy`;
    case "rejected":
    case "draft":
    case "in_review":
    case "generating":
    default:
      return `/blocks/${block.id}/review`;
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
  right?: ReactNode;
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
  icon: ReactNode;
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

function RecentBlockRow({ block }: { block: DashboardBlock }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(getActionHref(block))}
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

function PendingApprovalRow({ block }: { block: DashboardBlock }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/blocks/${block.id}/approval`)}
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

  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<DashboardBlock[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch("/api/session", {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));
        const value = json?.user?.role;

        if (isRole(value)) {
          setRole(value);
        } else {
          setRole("creator");
        }
      } catch (error) {
        console.error("Failed to load session:", error);
        setRole("creator");
      }
    }

    void loadSession();
  }, []);

  useEffect(() => {
    async function loadBlocks() {
      if (!role) {
        setBlocks([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await fetch("/api/blocks", {
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

  if (role === null) {
    return (
      <div className="flex h-[calc(100dvh-72px)] items-center justify-center bg-[#f4f7fb] text-slate-900">
        <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-5 text-sm text-slate-500 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
          Loading dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-72px)] overflow-hidden bg-[#f4f7fb] text-slate-900">
      {/* keep the rest of your JSX exactly as it already is */}
    </div>
  );
}