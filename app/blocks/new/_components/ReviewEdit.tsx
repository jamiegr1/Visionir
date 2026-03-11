"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Accent, ValuePoint, BlockData } from "@/lib/types";
import Image from "next/image";

type Governance =
  | {
      score: number;
      checks: Array<{ id: string; label: string; ok: boolean }>;
      bannedHit?: string | null;
    }
  | null;

type ChangeLogItem = {
  id: string;
  label: string;
  from: string;
  to: string;
  time: string;
};

type ReviewEditProps = {
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
  submitLabel?: string;
  changeLog?: ChangeLogItem[];
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

function NavIcon({
  active = false,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={cx(
        "flex h-11 w-11 items-center justify-center rounded-xl transition",
        active
          ? "bg-[#eef3ff] text-[#5b7cff] shadow-sm"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      )}
    >
      {children}
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
  submitLabel = "Submit for Approval",
  changeLog = [],
}: ReviewEditProps) {
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [describeBusy, setDescribeBusy] = useState(false);
  const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const measureTimeoutsRef = useRef<number[]>([]);
  const [iframeContentHeight, setIframeContentHeight] = useState(560);

  const complianceLabel = useMemo(() => {
    if (!governance) return "Brand Compliance: Pending";
    return `Brand Compliance: ${governance.score}% ✓`;
  }, [governance]);

  async function runImprove(
    key: string,
    field: string,
    text: string,
    apply: (improved: string) => void
  ) {
    try {
      setLoadingField(key);
      await improveField(field, text, apply);
    } finally {
      setLoadingField(null);
    }
  }

  async function runDescribeChanges() {
    try {
      setDescribeBusy(true);
      await requestDescribeChanges();
    } finally {
      setDescribeBusy(false);
    }
  }

  function updateValuePoint(index: number, updates: Partial<ValuePoint>) {
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
      ? "max-w-[430px]"
      : viewport === "tablet"
      ? "max-w-[860px]"
      : "max-w-[1240px]";

  const previewViewportWidth =
    viewport === "mobile" ? 390 : viewport === "tablet" ? 820 : 1180;

  const previewViewportHeight =
    viewport === "mobile" ? 780 : viewport === "tablet" ? 760 : 560;

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
        setIframeContentHeight(height + 24);
      }
    } catch {
      // ignore measurement issues
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
      viewport === "desktop" ? 560 : viewport === "tablet" ? 760 : 780
    );

    const id = window.setTimeout(() => {
      syncIframeHeightRepeated();
    }, 30);

    return () => {
      window.clearTimeout(id);
      clearMeasureTimeouts();
    };
  }, [previewDoc, viewport]);

  return (
    <div className="h-screen overflow-hidden bg-[#f5f7fb] text-slate-900">
      <div className="flex h-screen">
        <aside className="flex w-[74px] shrink-0 flex-col items-center border-r border-slate-200 bg-white py-5">
          <div className="mb-8 flex items-center justify-center">
            <div className="relative h-10 w-10">
              <Image
                src="/visionirlogo.png"
                alt="Visionir"
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center gap-3">
            <NavIcon active>
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="4" y="4" width="16" height="16" rx="4" />
                <path d="M8 12h8M12 8v8" />
              </svg>
            </NavIcon>

            <NavIcon>
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 7h16M7 4v16" />
              </svg>
            </NavIcon>

            <NavIcon>
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="4" y="5" width="16" height="14" rx="3" />
                <path d="M8 9h8M8 13h5" />
              </svg>
            </NavIcon>

            <NavIcon>
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M7 3v4M17 3v4M4 9h16" />
                <rect x="4" y="5" width="16" height="15" rx="3" />
              </svg>
            </NavIcon>

            <NavIcon>
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20a7 7 0 0 1 14 0" />
              </svg>
            </NavIcon>

            <NavIcon>
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M5 7h14M5 12h14M5 17h8" />
              </svg>
            </NavIcon>
          </div>

          <div className="mt-4">
            <NavIcon>
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4" />
                <path d="M12 17h.01" />
              </svg>
            </NavIcon>
          </div>
        </aside>

        <aside className="w-full max-w-[360px] shrink-0 border-r border-slate-200 bg-white">
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-slate-200 px-6 py-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
                  Refine with AI
                </h2>

                <button
                  type="button"
                  onClick={runDescribeChanges}
                  disabled={describeBusy || !describe.trim()}
                  className="rounded-2xl bg-[#eef3ff] px-4 py-2 text-sm font-medium text-[#5b7cff] transition hover:bg-[#e7eeff] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {describeBusy ? "Applying..." : "Request Changes"}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
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
                    placeholder="Use Kiwa blue for all four cards, make the heading more strategic, tighten the copy and make the design more corporate."
                    className="min-h-[122px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                  />
                </div>
              </section>

              <section className="mb-8">
                <h3 className="mb-4 text-[15px] font-semibold text-slate-900">
                  Content
                </h3>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-slate-800">
                        Eyebrow
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          runImprove("eyebrow", "eyebrow", editable.eyebrow ?? "", (improved) =>
                            setEditable((prev) =>
                              prev ? { ...prev, eyebrow: improved } : prev
                            )
                          )
                        }
                        disabled={loadingField === "eyebrow"}
                        className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        {loadingField === "eyebrow" ? "Improving..." : "✦ Improve with AI"}
                      </button>
                    </div>

                    <input
                      value={editable.eyebrow ?? ""}
                      onChange={(e) =>
                        setEditable((prev) =>
                          prev ? { ...prev, eyebrow: e.target.value } : prev
                        )
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                    />
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-slate-800">
                        Primary Headline
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          runImprove("headline", "headline", editable.headline ?? "", (improved) =>
                            setEditable((prev) =>
                              prev ? { ...prev, headline: improved } : prev
                            )
                          )
                        }
                        disabled={loadingField === "headline"}
                        className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        {loadingField === "headline" ? "Improving..." : "✦ Improve with AI"}
                      </button>
                    </div>

                    <input
                      value={editable.headline ?? ""}
                      onChange={(e) =>
                        setEditable((prev) =>
                          prev ? { ...prev, headline: e.target.value } : prev
                        )
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                    />
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-slate-800">
                        Subheading
                      </label>
                      <button
                        type="button"
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
                        disabled={loadingField === "subheading"}
                        className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        {loadingField === "subheading" ? "Improving..." : "✦ Improve with AI"}
                      </button>
                    </div>

                    <textarea
                      value={editable.subheading ?? ""}
                      onChange={(e) =>
                        setEditable((prev) =>
                          prev ? { ...prev, subheading: e.target.value } : prev
                        )
                      }
                      className="min-h-[104px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
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
                          className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
                        >
                          <div className="mb-4 flex items-center gap-2">
                            <span
                              className={cx("h-2.5 w-2.5 rounded-full", accent.dot)}
                            />
                            <span className="text-sm font-medium text-slate-800">
                              Value Point {index + 1}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  Title
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    runImprove(
                                      improveKeyTitle,
                                      `valuePointTitle:${index}`,
                                      point.title ?? "",
                                      (improved) =>
                                        updateValuePoint(index, {
                                          title: improved,
                                        })
                                    )
                                  }
                                  disabled={loadingField === improveKeyTitle}
                                  className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700"
                                >
                                  {loadingField === improveKeyTitle
                                    ? "Improving..."
                                    : "✦ Improve with AI"}
                                </button>
                              </div>

                              <input
                                value={point.title ?? ""}
                                onChange={(e) =>
                                  updateValuePoint(index, { title: e.target.value })
                                }
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                              />
                            </div>

                            <div>
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  Copy
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    runImprove(
                                      improveKeyText,
                                      `valuePointText:${index}`,
                                      point.text ?? "",
                                      (improved) =>
                                        updateValuePoint(index, {
                                          text: improved,
                                        })
                                    )
                                  }
                                  disabled={loadingField === improveKeyText}
                                  className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700"
                                >
                                  {loadingField === improveKeyText
                                    ? "Improving..."
                                    : "✦ Improve with AI"}
                                </button>
                              </div>

                              <textarea
                                value={point.text ?? ""}
                                onChange={(e) =>
                                  updateValuePoint(index, { text: e.target.value })
                                }
                                className="min-h-[86px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
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
                                        onClick={() =>
                                          updateValuePoint(index, {
                                            accent: accentOption,
                                          })
                                        }
                                        className={cx(
                                          "rounded-2xl border px-2 py-2 text-xs font-medium capitalize transition",
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

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f5f7fb]">
          <div className="shrink-0 border-b border-slate-200 bg-[#f5f7fb] px-8 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm hover:text-slate-600"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M5 7h14M5 12h14M5 17h14" />
                  </svg>
                </button>

                <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
  Create Block • Step 3 of 3 - Review & Edit
</h1>
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

          <div className="flex-1 overflow-hidden px-8 py-6">
            {pendingPatchExists && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                This block has been submitted and is now pending approval.
              </div>
            )}

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
                  style={{ height: `${previewViewportHeight}px` }}
                >
                  <div className="flex items-start justify-center">
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
                            ? `${previewViewportHeight}px`
                            : `${iframeContentHeight}px`,
                        display: "block",
                      }}
                      scrolling="no"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-[#f5f7fb] px-8 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                <span>{complianceLabel}</span>
                <span>Accessibility: WCAG AA ✓</span>
                <span>Design Tokens: Locked</span>
              </div>

              <div className="flex items-center gap-3">
  <button
    type="button"
    onClick={onSaveDraft}
    className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
  >
    Save Draft
  </button>

  <button
    type="button"
    onClick={onSubmitApproval}
    className="rounded-2xl bg-[#5b7cff] px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#1f36b8] active:bg-[#2642c7]"
  >
    {submitLabel}
  </button>
</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}