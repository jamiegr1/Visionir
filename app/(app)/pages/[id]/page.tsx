"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentSchema } from "@/lib/component-schema";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileText,
  LayoutTemplate,
  Pencil,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  XCircle,
  Search,
  Blocks,
  ChevronRight,
  Library,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { makePreviewHtml } from "@/lib/preview";
import type {
  PageRecord,
  PageStatus,
  PageTemplateSectionInstance,
} from "@/lib/template-types";

type Role = "creator" | "approver" | "admin";
type PageTab = "overview" | "sections" | "preview";

type GovernanceRiskLevel = "low" | "medium" | "high";

type GovernanceMetric = {
  label: string;
  score: number;
  maxScore: number;
  description: string;
  status: "good" | "warning" | "risk";
};

type GovernanceRecommendation = {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
};

type PageGovernanceInsights = {
  score: number;
  riskLevel: GovernanceRiskLevel;
  riskLabel: string;
  passedChecks: number;
  totalChecks: number;
  metrics: GovernanceMetric[];
  recommendations: GovernanceRecommendation[];
  approvedAttachedBlocks: number;
  totalAttachedBlocks: number;
  missingRequiredSections: number;
  incompleteSections: number;
  incompatibleBlocks: number;
};

type ApiBlockRecord = {
  id: string;
  status?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string;
  createdByName?: string;
  createdByUserId?: string;
  data?: Record<string, unknown> | null;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

function getStatusLabel(status: PageStatus) {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "pending_approval":
      return "Pending Approval";
    case "changes_requested":
      return "Changes Requested";
    case "approved":
      return "Approved";
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
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "pending_approval":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "changes_requested":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "approved":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "published":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "archived":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    case "draft":
    default:
      return "bg-amber-50 text-amber-700 ring-amber-200";
  }
}

function getBlockStatusLabel(status: string | undefined) {
  switch (status) {
    case "draft":
      return "Draft";
    case "generating":
      return "Generating";
    case "in_review":
      return "In Review";
    case "pending_approval":
      return "Pending Review";
    case "changes_requested":
      return "Changes Requested";
    case "approved":
      return "Approved";
    case "published":
      return "Published";
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

function getBlockStatusPillClass(status: string | undefined) {
  switch (status) {
    case "approved":
    case "published":
    case "completed":
    case "deployed":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "pending_approval":
    case "in_review":
    case "changes_requested":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function getBlockComponentType(block: ApiBlockRecord) {
  const componentType =
    block.data?.componentType ||
    block.data?.componentId ||
    block.data?.category;

  return typeof componentType === "string" && componentType.trim()
    ? componentType.trim()
    : "";
}

function normaliseComponentId(value: string) {
  const cleaned = value.trim().toLowerCase();

  const aliases: Record<string, string> = {
    testimonial: "testimonials",
    testimonials: "testimonials",
    stat: "stats",
    stats: "stats",
    statistics: "stats",
    metrics: "stats",
    logo: "logos",
    logos: "logos",
    "logo-cloud": "logos",
    feature: "features",
    features: "features",
    benefit: "features",
    benefits: "features",
    text: "rich-text",
    "text-section": "rich-text",
    "rich-text": "rich-text",
    article: "articles",
    articles: "articles",
    blog: "articles",
    process: "steps",
    steps: "steps",
    cta: "cta",
    "call-to-action": "cta",
    hero: "hero",
    faq: "faq",
    pricing: "pricing",
    team: "team",
    media: "media",
    form: "form",
    contact: "contact",
    timeline: "timeline",
  };

  return aliases[cleaned] || cleaned;
}

function isApprovedLikeStatus(status: string | undefined) {
  return (
    status === "approved" ||
    status === "published" ||
    status === "completed" ||
    status === "deployed"
  );
}

function getMetricTone(status: GovernanceMetric["status"]) {
  switch (status) {
    case "good":
      return "bg-emerald-500";
    case "warning":
      return "bg-amber-500";
    case "risk":
    default:
      return "bg-rose-500";
  }
}

function getGovernanceRiskStyles(riskLevel: GovernanceRiskLevel) {
  switch (riskLevel) {
    case "low":
      return {
        dot: "bg-emerald-500",
        pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        bar: "bg-emerald-500",
        card: "border-emerald-200 bg-emerald-50",
      };
    case "medium":
      return {
        dot: "bg-amber-500",
        pill: "bg-amber-50 text-amber-700 ring-amber-200",
        bar: "bg-amber-500",
        card: "border-amber-200 bg-amber-50",
      };
    case "high":
    default:
      return {
        dot: "bg-rose-500",
        pill: "bg-rose-50 text-rose-700 ring-rose-200",
        bar: "bg-rose-500",
        card: "border-rose-200 bg-rose-50",
      };
  }
}

function getPriorityTone(priority: GovernanceRecommendation["priority"]) {
  switch (priority) {
    case "High":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "Medium":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "Low":
    default:
      return "bg-blue-50 text-blue-700 ring-blue-200";
  }
}

function getBlockName(block: ApiBlockRecord) {
  const headline = block.data?.headline;
  const eyebrow = block.data?.eyebrow;

  if (typeof headline === "string" && headline.trim()) return headline.trim();
  if (typeof eyebrow === "string" && eyebrow.trim()) return eyebrow.trim();

  const componentType = getBlockComponentType(block);
  if (componentType) return componentType;

  return `Block ${block.id.slice(0, 8)}`;
}

function getComponentName(id: string, componentOptions: ComponentSchema[]) {
  return componentOptions.find((component) => component.id === id)?.name ?? id;
}

function StatusPill({ status }: { status: PageStatus }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1",
        getStatusPillClass(status)
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  children,
  className,
  contentClassName,
  id,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cx(
        "rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-6",
        className
      )}
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
          {icon}
        </div>

        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1.5 text-sm leading-6 text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className={contentClassName}>{children}</div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "group inline-flex h-[92px] min-w-[132px] items-center justify-center gap-2 rounded-[22px] px-6 text-sm font-semibold transition-all duration-200",
        active
          ? "bg-[#5b7cff] text-white shadow-[0_12px_28px_rgba(91,124,255,0.22)]"
          : "border border-slate-200 bg-white text-slate-700 shadow-sm hover:-translate-y-1 hover:scale-[1.02] hover:border-[#cfd8f6] hover:bg-[#f8faff] hover:text-slate-900 hover:shadow-[0_14px_30px_rgba(15,23,42,0.10)]"
      )}
    >
      <span className={cx("transition-transform duration-200", !active && "group-hover:scale-110")}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {children}
      </span>
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

function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "blue" | "emerald" | "amber" | "purple";
}) {
  const styles =
    tone === "blue"
      ? "bg-blue-50 text-blue-700"
      : tone === "emerald"
        ? "bg-emerald-50 text-emerald-700"
        : tone === "amber"
          ? "bg-amber-50 text-amber-700"
          : tone === "purple"
            ? "bg-purple-50 text-purple-700"
            : "bg-slate-100 text-slate-600";

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", styles)}>
      {children}
    </span>
  );
}

function GovernanceScoreCard({
  insights,
  compact = false,
  className,
}: {
  insights: PageGovernanceInsights;
  compact?: boolean;
  className?: string;
}) {
  const riskStyles = getGovernanceRiskStyles(insights.riskLevel);

  if (compact) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-slate-300 hover:shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={cx("h-2.5 w-2.5 rounded-full", riskStyles.dot)} />
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Governance Score
              </p>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">
              {insights.riskLabel} risk profile
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[30px] font-semibold leading-none tracking-[-0.06em] text-slate-950">
              {insights.score}%
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cx(
        "flex h-full w-full flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cx("h-2.5 w-2.5 rounded-full", riskStyles.dot)} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Governance Score
            </p>
          </div>

          <p className="mt-2 text-sm font-medium text-slate-500">
            {insights.riskLabel} risk profile · {insights.passedChecks}/{insights.totalChecks} checks passed
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[44px] font-semibold leading-none tracking-[-0.07em] text-slate-950">
            {insights.score}%
          </p>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cx("h-full rounded-full transition-all duration-500", riskStyles.bar)}
          style={{ width: `${insights.score}%` }}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {insights.metrics.slice(0, 4).map((metric) => (
          <div key={metric.label} className="flex items-start gap-2 rounded-2xl border border-slate-100 px-3 py-3">
            <span className={cx("mt-1 h-2 w-2 shrink-0 rounded-full", getMetricTone(metric.status))} />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800">
                {metric.label}
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-400">
                {metric.score}/{metric.maxScore}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid w-full gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Checks passed
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {insights.passedChecks}/{insights.totalChecks}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Approval coverage
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {insights.totalAttachedBlocks > 0
              ? `${Math.round(
                  (insights.approvedAttachedBlocks /
                    Math.max(insights.totalAttachedBlocks, 1)) *
                    100
                )}%`
              : "0%"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Required gaps
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {insights.missingRequiredSections}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Template risks
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {insights.incompatibleBlocks}
          </p>
        </div>
      </div>
    </div>
  );

}

function RecommendedChangesList({
  recommendations,
}: {
  recommendations: GovernanceRecommendation[];
}) {
  if (recommendations.length === 0) {
    return (
      <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              No major changes recommended
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              This page is in a strong governance position.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.slice(0, 4).map((recommendation) => (
        <div
          key={`${recommendation.priority}-${recommendation.title}`}
          className="rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-5 text-slate-900">
                {recommendation.title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                {recommendation.description}
              </p>
            </div>

            <span
              className={cx(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ring-1",
                getPriorityTone(recommendation.priority)
              )}
            >
              {recommendation.priority}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionRailCard({
  section,
  index,
  isSelected,
  onClick,
}: {
  section: PageTemplateSectionInstance;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-[22px] border px-4 py-4 text-left transition",
        isSelected
          ? "border-[#cfd8f6] bg-[#f7f9ff] shadow-[0_12px_28px_rgba(91,124,255,0.08)]"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cx(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              isSelected ? "bg-[#5b7cff] text-white" : "bg-slate-100 text-slate-600"
            )}
          >
            {index + 1}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {section.label}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {section.blockIds.length > 0
                ? `${section.blockIds.length} attached`
                : "No blocks attached"}
            </p>
          </div>
        </div>

        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={section.required ? "emerald" : "slate"}>
          {section.required ? "Required" : "Optional"}
        </Badge>
        <Badge tone={section.completed ? "emerald" : "amber"}>
          {section.completed ? "Complete" : "Needs content"}
        </Badge>
      </div>
    </button>
  );
}

function AttachedBlockCard({
  block,
  onEdit,
  onRemove,
  isRemoving,
}: {
  block: ApiBlockRecord;
  onEdit: () => void;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {getBlockName(block)}
          </p>
          <p className="mt-1 truncate text-xs text-slate-500">
            {getBlockComponentType(block) || "Unknown component"} · Updated{" "}
            {formatDate(block.updatedAt)}
          </p>
        </div>

        <span
          className={cx(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
            getBlockStatusPillClass(block.status)
          )}
        >
          {getBlockStatusLabel(block.status)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>

        <button
          type="button"
          onClick={onRemove}
          disabled={isRemoving}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          {isRemoving ? "Removing..." : "Remove"}
        </button>
      </div>
    </div>
  );
}

function ExistingBlockPickerCard({
  block,
  onAttach,
  isAttached,
  isAttaching,
}: {
  block: ApiBlockRecord;
  onAttach: () => void;
  isAttached: boolean;
  isAttaching: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {getBlockName(block)}
          </p>
          <p className="mt-1 truncate text-xs text-slate-500">
            {getBlockComponentType(block) || "Unknown component"} · Updated{" "}
            {formatDate(block.updatedAt)}
          </p>
        </div>

        <span
          className={cx(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
            getBlockStatusPillClass(block.status)
          )}
        >
          {getBlockStatusLabel(block.status)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAttach}
          disabled={isAttached || isAttaching}
          className={cx(
            "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
            isAttached
              ? "cursor-not-allowed border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
            isAttaching && "cursor-not-allowed opacity-60"
          )}
        >
          <Plus className="h-4 w-4" />
          {isAttached ? "Attached" : isAttaching ? "Attaching..." : "Attach"}
        </button>
      </div>
    </div>
  );
}

function SectionPreviewFrame({ html }: { html: string }) {
  const [contentHeight, setContentHeight] = useState(260);
  const [contentWidth, setContentWidth] = useState(1280);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateContainerWidth = () => {
      setContainerWidth(element.clientWidth);
    };

    updateContainerWidth();

    const observer = new ResizeObserver(() => {
      updateContainerWidth();
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const scale =
    containerWidth > 0 && contentWidth > 0
      ? Math.min(1, containerWidth / contentWidth)
      : 1;

  const scaledHeight = Math.max(Math.ceil(contentHeight * scale), 260);

  function measureIframe() {
    try {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;

      const body = doc.body;
      const htmlEl = doc.documentElement;

      const nextWidth = Math.max(
        body?.scrollWidth || 0,
        body?.offsetWidth || 0,
        body?.clientWidth || 0,
        htmlEl?.scrollWidth || 0,
        htmlEl?.offsetWidth || 0,
        htmlEl?.clientWidth || 0,
        1280
      );

      const nextHeight = Math.max(
        body?.scrollHeight || 0,
        body?.offsetHeight || 0,
        body?.clientHeight || 0,
        htmlEl?.scrollHeight || 0,
        htmlEl?.offsetHeight || 0,
        htmlEl?.clientHeight || 0,
        260
      );

      setContentWidth(nextWidth);
      setContentHeight(nextHeight);
    } catch (error) {
      console.error("Failed to size preview iframe:", error);
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden bg-white"
      style={{ height: `${scaledHeight}px` }}
    >
      <iframe
        ref={iframeRef}
        title="Section preview"
        srcDoc={html}
        className="block border-0 bg-white"
        style={{
          width: `${contentWidth}px`,
          height: `${contentHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        scrolling="no"
        onLoad={() => {
          measureIframe();
          window.setTimeout(measureIframe, 50);
          window.setTimeout(measureIframe, 150);
          window.setTimeout(measureIframe, 300);
        }}
      />
    </div>
  );
}

export default function PageDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return value === "creator" || value === "approver" || value === "admin"
      ? value
      : "admin";
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

  function isBlockInCurrentRegion(block: ApiBlockRecord) {
    const blockRegionId =
      typeof block.data?.regionId === "string" ? block.data.regionId : "";

    if (isActiveDataRegion) {
      return !blockRegionId || blockRegionId === region;
    }

    return blockRegionId === region;
  }

  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [componentOptionsLoading, setComponentOptionsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [attachLoadingBlockId, setAttachLoadingBlockId] = useState<string | null>(null);
  const [removeLoadingBlockId, setRemoveLoadingBlockId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<PageTab>("sections");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [existingBlockQuery, setExistingBlockQuery] = useState("");
  const hasAppliedSectionFromUrlRef = useRef(false);
  const hasAppliedTabFromUrlRef = useRef(false);

  const [page, setPage] = useState<PageRecord | null>(null);
  const [pageName, setPageName] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [pageStatus, setPageStatus] = useState<PageStatus>("draft");
  const [allBlocks, setAllBlocks] = useState<ApiBlockRecord[]>([]);
  const [componentOptions, setComponentOptions] = useState<ComponentSchema[]>([]);

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);

        const res = await fetch(`/api/pages/${id}?role=${role}&region=${region}`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.page) {
          setPage(null);
          return;
        }

        const nextPage = json.page as PageRecord;
        setPage(nextPage);
        setPageName(nextPage.name || "");
        setPageSlug(nextPage.slug || "");
        setPageStatus(nextPage.status || "draft");
      } catch (error) {
        console.error("Failed to load page:", error);
        setPage(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      void loadPage();
    }
  }, [id, role, region]);

  useEffect(() => {
    async function loadBlocks() {
      try {
        setBlocksLoading(true);

        const res = await fetch(`/api/blocks?role=${role}&region=${region}`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));
        const rawBlocks = Array.isArray(json?.blocks)
          ? (json.blocks as ApiBlockRecord[])
          : [];

        setAllBlocks(rawBlocks.filter(isBlockInCurrentRegion));
      } catch (error) {
        console.error("Failed to load blocks:", error);
        setAllBlocks([]);
      } finally {
        setBlocksLoading(false);
      }
    }

    void loadBlocks();
  }, [role, region, isActiveDataRegion]);

  useEffect(() => {
    async function loadComponentOptions() {
      try {
        setComponentOptionsLoading(true);

        const res = await fetch("/api/component-registry", {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));

        const components = Array.isArray(json?.components)
          ? (json.components as ComponentSchema[])
          : [];

        setComponentOptions(components);
      } catch (error) {
        console.error("Failed to load component registry:", error);
        setComponentOptions([]);
      } finally {
        setComponentOptionsLoading(false);
      }
    }

    void loadComponentOptions();
  }, []);

  const sortedSections = useMemo(() => {
    return (page?.sections ?? []).slice().sort((a, b) => a.order - b.order);
  }, [page]);

  const sectionIdFromUrl = searchParams.get("sectionId") || "";
  const tabFromUrl = searchParams.get("tab") || "";

  useEffect(() => {
    if (!sortedSections.length) {
      setSelectedSectionId(null);
      return;
    }

    if (!hasAppliedTabFromUrlRef.current && tabFromUrl === "sections") {
      hasAppliedTabFromUrlRef.current = true;
      setActiveTab("sections");
    }

    if (
      !hasAppliedSectionFromUrlRef.current &&
      sectionIdFromUrl &&
      sortedSections.some((section) => section.sectionId === sectionIdFromUrl)
    ) {
      hasAppliedSectionFromUrlRef.current = true;
      setSelectedSectionId(sectionIdFromUrl);
      return;
    }

    setSelectedSectionId((current) => {
      const exists = sortedSections.some(
        (section) => section.sectionId === current
      );

      return exists ? current : sortedSections[0]?.sectionId ?? null;
    });
  }, [sortedSections, sectionIdFromUrl, tabFromUrl]);

  useEffect(() => {
    setExistingBlockQuery("");
  }, [selectedSectionId]);

  const selectedSection =
    sortedSections.find((section) => section.sectionId === selectedSectionId) ?? null;

  const attachedBlocksForSelectedSection = useMemo(() => {
    if (!selectedSection) return [];
    return selectedSection.blockIds
      .map((blockId) => allBlocks.find((block) => block.id === blockId))
      .filter((block): block is ApiBlockRecord => Boolean(block));
  }, [selectedSection, allBlocks]);

  const availableBlocksForSelectedSection = useMemo(() => {
    if (!selectedSection) return [];

    const allowed = new Set(
      selectedSection.allowedComponentIds.map((componentId) =>
        normaliseComponentId(componentId)
      )
    );

    return allBlocks.filter((block) => {
      const componentType = normaliseComponentId(getBlockComponentType(block));
      const status = block.status || "";

      const isReusable =
        status === "approved" ||
        status === "published" ||
        status === "completed" ||
        status === "deployed";

      const blockSectionId =
        typeof block.data?.sectionId === "string" ? block.data.sectionId : "";

      const wasGeneratedForThisSection =
        blockSectionId === selectedSection.sectionId;

      const isAllowedByType = componentType ? allowed.has(componentType) : false;

      return isReusable && (isAllowedByType || wasGeneratedForThisSection);
    });
  }, [selectedSection, allBlocks]);

  const filteredAvailableBlocks = useMemo(() => {
    const q = existingBlockQuery.trim().toLowerCase();
    if (!q) return availableBlocksForSelectedSection;

    return availableBlocksForSelectedSection.filter((block) => {
      const name = getBlockName(block).toLowerCase();
      const type = getBlockComponentType(block).toLowerCase();
      const status = (block.status || "").toLowerCase();

      return name.includes(q) || type.includes(q) || status.includes(q);
    });
  }, [availableBlocksForSelectedSection, existingBlockQuery]);

  function buildSectionPreviewHtml(section: PageTemplateSectionInstance) {
    const matchedBlocks = section.blockIds
      .map((blockId) => allBlocks.find((block) => block.id === blockId))
      .filter((block): block is ApiBlockRecord => Boolean(block?.data));

    if (matchedBlocks.length === 0) {
      return "";
    }

    if (matchedBlocks.length === 1) {
      return makePreviewHtml(matchedBlocks[0].data as any);
    }

    const firstBlockHtml = makePreviewHtml(matchedBlocks[0].data as any);

    const headMatch = firstBlockHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const extractedHead = headMatch ? headMatch[1] : "";

    const blockBodies = matchedBlocks
      .map((block) => {
        const html = makePreviewHtml(block.data as any);
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        return bodyMatch ? bodyMatch[1] : html;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          ${extractedHead}
          <style>
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
            }

            .page-preview-stack > * + * {
              margin-top: 24px;
            }
          </style>
        </head>
        <body>
          <div class="page-preview-stack" style="width:max-content; min-width:100%;">
            ${blockBodies}
          </div>
        </body>
      </html>
    `;
  }

  async function refreshPage() {
    const res = await fetch(`/api/pages/${id}?role=${role}&region=${region}`, {
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    if (res.ok && json?.page) {
      const nextPage = json.page as PageRecord;
      setPage(nextPage);
      setPageName(nextPage.name || "");
      setPageSlug(nextPage.slug || "");
      setPageStatus(nextPage.status || "draft");
    }
  }

  async function refreshBlocks() {
    const res = await fetch(`/api/blocks?role=${role}&region=${region}`, {
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    const rawBlocks = Array.isArray(json?.blocks)
      ? (json.blocks as ApiBlockRecord[])
      : [];

    setAllBlocks(rawBlocks.filter(isBlockInCurrentRegion));
  }

  async function handleSave() {
    if (!page) return;

    try {
      setIsSaving(true);

      const res = await fetch(`/api/pages/${id}?role=${role}&region=${region}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pageName.trim(),
          slug: pageSlug.trim(),
          status: pageStatus,
          regionId: region,
          regionName: regionLabel,
          updatedByUserId: "user-1",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to save page.");
      }

      await refreshPage();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save page.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleWorkflowAction(
    action: "submit" | "approve" | "request_changes" | "publish"
  ) {
    try {
      setIsActing(true);

      const res = await fetch(`/api/pages/${id}?role=${role}&region=${region}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          regionId: region,
          regionName: regionLabel,
          updatedByUserId: "user-1",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || `Failed to ${action} page.`);
      }

      await refreshPage();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : `Failed to ${action} page.`);
    } finally {
      setIsActing(false);
    }
  }

  async function handleAttachBlock(blockId: string) {
    if (!selectedSection) return;

    try {
      setAttachLoadingBlockId(blockId);

      const res = await fetch(`/api/pages/${id}?role=${role}&region=${region}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "attach_block",
          sectionId: selectedSection.sectionId,
          blockId,
          regionId: region,
          regionName: regionLabel,
          updatedByUserId: "user-1",
          skipAllowedComponentCheck: true,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to attach block.");
      }

      await refreshPage();
      await refreshBlocks();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to attach block.");
    } finally {
      setAttachLoadingBlockId(null);
    }
  }

  async function handleRemoveBlock(blockId: string) {
    if (!selectedSection) return;

    try {
      setRemoveLoadingBlockId(blockId);

      const res = await fetch(`/api/pages/${id}?role=${role}&region=${region}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_block",
          sectionId: selectedSection.sectionId,
          blockId,
          regionId: region,
          regionName: regionLabel,
          updatedByUserId: "user-1",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to remove block.");
      }

      await refreshPage();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to remove block.");
    } finally {
      setRemoveLoadingBlockId(null);
    }
  }

  function handleGenerateBlock() {
    if (!selectedSection || !page) return;

    const allowed = selectedSection.allowedComponentIds || [];
    const fallbackComponentId =
      selectedSection.defaultComponentId ||
      allowed[0] ||
      selectedSection.key ||
      selectedSection.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const params = new URLSearchParams({
      role,
      region,
      pageId: page.id,
      sectionId: selectedSection.sectionId,
      allowed: allowed.join(","),
      pageName: page.name,
      sectionLabel: selectedSection.label,
      sectionKey: selectedSection.key,
      lockedComponentId: fallbackComponentId,
      returnTo: `/pages/${page.id}?role=${role}&region=${region}&tab=sections&sectionId=${selectedSection.sectionId}#section-workspace`,
    });

    if (selectedSection.defaultComponentId) {
      params.set("defaultComponentId", selectedSection.defaultComponentId);
    }

    router.push(`/blocks/new?${params.toString()}`);
  }

  const completedSections = sortedSections.filter((section) => section.completed);
  const incompleteSections = sortedSections.filter((section) => !section.completed);

  const governanceInsights = useMemo<PageGovernanceInsights>(() => {
    const requiredSections = sortedSections.filter((section) => section.required);
    const missingRequiredSections = requiredSections.filter(
      (section) => !section.completed || section.blockIds.length === 0
    );

    const attachedBlockIds = sortedSections.flatMap((section) => section.blockIds);
    const attachedBlocks = attachedBlockIds
      .map((blockId) => allBlocks.find((block) => block.id === blockId))
      .filter((block): block is ApiBlockRecord => Boolean(block));

    const approvedAttachedBlocks = attachedBlocks.filter((block) =>
      isApprovedLikeStatus(block.status)
    );

    const incompatibleBlocks = sortedSections.reduce((count, section) => {
      const allowed = new Set(
        section.allowedComponentIds.map((componentId) =>
          normaliseComponentId(componentId)
        )
      );

      const invalidBlocksInSection = section.blockIds.filter((blockId) => {
        const block = allBlocks.find((item) => item.id === blockId);
        if (!block) return false;

        const componentType = normaliseComponentId(getBlockComponentType(block));
        if (!componentType || allowed.size === 0) return false;

        return !allowed.has(componentType);
      });

      return count + invalidBlocksInSection.length;
    }, 0);

    const blocksWithPotentialAccessibilityRisk = attachedBlocks.filter((block) => {
      const componentType = normaliseComponentId(getBlockComponentType(block));
      const data = block.data ?? {};

      const likelyNeedsAltText =
        componentType === "media" ||
        componentType === "team" ||
        componentType === "testimonials" ||
        typeof data.image === "string" ||
        typeof data.imageUrl === "string" ||
        typeof data.mediaUrl === "string";

      const hasAltText =
        typeof data.alt === "string" ||
        typeof data.altText === "string" ||
        typeof data.imageAlt === "string" ||
        typeof data.mediaAlt === "string";

      return likelyNeedsAltText && !hasAltText;
    });

    const sectionCompletionPercent =
      sortedSections.length > 0
        ? completedSections.length / sortedSections.length
        : 1;

    const requiredCompletionPercent =
      requiredSections.length > 0
        ? (requiredSections.length - missingRequiredSections.length) /
          requiredSections.length
        : 1;

    const approvalPercent =
      attachedBlocks.length > 0
        ? approvedAttachedBlocks.length / attachedBlocks.length
        : 0;

    const compatibilityPercent =
      attachedBlocks.length > 0
        ? (attachedBlocks.length - incompatibleBlocks) / attachedBlocks.length
        : 1;

    const accessibilityPercent =
      attachedBlocks.length > 0
        ? (attachedBlocks.length - blocksWithPotentialAccessibilityRisk.length) /
          attachedBlocks.length
        : 1;

    const workflowPercent =
      pageStatus === "published"
        ? 1
        : pageStatus === "approved"
          ? 0.9
          : pageStatus === "pending_approval"
            ? 0.75
            : pageStatus === "in_progress"
              ? 0.55
              : pageStatus === "changes_requested"
                ? 0.35
                : 0.25;

    const metrics: GovernanceMetric[] = [
      {
        label: "Page structure",
        score: Math.round(requiredCompletionPercent * 30),
        maxScore: 30,
        status:
          missingRequiredSections.length === 0 && sectionCompletionPercent >= 0.8
            ? "good"
            : missingRequiredSections.length <= 1
              ? "warning"
              : "risk",
        description:
          missingRequiredSections.length === 0
            ? "All required sections have content attached."
            : `${missingRequiredSections.length} required section${
                missingRequiredSections.length === 1 ? "" : "s"
              } still need content.`,
      },
      {
        label: "Block approval",
        score: Math.round(approvalPercent * 25),
        maxScore: 25,
        status:
          attachedBlocks.length > 0 && approvalPercent === 1
            ? "good"
            : approvalPercent >= 0.7
              ? "warning"
              : "risk",
        description:
          attachedBlocks.length === 0
            ? "No blocks are currently attached to this page."
            : `${approvedAttachedBlocks.length} of ${attachedBlocks.length} attached blocks are approved or publish-ready.`,
      },
      {
        label: "Template compatibility",
        score: Math.round(compatibilityPercent * 20),
        maxScore: 20,
        status:
          incompatibleBlocks === 0 ? "good" : incompatibleBlocks <= 1 ? "warning" : "risk",
        description:
          incompatibleBlocks === 0
            ? "Attached blocks match the allowed section component rules."
            : `${incompatibleBlocks} attached block${
                incompatibleBlocks === 1 ? "" : "s"
              } may not match this template's allowed section rules.`,
      },
      {
        label: "Accessibility signals",
        score: Math.round(accessibilityPercent * 15),
        maxScore: 15,
        status:
          blocksWithPotentialAccessibilityRisk.length === 0
            ? "good"
            : blocksWithPotentialAccessibilityRisk.length <= 1
              ? "warning"
              : "risk",
        description:
          blocksWithPotentialAccessibilityRisk.length === 0
            ? "No obvious media alt-text risks were found in attached block data."
            : `${blocksWithPotentialAccessibilityRisk.length} media-heavy block${
                blocksWithPotentialAccessibilityRisk.length === 1 ? "" : "s"
              } may need alt text or accessibility review.`,
      },
      {
        label: "Workflow readiness",
        score: Math.round(workflowPercent * 10),
        maxScore: 10,
        status:
          pageStatus === "approved" || pageStatus === "published"
            ? "good"
            : pageStatus === "pending_approval"
              ? "warning"
              : "risk",
        description:
          pageStatus === "approved" || pageStatus === "published"
            ? "The page has reached an approved publishing state."
            : pageStatus === "pending_approval"
              ? "The page is submitted and awaiting approval."
              : "The page has not yet reached approval.",
      },
    ];

    const score = Math.min(
      100,
      Math.max(0, metrics.reduce((total, metric) => total + metric.score, 0))
    );

    const riskLevel: GovernanceRiskLevel =
      score >= 80 && missingRequiredSections.length === 0 && incompatibleBlocks === 0
        ? "low"
        : score >= 60
          ? "medium"
          : "high";

    const recommendations: GovernanceRecommendation[] = [];

    if (missingRequiredSections.length > 0) {
      recommendations.push({
        priority: "High",
        title: "Complete required page sections",
        description: `Add or attach governed blocks to ${missingRequiredSections
          .map((section) => section.label)
          .slice(0, 3)
          .join(", ")}${
          missingRequiredSections.length > 3 ? " and other required sections" : ""
        } before submitting or publishing.`,
      });
    }

    if (attachedBlocks.length === 0) {
      recommendations.push({
        priority: "High",
        title: "Attach governed blocks",
        description:
          "This page currently has no attached block content. Generate new governed blocks or reuse approved blocks from the library.",
      });
    }

    const unapprovedBlocks = attachedBlocks.filter(
      (block) => !isApprovedLikeStatus(block.status)
    );

    if (unapprovedBlocks.length > 0) {
      recommendations.push({
        priority: "High",
        title: "Resolve unapproved blocks",
        description: `${unapprovedBlocks.length} attached block${
          unapprovedBlocks.length === 1 ? " is" : "s are"
        } still draft, in review, or awaiting changes. Move them through approval before publishing.`,
      });
    }

    if (incompatibleBlocks > 0) {
      recommendations.push({
        priority: "Medium",
        title: "Review template compatibility",
        description:
          "One or more attached blocks may not match the allowed block types for their section. Replace them or update the template rules if this is intentional.",
      });
    }

    if (blocksWithPotentialAccessibilityRisk.length > 0) {
      recommendations.push({
        priority: "Medium",
        title: "Check accessibility metadata",
        description:
          "Some media-led blocks may need alt text or an accessibility review before this page is approved.",
      });
    }

    if (
      pageStatus !== "approved" &&
      pageStatus !== "published" &&
      missingRequiredSections.length === 0 &&
      unapprovedBlocks.length === 0 &&
      attachedBlocks.length > 0
    ) {
      recommendations.push({
        priority: "Low",
        title: "Submit page for approval",
        description:
          "The core page structure looks ready. Submit it so an approver can complete the governance workflow.",
      });
    }

    const passedChecks = metrics.filter((metric) => metric.status === "good").length;

    return {
      score,
      riskLevel,
      riskLabel:
        riskLevel === "low" ? "Low" : riskLevel === "medium" ? "Medium" : "High",
      passedChecks,
      totalChecks: metrics.length,
      metrics,
      recommendations,
      approvedAttachedBlocks: approvedAttachedBlocks.length,
      totalAttachedBlocks: attachedBlocks.length,
      missingRequiredSections: missingRequiredSections.length,
      incompleteSections: incompleteSections.length,
      incompatibleBlocks,
    };
  }, [allBlocks, completedSections.length, incompleteSections.length, pageStatus, sortedSections]);

  const workflowSummary =
    pageStatus === "draft"
      ? "This page is still being prepared."
      : pageStatus === "in_progress"
        ? "Required sections are being completed."
        : pageStatus === "pending_approval"
          ? "This page is awaiting approval."
          : pageStatus === "approved"
            ? "This page has been approved and is ready for publishing."
            : pageStatus === "changes_requested"
              ? "This page needs further changes before resubmission."
              : pageStatus === "published"
                ? "This page has been published."
                : "This page is archived.";


  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-72px)] items-center justify-center bg-[#f5f7fb] text-slate-500">
        Loading page…
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex min-h-[calc(100dvh-72px)] items-center justify-center bg-[#f5f7fb] text-slate-500">
        Page not found.
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[#f5f7fb] text-slate-900">
      <div className="mx-auto max-w-[1740px] px-6 py-6">
        <section className="rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_100%)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push(withRegion("/pages"))}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Pages
                </button>

                <StatusPill status={pageStatus} />

                <span className="inline-flex items-center rounded-full border border-[#dbe5ff] bg-[#eef3ff] px-3 py-1.5 text-xs font-semibold text-[#4f6fff]">
                  {regionLabel}
                </span>
              </div>

              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#4f6fff]">
                Page Workspace
              </p>

              <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-slate-900 lg:text-[34px]">
                {page.name}
              </h1>

              <p className="mt-2 max-w-[820px] text-sm leading-6 text-slate-500">
                This page belongs to <span className="font-medium text-slate-700">{regionLabel}</span>{" "}
                and inherits its structure from the{" "}
                <span className="font-medium text-slate-700">{page.templateName}</span>{" "}
                global template.
              </p>
            </div>

            <div className="flex w-full max-w-[860px] flex-col gap-3 xl:items-end">
              <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Page"}
                </button>

                {pageStatus === "draft" ||
                pageStatus === "changes_requested" ||
                pageStatus === "in_progress" ? (
                  <button
                    type="button"
                    onClick={() => handleWorkflowAction("submit")}
                    disabled={isActing}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-5 text-sm font-medium text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {isActing ? "Submitting..." : "Submit"}
                  </button>
                ) : null}

                {pageStatus === "pending_approval" &&
                (role === "approver" || role === "admin") ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleWorkflowAction("approve")}
                      disabled={isActing}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-5 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {isActing ? "Approving..." : "Approve"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleWorkflowAction("request_changes")}
                      disabled={isActing}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle className="h-4 w-4" />
                      {isActing ? "Sending..." : "Request Changes"}
                    </button>
                  </>
                ) : null}

                {pageStatus === "approved" || pageStatus === "published" ? (
                  <button
                    type="button"
                    onClick={() => router.push(withRegion(`/pages/${page.id}/publish`))}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Publish Page
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => router.push(withRegion(`/templates/${page.templateId}`))}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <LayoutTemplate className="h-4 w-4" />
                  View Template
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-stretch xl:justify-between">
          <div className="grid flex-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
            <div className="flex h-[92px] flex-col justify-center rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Region / Template
              </p>
              <p className="mt-1.5 truncate text-sm font-semibold text-slate-900">
                {regionLabel}
              </p>
              <p className="mt-1 truncate text-xs font-medium text-slate-500">
                {page.templateName}
              </p>
            </div>

            <div className="flex h-[92px] flex-col justify-center rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Page Progress
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900">
                    {completedSections.length} / {sortedSections.length} sections complete
                  </p>
                </div>

                <span className="rounded-full bg-[#eef3ff] px-3 py-1.5 text-xs font-semibold text-[#4f6fff]">
                  {Math.round((completedSections.length / Math.max(sortedSections.length, 1)) * 100)}%
                </span>
              </div>

              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#5b7cff] transition-all duration-500"
                  style={{
                    width: `${Math.round(
                      (completedSections.length / Math.max(sortedSections.length, 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-stretch gap-3 xl:ml-4 xl:self-start">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              icon={<Pencil className="h-4 w-4" />}
              label="Overview"
            />
            <TabButton
              active={activeTab === "sections"}
              onClick={() => setActiveTab("sections")}
              icon={<FileText className="h-4 w-4" />}
              label="Sections"
            />
            <TabButton
              active={activeTab === "preview"}
              onClick={() => setActiveTab("preview")}
              icon={<Eye className="h-4 w-4" />}
              label="Preview"
            />
          </div>
        </div>

        {activeTab === "overview" ? (
          <div className="mt-4 grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <main className="flex min-w-0">
              <div className="grid flex-1 items-stretch gap-6 lg:grid-cols-2">
                <Panel
                  title="Page Details"
                  subtitle="Core page information and readiness status."
                  icon={<Pencil className="h-5 w-5" />}
                  className="flex h-full flex-col"
                  contentClassName="flex flex-1 flex-col"
                >
                  <div className="flex flex-1 flex-col gap-4">
                    <div>
                      <FieldLabel>Page Name</FieldLabel>
                      <TextInput
                        value={pageName}
                        onChange={(e) => setPageName(e.target.value)}
                        placeholder="Service Page"
                      />
                    </div>

                    <div>
                      <FieldLabel>Slug</FieldLabel>
                      <TextInput
                        value={pageSlug}
                        onChange={(e) => setPageSlug(e.target.value)}
                        placeholder="service-page"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <OverviewCard label="Status" value={getStatusLabel(pageStatus)} />
                      <OverviewCard
                        label="Sections"
                        value={`${completedSections.length} / ${sortedSections.length} complete`}
                      />
                      <OverviewCard
                        label="Readiness"
                        value={`${Math.round(
                          (completedSections.length / Math.max(sortedSections.length, 1)) * 100
                        )}%`}
                      />
                    </div>

                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            Page readiness
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {incompleteSections.length === 0
                              ? "All required sections are complete."
                              : `${incompleteSections.length} section${
                                  incompleteSections.length === 1 ? "" : "s"
                                } still need content.`}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                          {Math.round(
                            (completedSections.length / Math.max(sortedSections.length, 1)) * 100
                          )}%
                        </span>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-[#5b7cff] transition-all duration-500"
                          style={{
                            width: `${Math.round(
                              (completedSections.length / Math.max(sortedSections.length, 1)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel
                  title="Governance Score"
                  subtitle="Page-level governance summary."
                  icon={<ShieldCheck className="h-5 w-5" />}
                  className="flex h-full flex-col"
                  contentClassName="flex w-full flex-1"
                >
                  <GovernanceScoreCard insights={governanceInsights} className="h-full" />
                </Panel>
              </div>
            </main>

            <aside className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-stretch">
              <Panel
                title="Workflow"
                icon={<Sparkles className="h-5 w-5" />}
                className="shrink-0"
              >
                <div className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <StatusPill status={pageStatus} />
                  <p className="min-w-0 text-sm leading-6 text-slate-600">
                    {workflowSummary}
                  </p>
                </div>
              </Panel>

              <Panel
                title="Recommended Changes"
                subtitle="Highest-priority governance improvements."
                icon={<TrendingUp className="h-5 w-5" />}
                className="flex-1"
              >
                <RecommendedChangesList recommendations={governanceInsights.recommendations} />
              </Panel>
            </aside>
          </div>
        ) : null}

        {activeTab === "sections" ? (
          <div className="mt-4 grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="space-y-6">
              <Panel
                title="Page Sections"
                subtitle="Select a section to work on it."
                icon={<FileText className="h-5 w-5" />}
                className="xl:sticky xl:top-6"
              >
                {sortedSections.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      No page sections available
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      This page does not currently have any template-derived sections.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedSections.map((section, index) => (
                      <SectionRailCard
                        key={section.sectionId}
                        section={section}
                        index={index}
                        isSelected={selectedSection?.sectionId === section.sectionId}
                        onClick={() => setSelectedSectionId(section.sectionId)}
                      />
                    ))}
                  </div>
                )}
              </Panel>
            </aside>

            <main className="min-w-0 space-y-6">
              {!selectedSection ? (
                <Panel
                  title="Section Workspace"
                  subtitle="Select a section from the left to begin."
                  icon={<Blocks className="h-5 w-5" />}
                >
                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-14 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      Select a section to manage its blocks
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Once selected, you will be able to generate a new block or reuse an
                      approved regional one from the library below.
                    </p>
                  </div>
                </Panel>
              ) : (
                <>
                  <Panel
                    title={selectedSection.label}
                    subtitle={`Build this ${regionLabel} section by generating a governed block or attaching an approved compatible regional block.`}
                    icon={<Blocks className="h-5 w-5" />}
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={selectedSection.required ? "emerald" : "slate"}>
                          {selectedSection.required ? "Required" : "Optional"}
                        </Badge>

                        <Badge tone={selectedSection.completed ? "emerald" : "amber"}>
                          {selectedSection.completed ? "Complete" : "Needs content"}
                        </Badge>

                        <Badge tone="blue">
                          {selectedSection.blockIds.length}/{selectedSection.maxInstances} blocks
                        </Badge>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateBlock}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
                      >
                        <Sparkles className="h-4 w-4" />
                        Generate Block
                      </button>
                    </div>

                    <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Allowed block types
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedSection.allowedComponentIds.length > 0 ? (
                          selectedSection.allowedComponentIds.map((componentId) => (
                            <Badge key={componentId} tone="blue">
                              {getComponentName(componentId, componentOptions)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">
                            No block types have been assigned to this section.
                          </span>
                        )}
                      </div>
                    </div>
                  </Panel>

                  <Panel
                    title="Attached blocks"
                    subtitle={`These ${regionLabel} blocks are already assigned to this section.`}
                    icon={<CheckCircle2 className="h-5 w-5" />}
                  >
                    {attachedBlocksForSelectedSection.length > 0 ? (
                      <div className="grid gap-4 xl:grid-cols-2">
                        {attachedBlocksForSelectedSection.map((block) => (
                          <AttachedBlockCard
                            key={block.id}
                            block={block}
                            onEdit={() =>
                              router.push(
                                `/blocks/${block.id}/review?role=${role}&region=${region}&editMode=page_builder&pageId=${page.id}&sectionId=${
                                  selectedSection.sectionId
                                }&returnTo=${encodeURIComponent(
                                  `/pages/${page.id}?role=${role}&region=${region}&tab=sections&sectionId=${selectedSection.sectionId}#section-workspace`
                                )}`
                              )
                            }
                            onRemove={() => handleRemoveBlock(block.id)}
                            isRemoving={removeLoadingBlockId === block.id}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                        <p className="text-sm font-medium text-slate-700">
                          No blocks attached yet
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Start by generating a new governed block, or choose one from the
                          approved regional block library below.
                        </p>

                        <div className="mt-5 flex flex-wrap justify-center gap-3">
                          <button
                            type="button"
                            onClick={handleGenerateBlock}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
                          >
                            <Sparkles className="h-4 w-4" />
                            Generate Block
                          </button>
                        </div>
                      </div>
                    )}
                  </Panel>

                  <Panel
                    id="approved-block-library"
                    title="Approved block library"
                    subtitle="Choose from compatible approved blocks already in your library, then adapt them for this section."
                    icon={<Library className="h-5 w-5" />}
                  >
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="relative w-full sm:max-w-[340px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={existingBlockQuery}
                          onChange={(e) => setExistingBlockQuery(e.target.value)}
                          placeholder="Search approved compatible blocks"
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#cfd8f6] focus:ring-4 focus:ring-[#eef3ff]"
                        />
                      </div>

                      <div className="text-sm text-slate-500">
                        {filteredAvailableBlocks.length} matching block
                        {filteredAvailableBlocks.length === 1 ? "" : "s"}
                      </div>
                    </div>

                    {blocksLoading || componentOptionsLoading ? (
                      <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">
                        Loading blocks…
                      </div>
                    ) : filteredAvailableBlocks.length > 0 ? (
                      <div className="grid gap-4 xl:grid-cols-2">
                        {filteredAvailableBlocks.map((block) => (
                          <ExistingBlockPickerCard
                            key={block.id}
                            block={block}
                            onAttach={() => handleAttachBlock(block.id)}
                            isAttached={selectedSection.blockIds.includes(block.id)}
                            isAttaching={attachLoadingBlockId === block.id}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
                        <p className="text-sm font-medium text-slate-700">
                          No approved blocks match this section
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          This section currently allows{" "}
                          {selectedSection.allowedComponentIds.length > 0
                            ? selectedSection.allowedComponentIds
                                .map((componentId) =>
                                  getComponentName(componentId, componentOptions)
                                )
                                .join(", ")
                            : "no block types"}
                          . Generate a new governed block for this section, or broaden the
                          allowed block types in the template if needed.
                        </p>
                      </div>
                    )}
                  </Panel>
                </>
              )}
            </main>
          </div>
        ) : null}

        {activeTab === "preview" ? (
          <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
            <main className="min-w-0">
              <Panel
                title="Page Preview"
                subtitle="A composed preview showing the real attached blocks inside each page section."
                icon={<Eye className="h-5 w-5" />}
              >
                {sortedSections.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      Nothing to preview
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      This page does not currently contain any sections.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {sortedSections.map((section, index) => {
                      const previewHtml = buildSectionPreviewHtml(section);

                      return (
                        <div
                          key={section.sectionId}
                          className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                {index + 1}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {section.label}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {section.required ? "Required section" : "Optional section"}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Badge tone={section.required ? "emerald" : "slate"}>
                                {section.required ? "Required" : "Optional"}
                              </Badge>
                              <Badge tone={section.completed ? "emerald" : "slate"}>
                                {section.completed ? "Complete" : "Incomplete"}
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white">
                            {previewHtml ? (
                              <SectionPreviewFrame html={previewHtml} />
                            ) : (
                              <div className="px-4 py-8 text-center">
                                <p className="text-sm font-medium text-slate-700">
                                  No blocks attached yet
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  Attach or generate blocks for this section to preview it.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>
            </main>

            <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              <Panel
                title="Preview Guidance"
                subtitle="A real page-building preview based on attached blocks."
                icon={<Sparkles className="h-5 w-5" />}
              >
                <div className="space-y-3">
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Real attached content
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Each section now renders the actual attached blocks rather than a
                      placeholder card.
                    </p>
                  </div>

                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Section by section
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      This helps you validate the page composition before moving to a full
                      page-wide preview later.
                    </p>
                  </div>

                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Ready for next stage
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      The next improvement would be a single full-page iframe combining all
                      sections into one continuous preview.
                    </p>
                  </div>
                </div>
              </Panel>
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}