"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { BlockData } from "@/lib/types";
import { makePreviewHtml } from "@/lib/preview";

type ViewportMode = "mobile" | "tablet" | "desktop";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "blue" | "green" | "slate";
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        tone === "blue" && "bg-[#eef3ff] text-[#4f6fff]",
        tone === "green" && "bg-emerald-50 text-emerald-700",
        tone === "slate" && "bg-slate-100 text-slate-600"
      )}
    >
      {children}
    </span>
  );
}

function ActionCard({
  title,
  description,
  primary,
  onClick,
}: {
  title: string;
  description: string;
  primary?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-[20px] border p-4 text-left transition-all duration-200",
        primary
          ? "border-[#dbe5ff] bg-[#f6f8ff] hover:border-[#c7d6ff] hover:bg-[#eef3ff]"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={cx(
              "text-[14px] font-semibold",
              primary ? "text-[#3158f5]" : "text-slate-900"
            )}
          >
            {title}
          </p>
          <p className="mt-1.5 text-[12.5px] leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <span
          className={cx(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ring-1",
            primary
              ? "bg-[#eef3ff] text-[#4f6fff] ring-[#dbe5ff]"
              : "bg-slate-50 text-slate-500 ring-slate-200"
          )}
        >
          <svg
            className="h-4.5 w-4.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M8 12h8" strokeLinecap="round" />
            <path
              d="m13 7 5 5-5 5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </button>
  );
}

export default function BlockDeployPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [editable, setEditable] = useState<BlockData | null>(null);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");

  useEffect(() => {
    async function loadBlock() {
      try {
        setLoading(true);

        const res = await fetch(`/api/blocks/${id}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.block?.data) {
          setEditable(null);
          return;
        }

        setEditable(json.block.data);
      } catch (error) {
        console.error("Failed to load deploy page:", error);
        setEditable(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      void loadBlock();
    }
  }, [id]);

  const DEFAULT_BLOCK_IMAGE = "/farmerimage.jpg";

  const previewDoc = useMemo(() => {
    if (!editable) return "<html><body></body></html>";

    const rawImageUrl =
      typeof editable.imageUrl === "string" && editable.imageUrl.trim()
        ? editable.imageUrl
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
      ...editable,
      imageUrl: resolvedImageUrl,
    });
  }, [editable]);

  const shellWidthClass =
    viewport === "mobile"
      ? "max-w-[410px]"
      : viewport === "tablet"
        ? "max-w-[760px]"
        : "max-w-[1240px]";

  const previewViewportWidth =
    viewport === "mobile" ? 360 : viewport === "tablet" ? 680 : 1180;

  const previewHeight =
    viewport === "mobile" ? 1180 : viewport === "tablet" ? 1220 : 560;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-500">
        Loading…
      </div>
    );
  }

  if (!editable) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-500">
        Block not found.
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-72px)] overflow-hidden bg-[#f5f7fb] text-slate-900">
      <div className="flex h-[calc(100dvh-72px)] overflow-hidden">
        <aside className="w-full max-w-[360px] shrink-0 border-r border-slate-200 bg-white">
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-slate-200 px-5 py-5">
              <div>
                <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
                  Deployment
                </h2>
                <p className="mt-1 text-[13px] leading-5 text-slate-500">
                  This block has passed governance and is now ready for deployment
                  and reuse.
                </p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Approved Output
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 pr-2">
              <section>
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4f6fff]">
                        Approval Summary
                      </p>
                    </div>

                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      <svg
                        className="h-4.5 w-4.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <path d="M5 12.5 9.2 16.7 19 7.5" />
                      </svg>
                    </span>
                  </div>

                  <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">
                          Status
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-500">
                          Governance checks completed successfully
                        </p>
                      </div>

                      <StatusPill tone="green">Approved</StatusPill>
                    </div>

                    <div className="mt-3 h-1.5 rounded-full bg-slate-200">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                        >
                          <path d="M5 12.5 9.2 16.7 19 7.5" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-[13.5px] font-semibold text-slate-900">
                          Brand Compliance Passed
                        </p>
                        <p className="mt-1 text-[12px] leading-5 text-slate-500">
                          Typography, colour system, spacing, and approved patterns
                          validated successfully.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                        >
                          <path d="M5 12.5 9.2 16.7 19 7.5" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-[13.5px] font-semibold text-slate-900">
                          Accessibility & Governance Passed
                        </p>
                        <p className="mt-1 text-[12px] leading-5 text-slate-500">
                          WCAG checks, token controls, and output governance are
                          locked and approved.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Deployment Actions
                    </p>

                    <div className="mt-3 space-y-3">
                      <ActionCard
                        title="Generate Optimizely Embed Code"
                        description="Create production-ready embed output for approved CMS implementation."
                        primary
                        onClick={() => router.push(`/blocks/${id}/deploy/embed`)}
                      />

                      <ActionCard
                        title="Save as Approved Block Template"
                        description="Store this approved layout as a reusable governed template for future teams."
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </aside>

        <main className="grid min-w-0 flex-1 min-h-0 grid-rows-[auto_minmax(0,1fr)_auto_auto] overflow-hidden bg-[#f5f7fb]">
          <div className="shrink-0 border-b border-slate-200 bg-[#f5f7fb] px-8 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
                  Block Approved — Ready for Deployment
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  This output has passed governance and is now ready to embed
                  into your CMS or save as a reusable template.
                </p>
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
                      style={{
                        height:
                          viewport === "desktop"
                            ? "min(560px, calc(100dvh - 356px))"
                            : "min(620px, calc(100dvh - 336px))",
                      }}
                    >
                      <div
                        className={cx(
                          "flex min-h-full justify-center",
                          viewport === "tablet"
                            ? "items-start py-0"
                            : "items-start"
                        )}
                      >
                        <iframe
                          title="Block Deployment Preview"
                          srcDoc={previewDoc}
                          className="block border-0 bg-white align-top"
                          style={{
                            width: `${previewViewportWidth}px`,
                            minWidth: `${previewViewportWidth}px`,
                            height: `${previewHeight}px`,
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
                <span>Version 1.0</span>
                <span>
                  Status:{" "}
                  <span className="font-medium text-emerald-600">Approved</span>
                </span>
                <span>Deployment ready</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Save Template
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/blocks/${id}/deploy/embed`)}
                  className="rounded-2xl bg-[#5b7cff] px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#1f36b8] active:bg-[#2642c7]"
                >
                  Generate Embed Code
                </button>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-[#f5f7fb] px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                <span>Brand Compliance: 100% ✓</span>
                <span>Accessibility: WCAG AA ✓</span>
                <span>Design Tokens: Locked ✓</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}