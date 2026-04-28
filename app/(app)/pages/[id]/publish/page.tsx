"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  Code2,
  Eye,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { makePreviewHtml } from "@/lib/preview";
import type { PageRecord } from "@/lib/template-types";

type Role = "creator" | "approver" | "admin";
type ViewportMode = "mobile" | "tablet" | "desktop";

type ApiBlockRecord = {
  id: string;
  status?: string;
  data?: Record<string, unknown> | null;
  componentId?: string;
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

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "blue" | "green" | "amber" | "slate";
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        tone === "blue" && "bg-[#eef3ff] text-[#4f6fff]",
        tone === "green" && "bg-emerald-50 text-emerald-700",
        tone === "amber" && "bg-amber-50 text-amber-700",
        tone === "slate" && "bg-slate-100 text-slate-600"
      )}
    >
      {children}
    </span>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[12px] font-semibold text-[#4f6fff] ring-1 ring-[#dbe5ff]">
          {number}
        </div>

        <div>
          <p className="text-[13.5px] font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-[12px] leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReadinessRow({
  label,
  passed,
}: {
  label: string;
  passed: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] bg-slate-50 px-3 py-3">
      <p className="text-[12.5px] font-medium text-slate-700">{label}</p>
      {passed ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-red-400" />
      )}
    </div>
  );
}

function getBlockName(block: ApiBlockRecord) {
  const data = block.data ?? {};

  return (
    (typeof data.headline === "string" && data.headline.trim()) ||
    (typeof data.eyebrow === "string" && data.eyebrow.trim()) ||
    `Block ${block.id.slice(0, 8)}`
  );
}

function getAllBlockIds(page: PageRecord) {
  return Array.from(
    new Set((page.sections ?? []).flatMap((section) => section.blockIds ?? []))
  );
}

function escapeScriptContent(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${")
    .replace(/<\/script>/gi, "<\\/script>");
}

function buildFullPageHtml(page: PageRecord, blocks: ApiBlockRecord[]) {
  const blockMap = new Map(blocks.map((block) => [block.id, block]));

  const sectionsHtml = (page.sections ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((section) => {
      const sectionBlocks = (section.blockIds ?? [])
        .map((blockId) => blockMap.get(blockId))
        .filter(Boolean) as ApiBlockRecord[];

      const blocksHtml = sectionBlocks
        .map((block) => {
          try {
            return makePreviewHtml(block.data as any);
          } catch {
            return `
              <section style="padding:48px;border:1px solid #e5e7eb;border-radius:24px;margin:24px 0;font-family:Inter,Arial,sans-serif;">
                <p style="margin:0;color:#64748b;font-size:14px;">Unable to render block</p>
                <h2 style="margin:8px 0 0;color:#0f172a;">${getBlockName(block)}</h2>
              </section>
            `;
          }
        })
        .join("\n");

      return `
        <section data-visionir-section="${section.key}" data-visionir-section-name="${section.label}">
          ${blocksHtml}
        </section>
      `;
    })
    .join("\n");

  return `
    <main data-visionir-page="${page.id}" data-visionir-page-name="${page.name}">
      ${sectionsHtml}
    </main>
  `;
}

function buildCmsScript(page: PageRecord, blocks: ApiBlockRecord[]) {
  const html = buildFullPageHtml(page, blocks);

  return `<div id="visionir-page-${page.id}"></div>
<script>
(function () {
  var container = document.getElementById("visionir-page-${page.id}");
  if (!container) return;
  container.innerHTML = \`${escapeScriptContent(html)}\`;
})();
</script>`;
}

export default function PagePublishPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return isRole(value) ? value : "admin";
  }, [searchParams]);

  const [page, setPage] = useState<PageRecord | null>(null);
  const [blocks, setBlocks] = useState<ApiBlockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [copied, setCopied] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const id = params.id;

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        setLoading(true);
        setError(null);

        const pageRes = await fetch(`/api/pages/${id}?role=${role}`, {
          cache: "no-store",
        });

        const pageJson = await pageRes.json().catch(() => ({}));

        if (!pageRes.ok || !pageJson?.page) {
          throw new Error(pageJson?.error || "Could not load page.");
        }

        const pageData = pageJson.page as PageRecord;
        const blockIds = getAllBlockIds(pageData);

        const blockResults = await Promise.all(
          blockIds.map(async (blockId) => {
            const res = await fetch(`/api/blocks/${blockId}?role=${role}`, {
              cache: "no-store",
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) return null;

            return (json?.block ?? json) as ApiBlockRecord;
          })
        );

        if (!cancelled) {
          setPage(pageData);
          setBlocks(blockResults.filter(Boolean) as ApiBlockRecord[]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load page.");
          setPage(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      void loadPage();
    }

    return () => {
      cancelled = true;
    };
  }, [id, role]);

  const sortedSections = useMemo(() => {
    return (page?.sections ?? []).slice().sort((a, b) => a.order - b.order);
  }, [page]);

  const isApproved = page?.status === "approved" || page?.status === "published";
  const isPublished = page?.status === "published";

  const requiredSections = sortedSections.filter((section) => section.required);
  const completedSections = sortedSections.filter(
    (section) => section.completed || (section.blockIds ?? []).length > 0
  );

  const allRequiredSectionsComplete =
    isApproved ||
    requiredSections.every((section) => {
      if (section.completed) return true;

      const minInstances = Math.max(section.minInstances ?? 1, 1);
      return (section.blockIds ?? []).length >= minInstances;
    });

  const allBlocksApproved =
    isApproved ||
    blocks.every((block) =>
      ["approved", "published", "deployed", "completed"].includes(block.status ?? "")
    );

  const cmsCode = useMemo(() => {
    if (!page) return "";
    return buildCmsScript(page, blocks);
  }, [page, blocks]);

  const previewDoc = useMemo(() => {
    if (!page) return "<html><body></body></html>";

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: Inter, Arial, sans-serif;
            }
          </style>
        </head>
        <body>
          ${buildFullPageHtml(page, blocks)}
        </body>
      </html>
    `;
  }, [page, blocks]);

  const canPublish = Boolean(
    page && isApproved && allRequiredSectionsComplete && allBlocksApproved && cmsCode
  );

  async function handleCopyEmbedCode() {
    try {
      await navigator.clipboard.writeText(cmsCode);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch (error) {
      console.error("Failed to copy CMS code:", error);
    }
  }

  async function handleDone() {
    if (!page || !canPublish) return;

    try {
      setIsFinishing(true);
      setError(null);

      const res = await fetch(`/api/pages/${page.id}?role=${role}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          action: "publish",
          updatedByUserId: "user-1",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to publish page.");
      }

      setPage(json.page as PageRecord);
      router.push(`/pages/${page.id}?role=${role}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to complete page deployment:", error);
      setError(
        error instanceof Error ? error.message : "Failed to complete page deployment."
      );
    } finally {
      setIsFinishing(false);
    }
  }

  const shellWidthClass =
    viewport === "mobile"
      ? "max-w-[410px]"
      : viewport === "tablet"
        ? "max-w-[760px]"
        : "max-w-[1240px]";

  const previewViewportWidth =
    viewport === "mobile" ? 360 : viewport === "tablet" ? 680 : 1180;

  const previewHeight =
    viewport === "mobile" ? 1600 : viewport === "tablet" ? 1600 : 1200;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-500">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading page deployment…
        </div>
      </div>
    );
  }

  if (!page || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-6 text-slate-500">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            {error || "Page not found."}
          </p>

          <button
            type="button"
            onClick={() => router.push(`/pages?role=${role}`)}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4c6ff5]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pages
          </button>
        </div>
      </div>
    );
  }

  const readinessTone = canPublish || isPublished ? "green" : "amber";

  return (
    <div className="h-[calc(100dvh-72px)] overflow-hidden bg-[#f5f7fb] text-slate-900">
      <div className="flex h-[calc(100dvh-72px)] overflow-hidden">
        <aside className="w-full max-w-[380px] shrink-0 border-r border-slate-200 bg-white">
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-slate-200 px-5 py-5">
              <button
                type="button"
                onClick={() => router.push(`/pages/${page.id}?role=${role}`)}
                className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Page
              </button>

              <div>
                <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
                  Publish Page to CMS
                </h2>
                <p className="mt-1 text-[13px] leading-5 text-slate-500">
                  Add this approved Visionir page into your CMS using one JavaScript or
                  embed block.
                </p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Deployment Process
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 pr-2">
              <section>
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4f6fff]">
                        Deployment Steps
                      </p>
                      <p className="mt-2 text-[12px] leading-5 text-slate-500">
                        The CMS team only needs to paste one generated script to publish
                        the full approved page.
                      </p>
                    </div>

                    <StatusPill tone="blue">CMS</StatusPill>
                  </div>

                  <div className="mt-5 space-y-3">
                    <StepCard
                      number={1}
                      title="Copy CMS Code"
                      description="Copy the production-ready JavaScript code generated by Visionir."
                    />

                    <StepCard
                      number={2}
                      title="Open the CMS Page"
                      description="Navigate to the CMS page where this Visionir page should appear."
                    />

                    <StepCard
                      number={3}
                      title="Add One Embed Block"
                      description="Add a single JavaScript, HTML, or embed block to the page body."
                    />

                    <StepCard
                      number={4}
                      title="Paste and Preview"
                      description="Paste the Visionir code, save, and preview the CMS page before publishing."
                    />

                    <StepCard
                      number={5}
                      title="Publish in the CMS"
                      description="Publish once the CMS preview matches the approved Visionir version."
                    />
                  </div>

                  <div className="mt-5 rounded-[20px] border border-[#dbe5ff] bg-[#f6f8ff] p-4">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#4f6fff]">
                      Helpful Note
                    </p>
                    <p className="mt-2 text-[12.5px] leading-5 text-slate-600">
                      This embed contains all approved page sections and blocks in the
                      governed template order. No manual code edits should be needed.
                    </p>
                  </div>

                  <div className="mt-5 space-y-3">
                    <button
                      type="button"
                      onClick={handleCopyEmbedCode}
                      className="w-full rounded-2xl bg-[#5b7cff] px-4 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#1f36b8] active:bg-[#2642c7]"
                    >
                      {copied ? "CMS Code Copied" : "Copy CMS Code"}
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push(`/pages/${page.id}?role=${role}`)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      Back to Page Workspace
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Publish Readiness
                      </p>
                      <p className="mt-2 text-[12px] leading-5 text-slate-500">
                        Final governance checks before marking the page as published.
                      </p>
                    </div>

                    <StatusPill tone={readinessTone}>
                      {canPublish || isPublished ? "Ready" : "Blocked"}
                    </StatusPill>
                  </div>

                  <div className="mt-4 space-y-2">
                    <ReadinessRow label="Page approved" passed={isApproved} />
                    <ReadinessRow
                      label="Required sections complete"
                      passed={allRequiredSectionsComplete}
                    />
                    <ReadinessRow
                      label="Attached blocks approved"
                      passed={allBlocksApproved}
                    />
                    <ReadinessRow label="CMS code generated" passed={Boolean(cmsCode)} />
                  </div>
                </div>

                <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Page Summary
                  </p>

                  <div className="mt-4 space-y-3 text-[12.5px]">
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Template</span>
                      <span className="max-w-[190px] truncate text-right font-medium text-slate-700">
                        {page.templateName}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Sections</span>
                      <span className="font-medium text-slate-700">
                        {completedSections.length}/{sortedSections.length} complete
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Blocks</span>
                      <span className="font-medium text-slate-700">
                        {blocks.length} embedded
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Approved</span>
                      <span className="max-w-[190px] text-right font-medium text-slate-700">
                        {formatDateTime(page.approvedAt)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Published</span>
                      <span className="max-w-[190px] text-right font-medium text-slate-700">
                        {formatDateTime(page.publishedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </aside>

        <main className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto_auto] overflow-hidden bg-[#f5f7fb]">
          <div className="shrink-0 border-b border-slate-200 bg-[#f5f7fb] px-8 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
                    Publish {page.name}
                  </h1>

                  <StatusPill tone={isPublished ? "green" : "blue"}>
                    {isPublished ? "Published" : "Ready For CMS"}
                  </StatusPill>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Preview the full approved page before adding the generated embed into the CMS.
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
                          ? "overflow-y-auto overflow-x-hidden"
                          : "overflow-y-auto overflow-x-hidden"
                      )}
                      style={{
                        height:
                          viewport === "desktop"
                            ? "min(640px, calc(100dvh - 356px))"
                            : "min(640px, calc(100dvh - 336px))",
                      }}
                    >
                      <div className="flex min-h-full justify-center">
                        <iframe
                          title="Page Deployment Preview"
                          srcDoc={previewDoc}
                          className="block border-0 bg-white align-top"
                          style={{
                            width: `${previewViewportWidth}px`,
                            minWidth: `${previewViewportWidth}px`,
                            height: `${previewHeight}px`,
                            display: "block",
                          }}
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
                <span>This page embed remains governed after deployment.</span>
                <span>Version 1.0</span>
                <span>
                  Status:{" "}
                  <span className="font-medium text-emerald-600">
                    {isPublished ? "Published" : "Ready For Production"}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/pages/${page.id}?role=${role}`)}
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleCopyEmbedCode}
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {copied ? "Copied" : "Copy CMS Code"}
                </button>

                <button
                  type="button"
                  onClick={handleDone}
                  disabled={!canPublish || isFinishing || isPublished}
                  className="rounded-2xl bg-[#5b7cff] px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#1f36b8] active:bg-[#2642c7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isFinishing
                    ? "Publishing..."
                    : isPublished
                      ? "Published"
                      : "Done"}
                </button>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-[#f5f7fb] px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                <span>Page Approved: {isApproved ? "Yes ✓" : "No"}</span>
                <span>Required Sections: {allRequiredSectionsComplete ? "Complete ✓" : "Incomplete"}</span>
                <span>Blocks Approved: {allBlocksApproved ? "Yes ✓" : "No"}</span>
                <span>CMS Embed: {cmsCode ? "Generated ✓" : "Missing"}</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}