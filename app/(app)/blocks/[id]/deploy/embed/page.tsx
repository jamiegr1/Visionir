"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { BlockData } from "@/lib/types";
import { makePreviewHtml } from "@/lib/preview";

type ViewportMode = "mobile" | "tablet" | "desktop";
type Role = "creator" | "approver" | "admin";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isRole(value: string | null): value is Role {
  return value === "creator" || value === "approver" || value === "admin";
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

export default function BlockDeployEmbedPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id;

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return isRole(value) ? value : "admin";
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [editable, setEditable] = useState<BlockData | null>(null);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [copied, setCopied] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    async function loadBlock() {
      try {
        setLoading(true);

        const res = await fetch(`/api/blocks/${id}?role=${role}`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.block?.data) {
          setEditable(null);
          return;
        }

        setEditable(json.block.data);
      } catch (error) {
        console.error("Failed to load embed page:", error);
        setEditable(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      void loadBlock();
    }
  }, [id, role]);

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

  const embedCode = useMemo(() => {
    if (!editable) return "";

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
  }, [previewDoc, editable, id]);

  async function handleCopyEmbedCode() {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch (error) {
      console.error("Failed to copy embed code:", error);
    }
  }

  async function handleDone() {
    try {
      setIsFinishing(true);
  
      const res = await fetch(`/api/blocks/${id}?role=${role}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          status: "published",
          publishedAt: new Date().toISOString(),
        }),
      });
  
      const json = await res.json().catch(() => ({}));
      console.log("PUBLISH RESPONSE:", { ok: res.ok, status: res.status, json });
  
      if (!res.ok) {
        throw new Error(json?.error || "Failed to finalise block");
      }
  
      router.push(`/dashboard?role=${role}&refresh=${Date.now()}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to complete deployment:", error);
      alert(
        error instanceof Error ? error.message : "Failed to complete deployment"
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
                  Embed to Optimizely
                </h2>
                <p className="mt-1 text-[13px] leading-5 text-slate-500">
                  Follow these simple steps to add this approved block into
                  Optimizely.
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
                        This page is designed for marketers and content teams, so
                        the process stays simple and easy to follow.
                      </p>
                    </div>

                    <StatusPill tone="blue">Optimizely</StatusPill>
                  </div>

                  <div className="mt-5 space-y-3">
                    <StepCard
                      number={1}
                      title="Copy Embed Code"
                      description="Click the button below to copy the production-ready code generated by Visionir."
                    />

                    <StepCard
                      number={2}
                      title="Open Optimizely CMS"
                      description="Navigate to the page in Optimizely where you want this approved block to appear."
                    />

                    <StepCard
                      number={3}
                      title="Add a New Block"
                      description='Add a new block to the page and choose “JavaScript Block”.'
                    />

                    <StepCard
                      number={4}
                      title="Paste the Embed Code"
                      description="Paste the copied Visionir embed code into the JavaScript block and save your changes."
                    />

                    <StepCard
                      number={5}
                      title="Position and Publish"
                      description="Place the block in the correct location on the page, then publish when ready."
                    />
                  </div>

                  <div className="mt-5 rounded-[20px] border border-[#dbe5ff] bg-[#f6f8ff] p-4">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#4f6fff]">
                      Helpful Note
                    </p>
                    <p className="mt-2 text-[12.5px] leading-5 text-slate-600">
                      The generated embed code is already approved and ready to use.
                      No technical edits should be needed before adding it into
                      Optimizely.
                    </p>
                  </div>

                  <div className="mt-5 space-y-3">
                    <button
                      type="button"
                      onClick={handleCopyEmbedCode}
                      className="w-full rounded-2xl bg-[#5b7cff] px-4 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#1f36b8] active:bg-[#2642c7]"
                    >
                      {copied ? "Embed Code Copied" : "Copy Embed Code"}
                    </button>

                    <button
                      type="button"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      Live Chat Support
                    </button>
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
                  Deploy to Optimizely - Instructions
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  This block is production-ready and can now be embedded into
                  Optimizely using a JavaScript block.
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
                <span>This embed remains governed after deployment.</span>
                <span>Version 1.0</span>
                <span>
                  Status:{" "}
                  <span className="font-medium text-emerald-600">
                    Ready For Production
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyEmbedCode}
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {copied ? "Copied" : "Copy Embed Code"}
                </button>

                <button
                  type="button"
                  onClick={handleDone}
                  disabled={isFinishing}
                  className="rounded-2xl bg-[#5b7cff] px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#1f36b8] active:bg-[#2642c7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isFinishing ? "Finishing..." : "Done"}
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
                <span>Restricted Scripts: Enabled ✓</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}