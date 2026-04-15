"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Blocks,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  LayoutTemplate,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { makePreviewHtml } from "@/lib/preview";
import type {
  PageRecord,
  PageStatus,
  PageTemplateSectionInstance,
} from "@/lib/template-types";

type Role = "creator" | "approver" | "admin";

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

function isRole(value: string | null): value is Role {
  return value === "creator" || value === "approver" || value === "admin";
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
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "pending_approval":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "approved":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "rejected":
      return "bg-rose-50 text-rose-700 ring-rose-200";
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

function getBlockStatusPillClass(status: string | undefined) {
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

function getBlockComponentType(block: ApiBlockRecord) {
  const componentType = block.data?.componentType;
  return typeof componentType === "string" && componentType.trim()
    ? componentType.trim()
    : "";
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

function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "blue" | "emerald" | "amber" | "purple" | "rose";
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
            : tone === "rose"
              ? "bg-rose-50 text-rose-700"
              : "bg-slate-100 text-slate-600";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        styles
      )}
    >
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: PageStatus }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1",
        getPageStatusPillClass(status)
      )}
    >
      {getPageStatusLabel(status)}
    </span>
  );
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

function Panel({
  title,
  subtitle,
  icon,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
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

      {children}
    </section>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="max-w-[62%] break-words text-right text-sm leading-6 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function RuleRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <div className="max-w-[60%] text-right text-sm leading-6 text-slate-900">
        {value}
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

function SectionReviewCard({
  section,
  index,
  matchedBlocks,
}: {
  section: PageTemplateSectionInstance;
  index: number;
  matchedBlocks: ApiBlockRecord[];
}) {
  const readyBlocks = matchedBlocks.filter((block) =>
    ["approved", "published", "completed", "deployed"].includes(block.status || "")
  ).length;

  const flaggedBlocks = matchedBlocks.filter((block) =>
    ["pending_approval", "in_review", "rejected", "draft", "generating"].includes(
      block.status || ""
    )
  ).length;

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef3ff] text-xs font-semibold text-[#4f6fff]">
            {index + 1}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {section.label}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {section.key} • {section.blockIds.length} attached
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone={section.required ? "emerald" : "slate"}>
            {section.required ? "Required" : "Optional"}
          </Badge>
          <Badge tone={section.completed ? "emerald" : "amber"}>
            {section.completed ? "Complete" : "Needs content"}
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Instances
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {section.minInstances}–{section.maxInstances}
          </p>
        </div>

        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Ready blocks
          </p>
          <p className="mt-1 text-sm font-medium text-emerald-700">{readyBlocks}</p>
        </div>

        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Flagged blocks
          </p>
          <p className="mt-1 text-sm font-medium text-amber-700">{flaggedBlocks}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {matchedBlocks.length > 0 ? (
          matchedBlocks.map((block) => (
            <div
              key={block.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {getBlockName(block)}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {getBlockComponentType(block) || "Unknown component"} • Updated{" "}
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
          ))
        ) : (
          <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
            <p className="text-sm font-medium text-slate-700">No blocks attached</p>
            <p className="mt-1 text-sm text-slate-500">
              This section has no block content assigned yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PageApprovalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return isRole(value) ? value : "admin";
  }, [searchParams]);

  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [isActing, setIsActing] = useState(false);

  const [page, setPage] = useState<PageRecord | null>(null);
  const [pageStatus, setPageStatus] = useState<PageStatus>("draft");
  const [allBlocks, setAllBlocks] = useState<ApiBlockRecord[]>([]);

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);

        const res = await fetch(`/api/pages/${id}?role=${role}`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.page) {
          setPage(null);
          return;
        }

        const nextPage = json.page as PageRecord;
        setPage(nextPage);
        setPageStatus(nextPage.status || "draft");
      } catch (error) {
        console.error("Failed to load page approval:", error);
        setPage(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      void loadPage();
    }
  }, [id, role]);

  useEffect(() => {
    async function loadBlocks() {
      try {
        setBlocksLoading(true);

        const res = await fetch(`/api/blocks?role=${role}`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));
        const rawBlocks = Array.isArray(json?.blocks)
          ? (json.blocks as ApiBlockRecord[])
          : [];

        setAllBlocks(rawBlocks);
      } catch (error) {
        console.error("Failed to load blocks:", error);
        setAllBlocks([]);
      } finally {
        setBlocksLoading(false);
      }
    }

    void loadBlocks();
  }, [role]);

  const sortedSections = useMemo(() => {
    return (page?.sections ?? []).slice().sort((a, b) => a.order - b.order);
  }, [page]);

  const requiredSections = useMemo(
    () => sortedSections.filter((section) => section.required),
    [sortedSections]
  );

  const completedSections = useMemo(
    () => sortedSections.filter((section) => section.completed),
    [sortedSections]
  );

  const totalAttachedBlocks = useMemo(
    () => sortedSections.reduce((sum, section) => sum + section.blockIds.length, 0),
    [sortedSections]
  );

  const attachedBlocks = useMemo(() => {
    const ids = new Set(sortedSections.flatMap((section) => section.blockIds));
    return allBlocks.filter((block) => ids.has(block.id));
  }, [sortedSections, allBlocks]);

  const pageReadyBlocks = useMemo(
    () =>
      attachedBlocks.filter((block) =>
        ["approved", "published", "completed", "deployed"].includes(block.status || "")
      ),
    [attachedBlocks]
  );

  const pageFlaggedBlocks = useMemo(
    () =>
      attachedBlocks.filter((block) =>
        ["pending_approval", "in_review", "rejected", "draft", "generating"].includes(
          block.status || ""
        )
      ),
    [attachedBlocks]
  );

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
    const res = await fetch(`/api/pages/${id}?role=${role}`, {
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    if (res.ok && json?.page) {
      const nextPage = json.page as PageRecord;
      setPage(nextPage);
      setPageStatus(nextPage.status || "draft");
    }
  }

  async function handleWorkflowAction(
    action: "submit" | "approve" | "reject" | "publish"
  ) {
    try {
      setIsActing(true);

      const res = await fetch(`/api/pages/${id}?role=${role}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
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

  const canApproveOrReject =
    pageStatus === "pending_approval" && (role === "approver" || role === "admin");

  const canPublish =
    pageStatus === "approved" && (role === "approver" || role === "admin");

  const canSubmit =
    pageStatus === "draft" || pageStatus === "in_progress" || pageStatus === "rejected";

  const workflowSummary =
    pageStatus === "draft"
      ? "This page is still being prepared and has not yet entered governance review."
      : pageStatus === "in_progress"
        ? "This page is being assembled and still has incomplete content areas."
        : pageStatus === "pending_approval"
          ? "This page is awaiting reviewer sign-off before it can move forward."
          : pageStatus === "approved"
            ? "This page has been approved and is ready for publishing."
            : pageStatus === "rejected"
              ? "This page has been rejected and requires changes before resubmission."
              : pageStatus === "published"
                ? "This page has been published."
                : "This page is archived.";

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-72px)] items-center justify-center bg-[#f5f7fb] text-slate-500">
        Loading page approval…
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
                  onClick={() => router.push(`/approvals?role=${role}`)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Approvals
                </button>

                <StatusPill status={pageStatus} />
              </div>

              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#4f6fff]">
                Page Approval
              </p>

              <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-slate-900 lg:text-[34px]">
                {page.name}
              </h1>

              <p className="mt-2 max-w-[820px] text-sm leading-6 text-slate-500">
                Review this page against its governed structure, attached blocks,
                completion state, and workflow readiness before approving or rejecting it.
              </p>
            </div>

            <div className="flex w-full max-w-[860px] flex-col gap-3 xl:items-end">
              <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                {canSubmit ? (
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

                {canApproveOrReject ? (
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
                      onClick={() => handleWorkflowAction("reject")}
                      disabled={isActing}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle className="h-4 w-4" />
                      {isActing ? "Rejecting..." : "Reject"}
                    </button>
                  </>
                ) : null}

                {canPublish ? (
                  <button
                    type="button"
                    onClick={() => handleWorkflowAction("publish")}
                    disabled={isActing}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isActing ? "Publishing..." : "Publish"}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => router.push(`/pages/${page.id}?role=${role}`)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" />
                  Open Workspace
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Sections"
            value={sortedSections.length}
            tone="blue"
            icon={<FileText className="h-5 w-5" />}
          />
          <MetricCard
            label="Completed"
            value={completedSections.length}
            tone="emerald"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <MetricCard
            label="Required"
            value={requiredSections.length}
            tone="slate"
            icon={<LayoutTemplate className="h-5 w-5" />}
          />
          <MetricCard
            label="Attached Blocks"
            value={totalAttachedBlocks}
            tone="blue"
            icon={<Blocks className="h-5 w-5" />}
          />
          <MetricCard
            label="Flagged Blocks"
            value={pageFlaggedBlocks.length}
            tone="amber"
            icon={<Clock3 className="h-5 w-5" />}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <Panel
              title="Approval Summary"
              subtitle="A reviewer-focused overview of page readiness."
              icon={<ShieldCheck className="h-5 w-5" />}
            >
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-700">{workflowSummary}</p>
              </div>

              <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-4">
                <RuleRow label="Status" value={getPageStatusLabel(pageStatus)} />
                <RuleRow label="Template" value={page.templateName} />
                <RuleRow label="Version" value={`v${page.templateVersion}`} />
                <RuleRow
                  label="Completion"
                  value={`${completedSections.length}/${sortedSections.length}`}
                />
                <RuleRow
                  label="Ready blocks"
                  value={`${pageReadyBlocks.length}/${attachedBlocks.length}`}
                />
              </div>
            </Panel>

            <Panel
              title="Metadata"
              subtitle="Core page information."
              icon={<FileText className="h-5 w-5" />}
            >
              <MetaRow label="Page ID" value={page.id} />
              <MetaRow label="Slug" value={page.slug || "—"} />
              <MetaRow label="Created At" value={formatDateTime(page.createdAt)} />
              <MetaRow label="Updated At" value={formatDateTime(page.updatedAt)} />
              <MetaRow label="Template ID" value={page.templateId} />
            </Panel>

            <Panel
              title="Governance Signals"
              subtitle="Quick indicators for reviewer attention."
              icon={<Sparkles className="h-5 w-5" />}
            >
              <div className="flex flex-wrap gap-2">
                <Badge tone={completedSections.length === sortedSections.length ? "emerald" : "amber"}>
                  {completedSections.length === sortedSections.length
                    ? "All sections complete"
                    : "Incomplete sections present"}
                </Badge>

                <Badge tone={pageFlaggedBlocks.length === 0 ? "emerald" : "amber"}>
                  {pageFlaggedBlocks.length === 0
                    ? "All attached blocks ready"
                    : "Block status review needed"}
                </Badge>

                <Badge tone={pageStatus === "pending_approval" ? "purple" : "slate"}>
                  {getPageStatusLabel(pageStatus)}
                </Badge>
              </div>
            </Panel>
          </aside>

          <main className="min-w-0 space-y-6">
            <Panel
              title="Section Review"
              subtitle="Review every governed page section and the status of the blocks attached to it."
              icon={<LayoutTemplate className="h-5 w-5" />}
            >
              {blocksLoading ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">
                  Loading section data…
                </div>
              ) : sortedSections.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    No sections available
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    This page does not currently contain any template-derived sections.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedSections.map((section, index) => {
                    const matchedBlocks = section.blockIds
                      .map((blockId) => allBlocks.find((block) => block.id === blockId))
                      .filter((block): block is ApiBlockRecord => Boolean(block));

                    return (
                      <SectionReviewCard
                        key={section.sectionId}
                        section={section}
                        index={index}
                        matchedBlocks={matchedBlocks}
                      />
                    );
                  })}
                </div>
              )}
            </Panel>

            <Panel
              title="Page Preview"
              subtitle="A composed review preview using the actual attached blocks within each page section."
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
                            <Badge tone={section.completed ? "emerald" : "amber"}>
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
                                This section does not yet contain any previewable content.
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
        </div>
      </div>
    </div>
  );
}