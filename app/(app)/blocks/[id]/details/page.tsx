"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clipboard,
  Clock3,
  Copy,
  Eye,
  FileText,
  LayoutTemplate,
  ListChecks,
  Monitor,
  PenSquare,
  RefreshCw,
  Shield,
  Smartphone,
  Sparkles,
  Tablet,
  Wand2,
} from "lucide-react";
import type { BlockData } from "@/lib/types";
import type { Role } from "@/lib/permissions";
import { evaluateBlockGovernance } from "@/lib/brand-governance";
import { makePreviewHtml } from "@/lib/preview";

type ViewportMode = "desktop" | "tablet" | "mobile";

type ApiBlockRecord = {
  id: string;
  status?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
  createdByUserId?: string | null;
  updatedByUserId?: string | null;
  submittedByUserId?: string | null;
  approvedByUserId?: string | null;
  publishedByUserId?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  publishedAt?: string | null;
  changesRequestedByUserId?: string | null;
  changesRequestedAt?: string | null;
  changesRequestedNotes?: string | null;
  changesRequestedFields?: string[] | null;
  data?: BlockData | null;
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

  return formatDateTime(value);
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
    case "changes_requested":
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
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "pending_approval":
    case "in_review":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "changes_requested":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
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

function getUserLabel(userId?: string | null) {
  if (!userId) return "—";
  if (userId === "user-1") return "Jamie";
  if (userId === "user-2") return "Approver";
  return userId;
}

function formatFieldLabel(field: string) {
  return field
    .replace(/\./g, " / ")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
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
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {children}
    </section>
  );
}

function StatTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
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
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 first:pt-0 last:border-b-0 last:pb-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="max-w-[62%] break-words text-right text-sm leading-6 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function TimelineItem({
  title,
  value,
  active = false,
  isLast = false,
}: {
  title: string;
  value: string;
  active?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={cx(
            "mt-1 h-3 w-3 rounded-full ring-4",
            active
              ? "bg-[#5b7cff] ring-[#eef3ff]"
              : "bg-slate-300 ring-slate-100"
          )}
        />
        {!isLast ? <span className="mt-2 h-full w-px bg-slate-200" /> : null}
      </div>

      <div className={cx("min-w-0", !isLast && "pb-6")}>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">{value}</p>
      </div>
    </div>
  );
}

function PreviewCanvas({
  previewDoc,
  viewport,
}: {
  previewDoc: string;
  viewport: ViewportMode;
}) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const deviceViewportRef = useRef<HTMLDivElement | null>(null);

  const [shellWidth, setShellWidth] = useState(0);
  const [iframeContentHeight, setIframeContentHeight] = useState(720);
  const [previewScale, setPreviewScale] = useState(1);

  const isDesktop = viewport === "desktop";
  const isTablet = viewport === "tablet";
  const isMobile = viewport === "mobile";

  const shellWidthClass = "max-w-[1320px]";
  const outerPreviewFixedHeight = 620;

  const previewViewportWidth =
    viewport === "mobile" ? 390 : viewport === "tablet" ? 768 : 1280;

  const deviceViewportHeight =
    viewport === "mobile" ? 600 : viewport === "tablet" ? 620 : 560;

  const topPreviewPadding = 56;

  useEffect(() => {
    const element = shellRef.current;
    if (!element) return;

    const update = () => {
      setShellWidth(element.clientWidth);
    };

    update();

    const observer = new ResizeObserver(() => update());
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (deviceViewportRef.current) {
      deviceViewportRef.current.scrollTop = 0;
      deviceViewportRef.current.scrollLeft = 0;
    }
  }, [viewport, previewDoc]);

  useEffect(() => {
    function syncIframeSize() {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const doc = iframe.contentDocument;
      if (!doc) return;

      const body = doc.body;
      const html = doc.documentElement;

      const contentHeight = Math.max(
        body?.scrollHeight ?? 0,
        body?.offsetHeight ?? 0,
        body?.clientHeight ?? 0,
        html?.scrollHeight ?? 0,
        html?.offsetHeight ?? 0,
        html?.clientHeight ?? 0
      );

      if (contentHeight > 0) {
        setIframeContentHeight(contentHeight);
      }

      if (isDesktop) {
        const availableWidth = Math.max(shellWidth - 32, 220);
        const nextScale = Math.min(1, availableWidth / previewViewportWidth);
        setPreviewScale(nextScale);
        return;
      }

      const maxDeviceWidth = isTablet ? 620 : 360;
      const nextScale = Math.min(1, maxDeviceWidth / previewViewportWidth);
      setPreviewScale(nextScale);
    }

    syncIframeSize();

    const timeout1 = window.setTimeout(syncIframeSize, 60);
    const timeout2 = window.setTimeout(syncIframeSize, 180);
    const timeout3 = window.setTimeout(syncIframeSize, 360);

    window.addEventListener("resize", syncIframeSize);

    return () => {
      window.clearTimeout(timeout1);
      window.clearTimeout(timeout2);
      window.clearTimeout(timeout3);
      window.removeEventListener("resize", syncIframeSize);
    };
  }, [previewDoc, previewViewportWidth, shellWidth, viewport, isDesktop, isTablet]);

  if (isDesktop) {
    const scaledHeight = Math.max(
      Math.round(iframeContentHeight * previewScale),
      220
    );

    return (
      <div
        className={cx(
          "mx-auto w-full transition-all duration-300",
          shellWidthClass
        )}
      >
        <div
          ref={shellRef}
          className="w-full rounded-[28px] border border-slate-200 bg-[#f6f8fc] p-2 lg:p-2.5"
        >
          <div
            className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.07)]"
            style={{ height: `${outerPreviewFixedHeight}px` }}
          >
            <div className="flex h-full items-center justify-center">
              <div
                className="mx-auto origin-top overflow-hidden rounded-[18px] bg-white"
                style={{
                  width: `${previewViewportWidth * previewScale}px`,
                  maxWidth: "100%",
                  height: `${scaledHeight}px`,
                  border: "1px solid rgba(226, 232, 240, 0.9)",
                }}
              >
                <iframe
                  key={viewport}
                  ref={iframeRef}
                  title="Block Detail Preview"
                  srcDoc={previewDoc}
                  className="block border-0 bg-white"
                  onLoad={() => {
                    const iframe = iframeRef.current;
                    if (!iframe) return;

                    const run = () => {
                      const doc = iframe.contentDocument;
                      if (!doc) return;

                      const body = doc.body;
                      const html = doc.documentElement;

                      const contentHeight = Math.max(
                        body?.scrollHeight ?? 0,
                        body?.offsetHeight ?? 0,
                        body?.clientHeight ?? 0,
                        html?.scrollHeight ?? 0,
                        html?.offsetHeight ?? 0,
                        html?.clientHeight ?? 0
                      );

                      if (contentHeight > 0) {
                        setIframeContentHeight(contentHeight);
                      }
                    };

                    run();
                    window.setTimeout(run, 60);
                    window.setTimeout(run, 180);
                    window.setTimeout(run, 360);
                  }}
                  style={{
                    width: `${previewViewportWidth}px`,
                    minWidth: `${previewViewportWidth}px`,
                    height: `${Math.max(iframeContentHeight, 200)}px`,
                    transform: `scale(${previewScale})`,
                    transformOrigin: "top left",
                    display: "block",
                  }}
                  scrolling="no"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const scaledDeviceWidth = Math.round(previewViewportWidth * previewScale);
  const scaledDeviceHeight = Math.round(deviceViewportHeight * previewScale);
  const scaledTopPadding = Math.max(Math.round(topPreviewPadding * previewScale), 18);

  return (
    <div
      className={cx(
        "mx-auto w-full transition-all duration-300",
        shellWidthClass
      )}
    >
      <div
        ref={shellRef}
        className="w-full rounded-[28px] border border-slate-200 bg-[#f6f8fc] p-2 lg:p-2.5"
      >
        <div
          className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.07)]"
          style={{ height: `${outerPreviewFixedHeight}px` }}
        >
          <div className="flex h-full items-center justify-center px-6 py-6">
            <div
              className={cx(
                "relative overflow-hidden bg-white shadow-[0_14px_35px_rgba(15,23,42,0.12)]",
                isMobile ? "rounded-[32px]" : "rounded-[26px]"
              )}
              style={{
                width: `${scaledDeviceWidth}px`,
                height: `${scaledDeviceHeight}px`,
                border: "1px solid rgba(226, 232, 240, 0.95)",
              }}
            >
              {isMobile ? (
                <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-1.5 w-20 -translate-x-1/2 rounded-full bg-slate-200" />
              ) : null}

              <div
                ref={deviceViewportRef}
                className="h-full w-full overflow-y-auto overflow-x-hidden bg-white"
              >
                <div
                  style={{
                    width: `${scaledDeviceWidth}px`,
                    height: `${scaledTopPadding + Math.max(Math.round(iframeContentHeight * previewScale), 1)}px`,
                    position: "relative",
                    paddingTop: `${scaledTopPadding}px`,
                    boxSizing: "border-box",
                    background: "#ffffff",
                  }}
                >
                  <iframe
                    key={viewport}
                    ref={iframeRef}
                    title="Block Detail Preview"
                    srcDoc={previewDoc}
                    className="block border-0 bg-white"
                    onLoad={() => {
                      const iframe = iframeRef.current;
                      if (!iframe) return;

                      const run = () => {
                        const doc = iframe.contentDocument;
                        if (!doc) return;

                        const body = doc.body;
                        const html = doc.documentElement;

                        const contentHeight = Math.max(
                          body?.scrollHeight ?? 0,
                          body?.offsetHeight ?? 0,
                          body?.clientHeight ?? 0,
                          html?.scrollHeight ?? 0,
                          html?.offsetHeight ?? 0,
                          html?.clientHeight ?? 0
                        );

                        if (contentHeight > 0) {
                          setIframeContentHeight(contentHeight);
                        }
                      };

                      run();
                      window.setTimeout(run, 60);
                      window.setTimeout(run, 180);
                      window.setTimeout(run, 360);
                    }}
                    style={{
                      width: `${previewViewportWidth}px`,
                      minWidth: `${previewViewportWidth}px`,
                      height: `${Math.max(iframeContentHeight, 200)}px`,
                      transform: `scale(${previewScale})`,
                      transformOrigin: "top left",
                      display: "block",
                    }}
                    scrolling="no"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlockDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id;

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return isRole(value) ? value : "admin";
  }, [searchParams]);

  const returnTo = searchParams.get("returnTo");

  const [loading, setLoading] = useState(true);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [block, setBlock] = useState<ApiBlockRecord | null>(null);

  useEffect(() => {
    async function loadBlock() {
      try {
        setLoading(true);

        const res = await fetch(`/api/blocks/${id}?role=${role}`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.block) {
          setBlock(null);
          return;
        }

        setBlock(json.block as ApiBlockRecord);
      } catch (error) {
        console.error("Failed to load block detail:", error);
        setBlock(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      void loadBlock();
    }
  }, [id, role]);

  const data = block?.data ?? null;
  const blockName = getBlockName(data, id);
  const componentName = getComponentName(data);
  const status = block?.status || "draft";

  const governance = useMemo(() => {
    if (!data) return null;
    return evaluateBlockGovernance(data);
  }, [data]);

  const requestedFields = useMemo(() => {
    if (!Array.isArray(block?.changesRequestedFields)) return [];
    return block.changesRequestedFields.filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0
    );
  }, [block?.changesRequestedFields]);

  const changesRequestedNotes =
    typeof block?.changesRequestedNotes === "string" &&
    block.changesRequestedNotes.trim()
      ? block.changesRequestedNotes.trim()
      : "";

  const hasChangesRequested = status === "changes_requested";

  const DEFAULT_BLOCK_IMAGE = "/farmerimage.jpg";

  const previewDoc = useMemo(() => {
    if (!data) return "<html><body></body></html>";

    const rawImageUrl =
      typeof data.imageUrl === "string" && data.imageUrl.trim()
        ? data.imageUrl
        : DEFAULT_BLOCK_IMAGE;

    let resolvedImageUrl = rawImageUrl;

    if (typeof window !== "undefined" && resolvedImageUrl) {
      const isAbsolute = /^https?:\/\//i.test(resolvedImageUrl);

      if (!isAbsolute) {
        const cleanPath = resolvedImageUrl.startsWith("/")
          ? resolvedImageUrl
          : `/${resolvedImageUrl}`;

        resolvedImageUrl = `${window.location.origin}${cleanPath}`;
      }
    }

    return makePreviewHtml({
      ...data,
      imageUrl: resolvedImageUrl,
    });
  }, [data]);

  const embedCode = useMemo(() => {
    if (!data) return "";

    const escapedPreview = previewDoc
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$\{/g, "\\${");

    return `<div id="visionir-block-${id}"></div>
<script>
(function () {
  var container = document.getElementById("visionir-block-${id}");
  if (!container) return;
  container.innerHTML = \`${escapedPreview}\`;
})();
</script>`;
  }, [previewDoc, data, id]);

  const contentSummary = useMemo(() => {
    const valuePoints = Array.isArray(
      (data as Record<string, unknown> | null)?.valuePoints
    )
      ? ((data as Record<string, unknown>).valuePoints as Array<{
          title?: string;
          text?: string;
        }>)
      : [];

    const design = (data as Record<string, unknown> | null)?.design as
      | Record<string, unknown>
      | undefined;

    return {
      eyebrow:
        typeof data?.eyebrow === "string" && data.eyebrow.trim()
          ? data.eyebrow
          : "—",
      headline:
        typeof data?.headline === "string" && data.headline.trim()
          ? data.headline
          : "—",
      subheading:
        typeof data?.subheading === "string" && data.subheading.trim()
          ? data.subheading
          : "—",
      valuePointCount: valuePoints.length,
      theme:
        typeof design?.theme === "string" && design.theme.trim()
          ? design.theme
          : "enterprise",
      layout:
        typeof design?.layout === "string" && design.layout.trim()
          ? design.layout
          : "split",
      cardStyle:
        typeof design?.cardStyle === "string" && design.cardStyle.trim()
          ? design.cardStyle
          : "soft",
    };
  }, [data]);

  async function handleCopyEmbedCode() {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch (error) {
      console.error("Failed to copy embed code:", error);
    }
  }

  async function handleDuplicateBlock() {
    if (!data) return;

    try {
      setIsDuplicating(true);

      const res = await fetch(`/api/blocks?role=${role}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data,
          status: "draft",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.block?.id) {
        throw new Error(json?.error || "Failed to duplicate block");
      }

      const nextReturnTo = returnTo
        ? `&returnTo=${encodeURIComponent(returnTo)}`
        : "";

      router.push(
        `/blocks/${json.block.id}/details?role=${role}&refresh=${Date.now()}${nextReturnTo}`
      );
    } catch (error) {
      console.error("Failed to duplicate block:", error);
      alert(
        error instanceof Error ? error.message : "Failed to duplicate block"
      );
    } finally {
      setIsDuplicating(false);
    }
  }

  async function handleResubmitForApproval() {
    try {
      setIsResubmitting(true);

      const res = await fetch(`/api/blocks/${id}?role=${role}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "pending_approval",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.block) {
        throw new Error(json?.error || "Failed to resubmit block");
      }

      router.push(
        withReturnTo(`/blocks/${id}/approval?role=${role}&refresh=${Date.now()}`)
      );
    } catch (error) {
      console.error("Failed to resubmit block:", error);
      alert(
        error instanceof Error ? error.message : "Failed to resubmit block"
      );
    } finally {
      setIsResubmitting(false);
    }
  }

  function handleBack() {
    if (returnTo) {
      router.push(returnTo);
      return;
    }

    router.push(`/blocks?role=${role}`);
  }

  function withReturnTo(path: string) {
    if (!returnTo) return path;
    const joiner = path.includes("?") ? "&" : "?";
    return `${path}${joiner}returnTo=${encodeURIComponent(returnTo)}`;
  }

  function handlePrimaryAction() {
    switch (status) {
      case "pending_approval":
      case "in_review":
        router.push(withReturnTo(`/blocks/${id}/approval?role=${role}`));
        break;
      case "approved":
        router.push(withReturnTo(`/blocks/${id}/deploy?role=${role}`));
        break;
      case "published":
      case "deployed":
      case "completed":
        router.push(withReturnTo(`/blocks/${id}/deploy/embed?role=${role}`));
        break;
      case "changes_requested":
      case "draft":
      case "generating":
      default:
        router.push(withReturnTo(`/blocks/${id}/review?role=${role}`));
        break;
    }
  }

  function getPrimaryActionLabel() {
    switch (status) {
      case "pending_approval":
      case "in_review":
        return "Open Approval";
      case "approved":
        return "Open Deployment";
      case "published":
      case "deployed":
      case "completed":
        return "Open Embed & Reuse";
      case "changes_requested":
        return "Address Changes";
      case "draft":
      case "generating":
      default:
        return "Continue Editing";
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-72px)] items-center justify-center bg-[#f4f7fb] text-slate-500">
        Loading block…
      </div>
    );
  }

  if (!block || !data) {
    return (
      <div className="flex min-h-[calc(100dvh-72px)] items-center justify-center bg-[#f4f7fb] text-slate-500">
        Block not found.
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto max-w-[1880px] px-5 py-5 lg:px-7 lg:py-6">
        <section className="rounded-[32px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_100%)] p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] lg:p-7">
          <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {returnTo ? "Back to Page" : "Back to Library"}
                </button>

                <span
                  className={cx(
                    "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ring-1",
                    getStatusPillClass(status)
                  )}
                >
                  {getStatusLabel(status)}
                </span>
              </div>

              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#4f6fff]">
                Block Detail
              </p>

              <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.05em] text-slate-900 lg:text-[40px]">
                {blockName}
              </h1>

              <p className="mt-3 max-w-[900px] text-sm leading-7 text-slate-500">
                A cleaner detail view for preview, governance, workflow history
                and deployment actions — designed so the preview is easy to read
                and the supporting information stays structured and secondary.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:max-w-[920px]">
                <StatTile label="Component" value={componentName} />
                <StatTile label="Owner" value={getOwnerName(block)} />
                <StatTile
                  label="Updated"
                  value={relativeUpdatedLabel(block.updatedAt)}
                />
                <StatTile
                  label="Governance"
                  value={
                    typeof governance?.score === "number"
                      ? `${governance.score}%`
                      : "—"
                  }
                />
              </div>
            </div>

            <div className="flex w-full max-w-[620px] flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3 2xl:justify-end">
                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5]"
                >
                  {getPrimaryActionLabel()}
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleDuplicateBlock}
                  disabled={isDuplicating}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Copy className="h-4 w-4" />
                  {isDuplicating ? "Duplicating…" : "Duplicate Block"}
                </button>

                {["published", "deployed", "completed"].includes(status) ? (
                  <button
                    type="button"
                    onClick={handleCopyEmbedCode}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Clipboard className="h-4 w-4" />
                    {copied ? "Embed Copied" : "Copy Embed Code"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {hasChangesRequested ? (
          <section className="mt-6 rounded-[30px] border border-rose-200 bg-[linear-gradient(180deg,#fff7f8_0%,#fff1f2_100%)] p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)] lg:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-rose-600">
                      Changes Requested
                    </p>
                    <h2 className="mt-1 text-[24px] font-semibold tracking-[-0.04em] text-slate-900">
                      This block needs updates before it can move forward.
                    </h2>
                    <p className="mt-2 max-w-[900px] text-sm leading-7 text-slate-600">
                      Review the requested changes below, update the block, and
                      resubmit it for approval once the feedback has been
                      addressed.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-[22px] border border-rose-200 bg-white px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Requested By
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {getUserLabel(block.changesRequestedByUserId)}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-rose-200 bg-white px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Requested At
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {formatDateTime(block.changesRequestedAt)}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-rose-200 bg-white px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Fields Marked
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {requestedFields.length > 0 ? String(requestedFields.length) : "General review"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex w-full max-w-[420px] flex-col gap-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push(withReturnTo(`/blocks/${id}/review?role=${role}`))
                  }
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5]"
                >
                  <PenSquare className="h-4 w-4" />
                  Edit Block
                </button>

                <button
                  type="button"
                  onClick={handleResubmitForApproval}
                  disabled={isResubmitting}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={cx("h-4 w-4", isResubmitting && "animate-spin")} />
                  {isResubmitting ? "Resubmitting…" : "Resubmit for Approval"}
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div className="rounded-[24px] border border-rose-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-rose-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Reviewer Notes
                  </h3>
                </div>

                <p className="text-sm leading-7 text-slate-700">
                  {changesRequestedNotes ||
                    "No additional review notes were added. Update the highlighted areas and resubmit the block for approval."}
                </p>
              </div>

              <div className="rounded-[24px] border border-rose-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-rose-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Requested Fields
                  </h3>
                </div>

                {requestedFields.length > 0 ? (
                  <div className="space-y-2">
                    {requestedFields.map((field) => (
                      <div
                        key={field}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
                      >
                        {formatFieldLabel(field)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-7 text-slate-700">
                    No specific fields were listed. Review the notes and make the
                    requested updates across the block before resubmitting.
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <Panel
              title="Governance Snapshot"
              subtitle="Core enterprise controls for this version."
              icon={<Shield className="h-5 w-5" />}
            >
              <div className="rounded-[24px] border border-[#dbe5ff] bg-[linear-gradient(135deg,#f8faff_0%,#eef3ff_100%)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4f6fff]">
                  Governance Score
                </p>

                <div className="mt-2.5 flex items-end justify-between gap-4">
                  <div className="text-[34px] font-semibold tracking-[-0.05em] text-slate-900">
                    {typeof governance?.score === "number"
                      ? `${governance.score}%`
                      : "—"}
                  </div>

                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#4f6fff] ring-1 ring-[#dbe5ff]">
                    Enterprise Ready
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  "Brand compliance aligned",
                  "WCAG AA accessibility target",
                  "Design tokens locked",
                  "Semantic structure validated",
                  "Mobile responsiveness checked",
                  "Restricted scripts protected",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3.5"
                  >
                    <span className="text-sm text-slate-700">{item}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-emerald-600">
                      <BadgeCheck className="h-4 w-4" />
                      Pass
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              title="Workflow"
              subtitle="Lifecycle milestones for this governed asset."
              icon={<Clock3 className="h-5 w-5" />}
            >
              <div>
                <TimelineItem
                  title="Created"
                  value={`${formatDateTime(block.createdAt)} by ${getOwnerName(
                    block
                  )}`}
                  active
                />
                <TimelineItem
                  title="Submitted"
                  value={
                    block.submittedAt
                      ? `${formatDateTime(block.submittedAt)} by ${getUserLabel(
                          block.submittedByUserId
                        )}`
                      : "Not yet submitted for approval"
                  }
                  active={Boolean(block.submittedAt)}
                />
                <TimelineItem
                  title="Changes Requested"
                  value={
                    block.changesRequestedAt
                      ? `${formatDateTime(block.changesRequestedAt)} by ${getUserLabel(
                          block.changesRequestedByUserId
                        )}`
                      : "No change request recorded"
                  }
                  active={Boolean(block.changesRequestedAt)}
                />
                <TimelineItem
                  title="Approved"
                  value={
                    block.approvedAt
                      ? `${formatDateTime(block.approvedAt)} by ${getUserLabel(
                          block.approvedByUserId
                        )}`
                      : "Not yet approved"
                  }
                  active={Boolean(block.approvedAt)}
                />
                <TimelineItem
                  title="Published"
                  value={
                    block.publishedAt
                      ? `${formatDateTime(block.publishedAt)} by ${getUserLabel(
                          block.publishedByUserId
                        )}`
                      : "Not yet published"
                  }
                  active={Boolean(block.publishedAt)}
                  isLast
                />
              </div>
            </Panel>

            <Panel
              title="Metadata"
              subtitle="Ownership and audit information."
              icon={<LayoutTemplate className="h-5 w-5" />}
            >
              <div>
                <MetaRow label="Block ID" value={block.id} />
                <MetaRow label="Component" value={componentName} />
                <MetaRow label="Status" value={getStatusLabel(status)} />
                <MetaRow label="Created By" value={getOwnerName(block)} />
                <MetaRow
                  label="Approved By"
                  value={getUserLabel(block.approvedByUserId)}
                />
                <MetaRow
                  label="Changes Requested By"
                  value={getUserLabel(block.changesRequestedByUserId)}
                />
                <MetaRow
                  label="Created At"
                  value={formatDateTime(block.createdAt)}
                />
                <MetaRow
                  label="Updated At"
                  value={formatDateTime(block.updatedAt)}
                />
              </div>
            </Panel>
          </aside>

          <main className="min-w-0 space-y-6">
            <Panel
              title="Live Preview"
              subtitle="Responsive preview aligned to desktop, tablet and mobile modes."
              icon={<Eye className="h-5 w-5" />}
              className="overflow-hidden"
            >
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewport("desktop")}
                    className={cx(
                      "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition",
                      viewport === "desktop"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Monitor className="h-4 w-4" />
                    Desktop
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewport("tablet")}
                    className={cx(
                      "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition",
                      viewport === "tablet"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Tablet className="h-4 w-4" />
                    Tablet
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewport("mobile")}
                    className={cx(
                      "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition",
                      viewport === "mobile"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Smartphone className="h-4 w-4" />
                    Mobile
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(withReturnTo(`/blocks/${id}/review?role=${role}`))
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <PenSquare className="h-4 w-4" />
                    Review
                  </button>

                  {["pending_approval", "in_review"].includes(status) ? (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(withReturnTo(`/blocks/${id}/approval?role=${role}`))
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approval
                    </button>
                  ) : null}

                  {["approved", "published", "deployed", "completed"].includes(
                    status
                  ) ? (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(withReturnTo(`/blocks/${id}/deploy?role=${role}`))
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <Sparkles className="h-4 w-4" />
                      Deployment
                    </button>
                  ) : null}

                  {hasChangesRequested ? (
                    <button
                      type="button"
                      onClick={handleResubmitForApproval}
                      disabled={isResubmitting}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCw className={cx("h-4 w-4", isResubmitting && "animate-spin")} />
                      {isResubmitting ? "Resubmitting…" : "Resubmit"}
                    </button>
                  ) : null}
                </div>
              </div>

              <PreviewCanvas
                key={viewport}
                previewDoc={previewDoc}
                viewport={viewport}
              />
            </Panel>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Panel
                title="Content Summary"
                subtitle="Core content and design setup used in this block."
                icon={<FileText className="h-5 w-5" />}
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Eyebrow
                    </p>
                    <p className="mt-2.5 text-sm leading-6 text-slate-700">
                      {contentSummary.eyebrow}
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Headline
                    </p>
                    <p className="mt-2.5 text-sm font-semibold leading-6 text-slate-900">
                      {contentSummary.headline}
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Subheading
                    </p>
                    <p className="mt-2.5 text-sm leading-6 text-slate-700">
                      {contentSummary.subheading}
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Value Points
                    </p>
                    <p className="mt-2.5 text-sm font-medium text-slate-900">
                      {contentSummary.valuePointCount}
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Theme / Layout
                    </p>
                    <p className="mt-2.5 text-sm font-medium text-slate-900">
                      {contentSummary.theme} / {contentSummary.layout}
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Card Style
                    </p>
                    <p className="mt-2.5 text-sm font-medium text-slate-900">
                      {contentSummary.cardStyle}
                    </p>
                  </div>
                </div>
              </Panel>

              <Panel
                title="Deployment & Reuse"
                subtitle="Primary rollout actions for this block."
                icon={<Wand2 className="h-5 w-5" />}
              >
                <div className="space-y-3">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Deployment Readiness
                    </p>
                    <p className="mt-2.5 text-sm leading-6 text-slate-700">
                      {["published", "deployed", "completed"].includes(status)
                        ? "This block is deployment-ready and can be reused through the embed workflow."
                        : "This block is still moving through workflow and is not yet deployment-ready."}
                    </p>
                  </div>

                  {["published", "deployed", "completed"].includes(status) ? (
                    <>
                      <button
                        type="button"
                        onClick={handleCopyEmbedCode}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5]"
                      >
                        <Clipboard className="h-4 w-4" />
                        {copied ? "Embed Code Copied" : "Copy Embed Code"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            withReturnTo(`/blocks/${id}/deploy/embed?role=${role}`)
                          )
                        }
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Sparkles className="h-4 w-4" />
                        Open Embed Instructions
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePrimaryAction}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 text-sm font-medium text-white shadow-[0_14px_28px_rgba(91,124,255,0.22)] transition hover:bg-[#4c6ff5]"
                    >
                      <ArrowRight className="h-4 w-4" />
                      {getPrimaryActionLabel()}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDuplicateBlock}
                    disabled={isDuplicating}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Copy className="h-4 w-4" />
                    {isDuplicating ? "Duplicating…" : "Duplicate as New Version"}
                  </button>
                </div>
              </Panel>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}