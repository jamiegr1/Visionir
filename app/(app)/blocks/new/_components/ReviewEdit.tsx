"use client";

import type { GovernanceResult } from "@/lib/brand-governance";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Accent, ValuePoint, BlockData } from "@/lib/types";

type Governance = GovernanceResult | null;

export type ChangeLogItem = {
  id: string;
  label: string;
  from: string;
  to: string;
  time: string;
};

export type ReviewEditProps = {
  editable: BlockData;
  setEditable: Dispatch<SetStateAction<BlockData | null>>;
  previewDoc: string;
  describe: string;
  setDescribe: (value: string) => void;
  improveField: (
    field: string,
    text: string,
    apply: (improved: string) => void
  ) => Promise<void>;
  requestDescribeChanges: () => Promise<void>;
  pendingPatchExists?: boolean;
  governance?: Governance;
  onSaveDraft?: () => void;
  onSubmitApproval?: () => void;
  onPublish?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  aiImprovedFields?: Record<string, boolean>;
  onResetAiImproved?: (key: string) => void;
  submitLabel?: string;
  publishLabel?: string;
  changeLog?: ChangeLogItem[];
  canEdit?: boolean;
  canSubmit?: boolean;
  canPublish?: boolean;

  mode?: "standard" | "page_builder";
  onBack?: () => void;
  backLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  primaryActionDisabled?: boolean;

  changesRequestedInfo?: {
    requestedBy?: string;
    requestedAt?: string;
    notes?: string;
    fields?: string[];
  } | null;
};

const ACCENT_STYLES: Record<
  Accent,
  {
    dot: string;
    soft: string;
    border: string;
    text: string;
    ring: string;
  }
> = {
  blue: {
    dot: "bg-blue-500",
    soft: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    ring: "ring-blue-500/20",
  },
  green: {
    dot: "bg-emerald-500",
    soft: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    ring: "ring-emerald-500/20",
  },
  orange: {
    dot: "bg-amber-500",
    soft: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    ring: "ring-amber-500/20",
  },
  purple: {
    dot: "bg-violet-500",
    soft: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    ring: "ring-violet-500/20",
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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

function ImproveButton({
  busy,
  improved,
  disabled,
  onClick,
}: {
  busy: boolean;
  improved: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "group relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full px-3.5 py-2 text-[12px] font-medium tracking-[-0.01em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        busy
          ? "border border-[#dbe5ff] bg-[#f5f8ff] text-[#3f5ed7] shadow-[0_6px_20px_rgba(79,108,255,0.10)]"
          : improved
            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[0_6px_18px_rgba(16,185,129,0.10)]"
            : "border border-slate-200 bg-white text-slate-700 hover:border-[#cfd8f6] hover:bg-[#f8faff] hover:text-[#3554d1] hover:shadow-[0_8px_22px_rgba(79,108,255,0.08)]"
      )}
    >
      {busy && (
        <span className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.55),transparent)]" />
      )}

      <span className="relative z-[1] flex items-center gap-2">
        {busy ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#c8d6ff] border-t-[#4f6fff]" />
            Improving
          </>
        ) : improved ? (
          <>
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M5 12.5 9.2 16.7 19 7.5" />
            </svg>
            AI Improved
          </>
        ) : (
          <>
            <svg
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
            >
              <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
            </svg>
            Improve with AI
          </>
        )}
      </span>
    </button>
  );
}

function HistoryButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "group flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200",
        disabled
          ? "cursor-not-allowed border-[#e7ebf3] bg-[#f7f9fc] text-[#b6beca]"
          : "border-[#e2e8f5] bg-white text-[#64748b] shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:-translate-y-[1px] hover:border-[#d3dcf5] hover:text-[#1e293b] hover:shadow-[0_6px_16px_rgba(79,111,255,0.10)] active:translate-y-0 active:scale-[0.96]"
      )}
    >
      <span
        className={cx(
          "flex items-center justify-center transition-all duration-200",
          disabled
            ? "opacity-60"
            : "group-hover:scale-105 group-hover:text-[#4f6fff]"
        )}
      >
        {children}
      </span>
    </button>
  );
}

export default function ReviewEdit({
  editable,
  setEditable,
  previewDoc,
  describe,
  setDescribe,
  improveField,
  requestDescribeChanges,
  pendingPatchExists,
  governance,
  onSaveDraft,
  onSubmitApproval,
  onPublish,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  aiImprovedFields = {},
  onResetAiImproved,
  submitLabel = "Submit for Approval",
  publishLabel = "Publish to CMS",
  changeLog = [],
  canEdit = true,
  canSubmit = true,
  canPublish = false,
  mode = "standard",
  onBack,
  backLabel = "Back",
  onPrimaryAction,
  primaryActionLabel = "Done",
  primaryActionDisabled = false,
  changesRequestedInfo = null,
}: ReviewEditProps) {
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [describeBusy, setDescribeBusy] = useState(false);
  const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );
  const [flashFields, setFlashFields] = useState<Record<string, boolean>>({});

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const measureTimeoutsRef = useRef<number[]>([]);
  const flashTimeoutsRef = useRef<Record<string, number>>({});
  const [iframeContentHeight, setIframeContentHeight] = useState(560);

  const complianceLabel = useMemo(() => {
    if (!governance) return "Brand Compliance: Pending";
    return `Brand Compliance: ${governance.score}% ✓`;
  }, [governance]);

  const isPageBuilderMode = mode === "page_builder";
  const hasChangesRequestedInfo =
    !!changesRequestedInfo &&
    (!!changesRequestedInfo.notes ||
      !!changesRequestedInfo.requestedAt ||
      !!changesRequestedInfo.requestedBy ||
      (changesRequestedInfo.fields?.length ?? 0) > 0);

  function markFieldImproved(key: string) {
    setFlashFields((prev) => ({ ...prev, [key]: true }));

    const existingTimeout = flashTimeoutsRef.current[key];
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }

    flashTimeoutsRef.current[key] = window.setTimeout(() => {
      setFlashFields((prev) => ({ ...prev, [key]: false }));
    }, 850);
  }

  async function runImprove(
    key: string,
    field: string,
    text: string,
    apply: (improved: string) => void
  ) {
    if (!canEdit) return;
    if (!text.trim()) return;

    try {
      setLoadingField(key);
      await improveField(field, text, (improved) => {
        apply(improved);
        markFieldImproved(key);
      });
    } finally {
      setLoadingField(null);
    }
  }

  async function runDescribeChanges() {
    if (!canEdit) return;

    try {
      setDescribeBusy(true);
      await requestDescribeChanges();
    } finally {
      setDescribeBusy(false);
    }
  }

  function updateRootField<K extends keyof BlockData>(key: K, value: BlockData[K]) {
    if (!canEdit) return;

    onResetAiImproved?.(String(key));

    setEditable((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
  }

  function updateValuePoint(
    index: number,
    updates: Partial<ValuePoint>,
    improvedKeysToReset: string[] = []
  ) {
    if (!canEdit) return;

    improvedKeysToReset.forEach((key) => onResetAiImproved?.(key));

    setEditable((prev) => {
      if (!prev) return prev;

      const currentValuePoints = prev.valuePoints ?? [];
      const next = [...currentValuePoints];

      if (!next[index]) {
        next[index] = {
          title: "",
          text: "",
          accent: "blue",
        };
      }

      next[index] = { ...next[index], ...updates };

      return { ...prev, valuePoints: next };
    });
  }

  const valuePoints = editable.valuePoints ?? [];

  const shellWidthClass =
    viewport === "mobile"
      ? "max-w-[410px]"
      : viewport === "tablet"
        ? "max-w-[760px]"
        : "max-w-[1240px]";

  const previewViewportWidth =
    viewport === "mobile" ? 360 : viewport === "tablet" ? 680 : 1180;

  const desktopViewportHeight = 560;
  const tabletViewportHeight = 980;
  const mobileViewportHeight = 1180;

  function clearMeasureTimeouts() {
    measureTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    measureTimeoutsRef.current = [];
  }

  function syncIframeHeight() {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;

      const body = doc.body;
      const html = doc.documentElement;

      const height = Math.max(
        body?.scrollHeight || 0,
        body?.offsetHeight || 0,
        body?.clientHeight || 0,
        html?.scrollHeight || 0,
        html?.offsetHeight || 0,
        html?.clientHeight || 0
      );

      if (height > 0) {
        setIframeContentHeight(height);
      }
    } catch {
      //
    }
  }

  function syncIframeHeightRepeated() {
    clearMeasureTimeouts();
    syncIframeHeight();

    const delays = [40, 120, 240, 500, 900];
    measureTimeoutsRef.current = delays.map((delay) =>
      window.setTimeout(() => {
        syncIframeHeight();
      }, delay)
    );
  }

  useEffect(() => {
    setIframeContentHeight(
      viewport === "desktop"
        ? desktopViewportHeight
        : viewport === "tablet"
          ? tabletViewportHeight
          : mobileViewportHeight
    );

    const id = window.setTimeout(() => {
      syncIframeHeightRepeated();
    }, 30);

    return () => {
      window.clearTimeout(id);
      clearMeasureTimeouts();
    };
  }, [previewDoc, viewport]);

  useEffect(() => {
    return () => {
      Object.values(flashTimeoutsRef.current).forEach((timeoutId) =>
        window.clearTimeout(timeoutId)
      );
    };
  }, []);

  const previewCanvasHeight =
    viewport === "desktop"
      ? "min(560px, calc(100dvh - 356px))"
      : "min(620px, calc(100dvh - 336px))";

  return (
    <div className="h-[calc(100dvh-72px)] overflow-hidden bg-[#f5f7fb] text-slate-900">
      <div className="flex h-[calc(100dvh-72px)] overflow-hidden">
        <aside className="w-full max-w-[360px] shrink-0 border-r border-slate-200 bg-white">
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-slate-200 px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
                    Refine with AI
                  </h2>
                  {isPageBuilderMode ? (
                    <p className="mt-1 text-sm text-slate-500">
                      Make direct text and imagery edits, or request broader structural changes.
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={runDescribeChanges}
                  disabled={!canEdit || describeBusy || !describe.trim()}
                  className="rounded-2xl bg-[#eef3ff] px-4 py-2 text-sm font-medium text-[#5b7cff] transition hover:bg-[#e7eeff] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {describeBusy ? "Applying..." : "Request Changes"}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 pr-3">
              {hasChangesRequestedInfo ? (
                <section className="mb-8">
                  <div className="rounded-3xl border border-rose-200 bg-[linear-gradient(180deg,#fff7f8_0%,#fff1f2_100%)] p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                    <div className="mb-3 flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-600">
                        <svg
                          className="h-4.5 w-4.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 9v4" />
                          <path d="M12 17h.01" />
                          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                        </svg>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-600">
                          Changes Requested
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          Keep this feedback visible while editing so the block can
                          be updated and resubmitted correctly.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {(changesRequestedInfo?.requestedBy ||
                        changesRequestedInfo?.requestedAt) && (
                        <div className="rounded-2xl border border-rose-200 bg-white px-4 py-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Requested By
                              </p>
                              <p className="mt-1 text-sm text-slate-800">
                                {changesRequestedInfo?.requestedBy || "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Requested At
                              </p>
                              <p className="mt-1 text-sm text-slate-800">
                                {changesRequestedInfo?.requestedAt || "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="rounded-2xl border border-rose-200 bg-white px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Notes
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {changesRequestedInfo?.notes?.trim()
                            ? changesRequestedInfo.notes
                            : "No additional notes were added. Review the requested fields and update the block before resubmitting."}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-rose-200 bg-white px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Requested Fields
                        </p>

                        {changesRequestedInfo?.fields &&
                        changesRequestedInfo.fields.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {changesRequestedInfo.fields.map((field) => (
                              <span
                                key={field}
                                className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[12px] font-medium text-rose-700"
                              >
                                {formatFieldLabel(field)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-slate-700">
                            General review requested.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="mb-8">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                  <div className="mb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                      Describe Changes
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Update tone, colour, layout, visual style and copy.
                    </p>
                  </div>

                  <textarea
                    value={describe}
                    onChange={(e) => setDescribe(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Use our blue for all four cards, make the heading more strategic, tighten the copy and make the design more corporate."
                    className="min-h-[122px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </section>

              <section className="mb-8">
                <h3 className="mb-4 text-[15px] font-semibold text-slate-900">
                  Content
                </h3>

                <div className="space-y-4">
                  <div
                    className={cx(
                      "rounded-3xl border bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-700 ease-out",
                      flashFields["eyebrow"]
                        ? "border-emerald-200 bg-[linear-gradient(180deg,#f8fffb_0%,#eefcf4_100%)] ring-4 ring-emerald-100/80 shadow-[0_10px_30px_rgba(16,185,129,0.08)]"
                        : "border-slate-200"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-slate-800">
                        Eyebrow
                      </label>
                      <ImproveButton
                        busy={loadingField === "eyebrow"}
                        improved={!!aiImprovedFields["eyebrow"]}
                        disabled={!canEdit || loadingField === "eyebrow"}
                        onClick={() =>
                          runImprove(
                            "eyebrow",
                            "eyebrow",
                            editable.eyebrow ?? "",
                            (improved) =>
                              setEditable((prev) =>
                                prev ? { ...prev, eyebrow: improved } : prev
                              )
                          )
                        }
                      />
                    </div>

                    <input
                      value={editable.eyebrow ?? ""}
                      disabled={!canEdit}
                      onChange={(e) => updateRootField("eyebrow", e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div
                    className={cx(
                      "rounded-3xl border bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-700 ease-out",
                      flashFields["headline"]
                        ? "border-emerald-200 bg-[linear-gradient(180deg,#f8fffb_0%,#eefcf4_100%)] ring-4 ring-emerald-100/80 shadow-[0_10px_30px_rgba(16,185,129,0.08)]"
                        : "border-slate-200"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-slate-800">
                        Primary Headline
                      </label>
                      <ImproveButton
                        busy={loadingField === "headline"}
                        improved={!!aiImprovedFields["headline"]}
                        disabled={!canEdit || loadingField === "headline"}
                        onClick={() =>
                          runImprove(
                            "headline",
                            "headline",
                            editable.headline ?? "",
                            (improved) =>
                              setEditable((prev) =>
                                prev ? { ...prev, headline: improved } : prev
                              )
                          )
                        }
                      />
                    </div>

                    <input
                      value={editable.headline ?? ""}
                      disabled={!canEdit}
                      onChange={(e) => updateRootField("headline", e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div
                    className={cx(
                      "rounded-3xl border bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-700 ease-out",
                      flashFields["subheading"]
                        ? "border-emerald-200 bg-[linear-gradient(180deg,#f8fffb_0%,#eefcf4_100%)] ring-4 ring-emerald-100/80 shadow-[0_10px_30px_rgba(16,185,129,0.08)]"
                        : "border-slate-200"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-slate-800">
                        Subheading
                      </label>
                      <ImproveButton
                        busy={loadingField === "subheading"}
                        improved={!!aiImprovedFields["subheading"]}
                        disabled={!canEdit || loadingField === "subheading"}
                        onClick={() =>
                          runImprove(
                            "subheading",
                            "subheading",
                            editable.subheading ?? "",
                            (improved) =>
                              setEditable((prev) =>
                                prev ? { ...prev, subheading: improved } : prev
                              )
                          )
                        }
                      />
                    </div>

                    <textarea
                      value={editable.subheading ?? ""}
                      disabled={!canEdit}
                      onChange={(e) => updateRootField("subheading", e.target.value)}
                      className="min-h-[104px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h3 className="mb-4 text-[15px] font-semibold text-slate-900">
                  Value Points
                </h3>

                <div className="space-y-4">
                  {valuePoints.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400">
                      No value points available for this block yet.
                    </div>
                  ) : (
                    valuePoints.map((point, index) => {
                      const safeAccent: Accent =
                        point?.accent && ACCENT_STYLES[point.accent]
                          ? point.accent
                          : "blue";

                      const accent = ACCENT_STYLES[safeAccent];
                      const improveKeyTitle = `value-title-${index}`;
                      const improveKeyText = `value-text-${index}`;

                      return (
                        <div
                          key={index}
                          className={cx(
                            "rounded-3xl border bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-700 ease-out",
                            flashFields[improveKeyTitle] || flashFields[improveKeyText]
                              ? "border-emerald-200 bg-[linear-gradient(180deg,#f8fffb_0%,#eefcf4_100%)] ring-4 ring-emerald-100/80 shadow-[0_10px_30px_rgba(16,185,129,0.08)]"
                              : "border-slate-200"
                          )}
                        >
                          <div className="mb-4 flex items-center gap-2">
                            <span className={cx("h-2.5 w-2.5 rounded-full", accent.dot)} />
                            <span className="text-sm font-medium text-slate-800">
                              Value Point {index + 1}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div className="rounded-2xl transition-all duration-300">
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  Title
                                </label>
                                <ImproveButton
                                  busy={loadingField === improveKeyTitle}
                                  improved={!!aiImprovedFields[improveKeyTitle]}
                                  disabled={!canEdit || loadingField === improveKeyTitle}
                                  onClick={() =>
                                    runImprove(
                                      improveKeyTitle,
                                      `valuePointTitle:${index}`,
                                      point.title ?? "",
                                      (improved) =>
                                        updateValuePoint(index, { title: improved })
                                    )
                                  }
                                />
                              </div>

                              <input
                                value={point.title ?? ""}
                                disabled={!canEdit}
                                onChange={(e) =>
                                  updateValuePoint(
                                    index,
                                    { title: e.target.value },
                                    [improveKeyTitle]
                                  )
                                }
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                              />
                            </div>

                            <div className="rounded-2xl transition-all duration-300">
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  Copy
                                </label>
                                <ImproveButton
                                  busy={loadingField === improveKeyText}
                                  improved={!!aiImprovedFields[improveKeyText]}
                                  disabled={!canEdit || loadingField === improveKeyText}
                                  onClick={() =>
                                    runImprove(
                                      improveKeyText,
                                      `valuePointText:${index}`,
                                      point.text ?? "",
                                      (improved) =>
                                        updateValuePoint(index, { text: improved })
                                    )
                                  }
                                />
                              </div>

                              <textarea
                                value={point.text ?? ""}
                                disabled={!canEdit}
                                onChange={(e) =>
                                  updateValuePoint(
                                    index,
                                    { text: e.target.value },
                                    [improveKeyText]
                                  )
                                }
                                className="min-h-[86px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Accent
                              </label>
                              <div className="grid grid-cols-4 gap-2">
                                {(["blue", "green", "orange", "purple"] as Accent[]).map(
                                  (accentOption) => {
                                    const accentStyle = ACCENT_STYLES[accentOption];
                                    const active = safeAccent === accentOption;

                                    return (
                                      <button
                                        key={accentOption}
                                        type="button"
                                        disabled={!canEdit}
                                        onClick={() =>
                                          updateValuePoint(index, {
                                            accent: accentOption,
                                          })
                                        }
                                        className={cx(
                                          "rounded-2xl border px-2 py-2 text-xs font-medium capitalize transition disabled:cursor-not-allowed disabled:opacity-60",
                                          active
                                            ? `${accentStyle.soft} ${accentStyle.border} ${accentStyle.text} ring-2 ${accentStyle.ring}`
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        )}
                                      >
                                        {accentOption}
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="mt-2">
                <h3 className="mb-4 text-[15px] font-semibold text-slate-900">
                  Change Log
                </h3>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Recent Changes
                    </p>
                    <span className="text-xs text-slate-400">
                      {changeLog.length} {changeLog.length === 1 ? "update" : "updates"}
                    </span>
                  </div>

                  {changeLog.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-400">
                      No changes yet. Edits made on this page will appear here.
                    </div>
                  ) : (
                    <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                      {changeLog.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <p className="text-sm font-medium text-slate-800">
                              {item.label}
                            </p>
                            <span className="shrink-0 text-[11px] text-slate-400">
                              {item.time}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="rounded-xl bg-white px-3 py-2">
                              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Before
                              </span>
                              <p className="text-xs leading-5 text-slate-500">
                                {item.from}
                              </p>
                            </div>

                            <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-500">
                                After
                              </span>
                              <p className="text-xs leading-5 text-slate-700">
                                {item.to}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </aside>

        <main className="grid min-w-0 flex-1 min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-[#f5f7fb]">
          <div className="shrink-0 border-b border-slate-200 bg-[#f5f7fb] px-8 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {onBack ? (
                  <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12.5 4.5 7 10l5.5 5.5" />
                    </svg>
                    {backLabel}
                  </button>
                ) : null}

                <div className="inline-flex items-center gap-2 rounded-[20px] border border-[#dde5f2] bg-white/90 p-1.5 shadow-[0_10px_32px_rgba(15,23,42,0.06)] backdrop-blur">
                  <HistoryButton label="Undo" disabled={!canUndo} onClick={onUndo}>
                    <svg
                      className="h-[15px] w-[15px]"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M8 5 3.5 10 8 15" />
                      <path d="M4 10h7.25c3.18 0 5.75 2.57 5.75 5.75" />
                    </svg>
                  </HistoryButton>

                  <div className="h-6 w-px bg-[#e7edf6]" />

                  <HistoryButton label="Redo" disabled={!canRedo} onClick={onRedo}>
                    <svg
                      className="h-[15px] w-[15px]"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5 16.5 10 12 15" />
                      <path d="M16 10H8.75A5.75 5.75 0 0 0 3 15.75" />
                    </svg>
                  </HistoryButton>
                </div>

                <div>
                  <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
                    {isPageBuilderMode
                      ? "Edit Block for Page Builder"
                      : "Create Block • Step 3 of 3 - Review & Edit"}
                  </h1>
                  {isPageBuilderMode ? (
                    <p className="mt-1 text-sm text-slate-500">
                      Refine this block for the selected page section.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewport("mobile")}
                  className={cx(
                    "rounded-2xl border px-3 py-2 text-sm transition",
                    viewport === "mobile"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  )}
                >
                  Mobile
                </button>
                <button
                  type="button"
                  onClick={() => setViewport("tablet")}
                  className={cx(
                    "rounded-2xl border px-3 py-2 text-sm transition",
                    viewport === "tablet"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  )}
                >
                  Tablet
                </button>
                <button
                  type="button"
                  onClick={() => setViewport("desktop")}
                  className={cx(
                    "rounded-2xl border px-3 py-2 text-sm transition",
                    viewport === "desktop"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  )}
                >
                  Desktop
                </button>
              </div>
            </div>
          </div>

          <div className="min-h-0 overflow-hidden px-8 py-5">
            <div className="flex h-full min-h-0 flex-col">
              {pendingPatchExists && (
                <div className="mb-4 shrink-0 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  This block has been submitted and is now pending approval.
                </div>
              )}

              {!canEdit && (
                <div className="mb-4 shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  This block is currently read-only for your role and its current status.
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-hidden">
                <div className="flex h-full items-center justify-center">
                  <div
                    className={cx(
                      "w-full rounded-[40px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]",
                      shellWidthClass
                    )}
                  >
                    <div
                      className={cx(
                        "rounded-[28px] bg-white",
                        viewport === "desktop"
                          ? "overflow-hidden"
                          : "overflow-y-auto overflow-x-hidden"
                      )}
                      style={{ height: previewCanvasHeight }}
                    >
                      <div
                        className={cx(
                          "flex min-h-full justify-center",
                          viewport === "tablet" ? "items-start py-6" : "items-start"
                        )}
                      >
                        <iframe
                          key={viewport}
                          ref={iframeRef}
                          title="Block Preview"
                          srcDoc={previewDoc}
                          onLoad={syncIframeHeightRepeated}
                          className="block border-0 bg-white align-top"
                          style={{
                            width: `${previewViewportWidth}px`,
                            minWidth: `${previewViewportWidth}px`,
                            height:
                              viewport === "desktop"
                                ? `${desktopViewportHeight}px`
                                : `${Math.max(iframeContentHeight, 200)}px`,
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

          <div className="shrink-0 border-t border-slate-200 bg-[#f5f7fb] px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                <span>{complianceLabel}</span>
                <span>Accessibility: WCAG AA ✓</span>
                <span>Design Tokens: Locked</span>
              </div>

              <div className="flex items-center gap-3">
                {canEdit && onSaveDraft && !isPageBuilderMode && (
                  <button
                    type="button"
                    onClick={onSaveDraft}
                    className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Save Draft
                  </button>
                )}

                {canSubmit && onSubmitApproval && (
                  <button
                    type="button"
                    onClick={onSubmitApproval}
                    className="rounded-2xl bg-[#5b7cff] px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#1f36b8] active:bg-[#2642c7]"
                  >
                    {submitLabel}
                  </button>
                )}

                {onPrimaryAction ? (
                  <button
                    type="button"
                    onClick={onPrimaryAction}
                    disabled={primaryActionDisabled}
                    className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {primaryActionLabel}
                  </button>
                ) : null}

                {canPublish && onPublish && (
                  <button
                    type="button"
                    onClick={onPublish}
                    className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-emerald-700 active:bg-emerald-800"
                  >
                    {publishLabel}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}