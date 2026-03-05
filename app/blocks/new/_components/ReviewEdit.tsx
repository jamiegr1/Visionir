"use client";

import React, { useMemo, useState } from "react";

type Accent = "blue" | "green" | "orange" | "purple";

type BlockData = {
  eyebrow: string;
  headline: string;
  subheading: string;
  imageUrl?: string;
  valuePoints: Array<{ title: string; text: string; accent: Accent }>;
};

type Governance =
  | {
      score: number;
      checks: Array<{ id: string; label: string; ok: boolean }>;
      bannedHit?: string | null;
    }
  | null;

type ReviewEditProps = {
  editable: BlockData;
  setEditable: React.Dispatch<React.SetStateAction<BlockData | null>>;
  previewDoc: string;

  describe: string;
  setDescribe: React.Dispatch<React.SetStateAction<string>>;

  improveField: (field: string, text: string, apply: (v: string) => void) => Promise<void>;
  requestDescribeChanges: () => Promise<void>;

  pendingPatchExists: boolean;
  onApplyPatch: () => void;
  onRejectPatch: () => void;
  patchNotes: string[];

  governance: Governance;

  versionsCount: number;
  onRestoreLatest: () => void;

  approvalStatus: "none" | "pending" | "approved" | "rejected";
  approvalId: string | null;
  onSubmitForApproval: () => Promise<void>;

  changeLog: string[];
};

type ViewportMode = "mobile" | "tablet" | "desktop";

export default function ReviewEdit(props: ReviewEditProps) {
  const b = props.editable;

  const [improvingKey, setImprovingKey] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [viewport, setViewport] = useState<ViewportMode>("desktop");

  const score = props.governance?.score ?? 100;

  const statusText =
    props.approvalStatus === "pending"
      ? "Pending Review"
      : props.approvalStatus === "approved"
      ? "Approved"
      : props.approvalStatus === "rejected"
      ? "Rejected"
      : "Not Submitted";

  const statusColor =
    props.approvalStatus === "pending"
      ? "text-amber-600"
      : props.approvalStatus === "approved"
      ? "text-green-600"
      : props.approvalStatus === "rejected"
      ? "text-red-600"
      : "text-slate-500";

  const frameInnerMax = useMemo(() => {
    if (viewport === "mobile") return 420;
    if (viewport === "tablet") return 1100;
    return 1500; // wider like your wireframe
  }, [viewport]);

  const iframeHeight = useMemo(() => {
    if (viewport === "mobile") return 640;
    if (viewport === "tablet") return 700;
    return 760;
  }, [viewport]);

  async function runImprove(key: string, field: string, text: string, apply: (v: string) => void) {
    try {
      setImprovingKey(key);
      await props.improveField(field, text, apply);
    } finally {
      setImprovingKey(null);
    }
  }

  async function runDescribe() {
    const note = props.describe.trim();
    if (!note) return;
    try {
      setRequesting(true);
      await props.requestDescribeChanges();
    } finally {
      setRequesting(false);
    }
  }

  async function runSubmit() {
    try {
      setSubmitting(true);
      await props.onSubmitForApproval();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-[calc(100vh-56px)] flex w-full">
      {/* LEFT RAIL (attached + scrolls) */}
      <aside className="w-[440px] shrink-0 border-r border-slate-200 bg-white">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-5">
          <p className="text-sm font-semibold text-slate-900">Refine Changes</p>
          <p className="mt-1 text-xs text-slate-500">Describe changes, generate a patch, then apply.</p>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Brand Compliance: {score}% ✓</span>

            <button
              onClick={props.onRestoreLatest}
              disabled={props.versionsCount === 0}
              className="text-xs font-semibold text-slate-700 hover:underline disabled:opacity-40"
              title="Restore last snapshot"
            >
              Restore ({props.versionsCount})
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="h-[calc(100%-92px)] overflow-y-auto px-6 py-6">
          {/* Describe changes */}
          <div className="pb-6 border-b border-slate-200">
            <label className="text-xs font-semibold text-slate-600">Describe changes</label>

            <textarea
              value={props.describe}
              onChange={(e) => props.setDescribe(e.target.value)}
              placeholder={`Examples:
- Set headline to "Why Partner with Us"
- Make subheading shorter and more corporate
- Rewrite value point 2 to be more compliance-led
- Remove strong claims / guarantees`}
              className="mt-2 w-full h-28 resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-300"
            />

            <button
              onClick={runDescribe}
              disabled={requesting || !props.describe.trim()}
              className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {requesting ? "Generating patch..." : "Generate patch"}
            </button>

            {props.pendingPatchExists ? (
              <div className="mt-4 rounded-2xl bg-[#f6f8fd] ring-1 ring-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Proposed changes</p>

                <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
                  {(props.patchNotes?.length ? props.patchNotes : ["Patch generated"]).map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={props.onApplyPatch}
                    className="flex-1 rounded-xl bg-[#4f7dff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3f6eff]"
                  >
                    Apply
                  </button>
                  <button
                    onClick={props.onRejectPatch}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Fields */}
          <div className="pt-6">
            <p className="text-sm font-semibold text-slate-900">Content</p>

            <EditRow
              label="Eyebrow"
              value={b.eyebrow}
              onChange={(v) => props.setEditable((p) => (p ? { ...p, eyebrow: v } : p))}
              busy={improvingKey === "eyebrow"}
              onImprove={() =>
                runImprove("eyebrow", "eyebrow", b.eyebrow, (v) =>
                  props.setEditable((p) => (p ? { ...p, eyebrow: v } : p))
                )
              }
            />

            <EditRow
              label="Headline"
              value={b.headline}
              onChange={(v) => props.setEditable((p) => (p ? { ...p, headline: v } : p))}
              busy={improvingKey === "headline"}
              onImprove={() =>
                runImprove("headline", "headline", b.headline, (v) =>
                  props.setEditable((p) => (p ? { ...p, headline: v } : p))
                )
              }
            />

            <EditRow
              label="Subheading"
              value={b.subheading}
              multiline
              onChange={(v) => props.setEditable((p) => (p ? { ...p, subheading: v } : p))}
              busy={improvingKey === "subheading"}
              onImprove={() =>
                runImprove("subheading", "subheading", b.subheading, (v) =>
                  props.setEditable((p) => (p ? { ...p, subheading: v } : p))
                )
              }
            />

            <p className="mt-6 text-sm font-semibold text-slate-900">Value points</p>

            {b.valuePoints.map((vp, idx) => {
              const key = `vp-${idx}`;
              return (
                <div key={idx} className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600">Point {idx + 1}</p>
                    <button
                      className="text-xs font-semibold text-[#3b5bdb] hover:underline disabled:opacity-50"
                      disabled={improvingKey === key}
                      onClick={() =>
                        runImprove(key, `valuePoints.${idx}`, `${vp.title}\n${vp.text}`, (improved) => {
                          const [t, ...rest] = improved.split("\n");
                          const text = rest.join("\n").trim() || vp.text;

                          props.setEditable((p) => {
                            if (!p) return p;
                            const next = structuredClone(p);
                            next.valuePoints[idx].title = (t || vp.title).trim();
                            next.valuePoints[idx].text = text;
                            return next;
                          });
                        })
                      }
                    >
                      {improvingKey === key ? "Improving..." : "Improve with AI ✨"}
                    </button>
                  </div>

                  <input
                    value={vp.title}
                    onChange={(e) =>
                      props.setEditable((p) => {
                        if (!p) return p;
                        const next = structuredClone(p);
                        next.valuePoints[idx].title = e.target.value;
                        return next;
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300"
                  />

                  <textarea
                    value={vp.text}
                    onChange={(e) =>
                      props.setEditable((p) => {
                        if (!p) return p;
                        const next = structuredClone(p);
                        next.valuePoints[idx].text = e.target.value;
                        return next;
                      })
                    }
                    className="mt-2 w-full h-20 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300"
                  />

                  <div className="mt-2 text-[11px] text-slate-500">
                    Accent token: <span className="font-semibold">{vp.accent}</span>
                  </div>
                </div>
              );
            })}

            {/* Change log */}
            <div className="mt-7 pb-2">
              <p className="text-sm font-semibold text-slate-900">Change Log</p>
              {props.changeLog.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">No changes recorded yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {props.changeLog.slice(0, 12).map((c, i) => (
                    <li
                      key={i}
                      className="text-xs text-slate-700 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT SIDE (wireframe style: no boxed wrapper around preview area) */}
      <main className="flex-1 bg-[#f5f7fb]">
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="px-10 pt-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-[28px] leading-tight font-semibold text-slate-900">Block Submitted for Approval</h2>
                <p className="mt-2 text-sm text-slate-500">
                  This block is now under governance review before publishing.
                </p>
              </div>

              <button
                onClick={runSubmit}
                disabled={submitting || props.approvalStatus === "pending"}
                className="h-10 rounded-xl bg-[#4f7dff] px-4 text-sm font-semibold text-white hover:bg-[#3f6eff] disabled:opacity-50"
              >
                {submitting
                  ? "Submitting..."
                  : props.approvalStatus === "pending"
                  ? "Submitted"
                  : "Submit for Approval"}
              </button>
            </div>

            {/* Device toggles */}
            <div className="mt-7 flex items-center justify-center gap-4">
              <DeviceButton active={viewport === "mobile"} onClick={() => setViewport("mobile")} label="Mobile" glyph="▯" />
              <DeviceButton active={viewport === "tablet"} onClick={() => setViewport("tablet")} label="Tablet" glyph="▭" />
              <DeviceButton active={viewport === "desktop"} onClick={() => setViewport("desktop")} label="Desktop" glyph="▱" />
            </div>
          </div>

          {/* Big rounded canvas */}
          <div className="px-10 pb-10 pt-8">
            <div className="mx-auto" style={{ maxWidth: frameInnerMax }}>
              <div className="rounded-[56px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.12)] px-10 py-10">
                <iframe
                  title="preview"
                  className="w-full rounded-[28px] bg-white"
                  style={{ height: iframeHeight }}
                  sandbox=""
                  srcDoc={props.previewDoc}
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 px-2 text-xs text-slate-500">
                <span>This block is now under governance review before publishing.</span>
                <span>Version 1.0</span>
                <span>
                  Status: <span className={`font-semibold ${statusColor}`}>{statusText}</span>
                  {props.approvalId ? <span className="ml-2 text-slate-400">#{props.approvalId}</span> : null}
                </span>
              </div>

              <div className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-500 flex flex-wrap gap-10">
                <span>Brand Compliance: {score}% ✓</span>
                <span>Accessibility: WCAG AA ✓</span>
                <span>Design Tokens: Locked</span>
                <span>Restricted Scripts: Enabled ✓</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DeviceButton(props: { active: boolean; onClick: () => void; label: string; glyph: string }) {
  return (
    <button
      onClick={props.onClick}
      aria-label={props.label}
      title={props.label}
      className={[
        "h-9 w-9 rounded-lg grid place-items-center ring-1 transition",
        props.active
          ? "bg-white text-slate-900 ring-slate-200 shadow-sm"
          : "bg-transparent text-slate-500 ring-transparent hover:bg-white/70 hover:ring-slate-200",
      ].join(" ")}
    >
      <span className="text-base leading-none">{props.glyph}</span>
    </button>
  );
}

function EditRow(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onImprove: () => void;
  multiline?: boolean;
  busy?: boolean;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600">{props.label}</p>
        <button
          className="text-xs font-semibold text-[#3b5bdb] hover:underline disabled:opacity-50"
          onClick={props.onImprove}
          disabled={props.busy}
        >
          {props.busy ? "Improving..." : "Improve with AI ✨"}
        </button>
      </div>

      {props.multiline ? (
        <textarea
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className="mt-2 w-full h-20 resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-300"
        />
      ) : (
        <input
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-300"
        />
      )}
    </div>
  );
}