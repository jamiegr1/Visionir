"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  children: ReactNode;
  tone: "blue" | "green" | "slate";
}) {
  const styles =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : tone === "slate"
      ? "bg-slate-100 text-slate-600 ring-slate-200"
      : "bg-[#eef3ff] text-[#4f6fff] ring-[#dbe5ff]";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
        styles
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
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef3ff] text-sm font-semibold text-[#4f6fff]">
        {number}
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
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

        setEditable(json.block.data as BlockData);
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
    if (!editable) return "";

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
  var target = document.getElementById("visionir-block-${id}");
  if (!target) return;
  target.innerHTML = \`${escapedPreview}\`;
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
        body: JSON.stringify({
          status: "published",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to finalise block");
      }

      router.push(`/dashboard?role=${role}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to finish deployment:", error);
      alert("Failed to complete deployment");
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
      <div className="flex min-h-[calc(100dvh-72px)] items-center justify-center bg-[#f5f7fb] px-6">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-500 shadow-sm">
          Loading…
        </div>
      </div>
    );
  }

  if (!editable) {
    return (
      <div className="flex min-h-[calc(100dvh-72px)] items-center justify-center bg-[#f5f7fb] px-6">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-500 shadow-sm">
          Block not found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-[#f5f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-8 px-6 py-8 xl:px-8">
        <div className="flex flex-col gap-5 rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone="blue">Optimizely</StatusPill>
            <StatusPill tone="green">Ready For Production</StatusPill>
            <StatusPill tone="slate">Role: {role}</StatusPill>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              Embed to Optimizely
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-slate-500">
              Follow these simple steps to add this approved block into
              Optimizely. The generated embed code is already approved and ready
              to use, so no technical edits should be needed before adding it
              into a JavaScript block.
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <StepCard
            number={1}
            title="Copy the approved embed code"
            description="Use the button below to copy the production-ready code for this block."
          />
          <StepCard
            number={2}
            title="Paste into an Optimizely JavaScript block"
            description="Add a JavaScript block inside Optimizely, paste the code, position it on the page, then publish."
          />
          <StepCard
            number={3}
            title="Mark deployment as complete"
            description="Once the block has been added, click Done so Visionir records the block as published."
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Deploy to Optimizely - Instructions
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  This block is production-ready and can now be embedded into
                  Optimizely using a JavaScript block.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
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

            <div className="rounded-[28px] border border-slate-200 bg-[#f7f8fb] p-5">
              <div
                className={cx(
                  "mx-auto overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-all duration-300",
                  shellWidthClass
                )}
              >
                <iframe
                  title="Visionir block preview"
                  srcDoc={previewDoc}
                  style={{
                    width: `${previewViewportWidth}px`,
                    height: `${previewHeight}px`,
                    border: "0",
                    display: "block",
                    background: "white",
                  }}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
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

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
              <h3 className="text-base font-semibold text-slate-950">
                Helpful Note
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                This embed remains governed after deployment. Teams can still
                track state, approvals, and rollout status from the Visionir
                dashboard.
              </p>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
              <h3 className="text-base font-semibold text-slate-950">
                Governance Snapshot
              </h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Brand Compliance</span>
                  <span className="font-semibold text-emerald-700">100% ✓</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Accessibility</span>
                  <span className="font-semibold text-emerald-700">
                    WCAG AA ✓
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Design Tokens</span>
                  <span className="font-semibold text-emerald-700">Locked ✓</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Restricted Scripts</span>
                  <span className="font-semibold text-emerald-700">
                    Enabled ✓
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
              <h3 className="text-base font-semibold text-slate-950">
                Embed Code
              </h3>
              <pre className="mt-4 max-h-[360px] overflow-auto rounded-[24px] bg-slate-950 p-4 text-xs leading-6 text-slate-200">
                <code>{embedCode}</code>
              </pre>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}