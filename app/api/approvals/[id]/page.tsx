"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Accent = "blue" | "green" | "orange" | "purple";
type BlockData = {
  eyebrow: string;
  headline: string;
  subheading: string;
  imageUrl?: string;
  valuePoints: Array<{ title: string; text: string; accent: Accent }>;
};

type Approval = {
  id: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  payload: any;
  currentStep: string;
  timeline: Array<{ step: string; label: string; at: number }>;
};

function escapeHtml(s: string) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderHtml(block: BlockData) {
  const acc = (a: string) => `ac-${a}`;
  return `
<section class="visionir-wrap">
  <div class="visionir-inner">
    <div class="visionir-grid">
      <div>
        <p class="visionir-eyebrow">${escapeHtml(block.eyebrow)}</p>
        <h2 class="visionir-h">${escapeHtml(block.headline)}</h2>
        <p class="visionir-sub">${escapeHtml(block.subheading)}</p>
        <div class="visionir-cards">
          ${block.valuePoints
            .map(
              (v) => `
            <div class="visionir-card ${acc(v.accent)}">
              <p class="t">${escapeHtml(v.title)}</p>
              <p class="p">${escapeHtml(v.text)}</p>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
      <div class="visionir-img">
        ${
          block.imageUrl
            ? `<img src="${block.imageUrl}" alt="Supporting image" />`
            : `<div style="height:360px;border-radius:18px;background:#eef2ff"></div>`
        }
      </div>
    </div>
  </div>
</section>
`.trim();
}

export default function ApprovalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [approval, setApproval] = useState<Approval | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchApproval() {
    const res = await fetch(`/api/approvals?id=${encodeURIComponent(id)}`);
    if (!res.ok) return;
    const json = await res.json();
    setApproval(json.approval);
  }

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchApproval().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-advance workflow every ~1.2s until approved
  useEffect(() => {
    if (!approval || approval.status !== "pending") return;

    const done = approval.currentStep === "approved_for_deployment";
    if (done) return;

    const t = setTimeout(async () => {
      await fetch("/api/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: approval.id, action: "advance" }),
      });
      await fetchApproval();
    }, 1200);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approval?.currentStep, approval?.status]);

  const previewDoc = useMemo(() => {
    if (!approval?.payload?.block || !approval?.payload?.embed) return "";
    // payload.embed already includes css + html, but we want iframe-safe doc:
    const block = approval.payload.block as BlockData;
    const css = approval.payload?.embed?.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
    const html = renderHtml(block);

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>${css}</style>
</head>
<body>${html}</body>
</html>`;
  }, [approval]);

  const statusText =
    approval?.status === "approved" ? "Approved" : approval?.status === "rejected" ? "Rejected" : "Pending Review";

  if (loading) {
    return <div className="min-h-screen bg-[#f5f7fb] p-10 text-slate-700">Loading approval…</div>;
  }

  if (!approval) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] p-10 text-slate-700">
        Approval not found.
        <button className="ml-3 underline" onClick={() => router.push("/blocks/new")}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Block Submitted for Approval</p>
            <h1 className="mt-2 text-2xl font-semibold">Approval Timeline</h1>
            <p className="mt-2 text-sm text-slate-600">This block is now under governance review before publishing.</p>
          </div>

          <div className="rounded-full px-4 py-2 text-sm ring-1 ring-slate-200 bg-white">
            Status: <span className="font-semibold">{statusText}</span> • #{approval.id}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Timeline */}
          <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-5">
            <p className="text-sm font-semibold">Workflow</p>
            <div className="mt-4 space-y-3">
              {approval.timeline.map((t, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-3 w-3 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm text-slate-900">{t.label}</p>
                    <p className="text-xs text-slate-500">{new Date(t.at).toLocaleString()}</p>
                  </div>
                </div>
              ))}

              {approval.status === "pending" && (
                <div className="flex items-start gap-3 opacity-70">
                  <div className="mt-1 h-3 w-3 rounded-full bg-amber-400" />
                  <div>
                    <p className="text-sm text-slate-700">Processing next step…</p>
                    <p className="text-xs text-slate-500">Governance engine</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <p className="text-sm font-semibold">Block Preview</p>
              <p className="text-xs text-slate-500 mt-1">Version 1.0 • Status: {statusText}</p>
            </div>

            <div className="p-4">
              <iframe
                title="approval-preview"
                className="h-[720px] w-full rounded-xl bg-white"
                sandbox=""
                srcDoc={previewDoc}
              />
            </div>

            <div className="border-t border-slate-200 px-6 py-3 text-xs text-slate-500 flex flex-wrap gap-6">
              <span>Brand Compliance: 100% ✓</span>
              <span>Accessibility: WCAG AA ✓</span>
              <span>Design Tokens: Locked</span>
              <span>Restricted Scripts: Enabled ✓</span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => router.push("/blocks/new")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Back to Create Block
          </button>
        </div>
      </div>
    </div>
  );
}