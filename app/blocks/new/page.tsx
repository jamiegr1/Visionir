"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Generating from "./_components/Generating";
import ReviewEdit from "./_components/ReviewEdit";

/** ---------------- Types ---------------- */

export type Accent = "blue" | "green" | "orange" | "purple";

export type ValuePoint = {
  title: string;
  text: string;
  accent: Accent;
};

export type BlockData = {
  eyebrow: string;
  headline: string;
  subheading: string;
  imageUrl?: string;
  valuePoints: ValuePoint[];
};

type Generated = {
  name: string;
  blockData: BlockData;
  css: string;
  notes?: string[];
};

type Step = "create" | "generating" | "review";

type Governance = {
  score: number;
  checks: Array<{ id: string; label: string; ok: boolean }>;
  bannedHit?: string | null;
} | null;

/** ---------------- Helpers ---------------- */

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

function applyPatch(prev: BlockData, patch: any): BlockData {
  const next = structuredClone(prev);

  if (typeof patch?.eyebrow === "string") next.eyebrow = patch.eyebrow;
  if (typeof patch?.headline === "string") next.headline = patch.headline;
  if (typeof patch?.subheading === "string") next.subheading = patch.subheading;

  if (Array.isArray(patch?.valuePoints)) {
    next.valuePoints = patch.valuePoints;
  } else if (patch?.valuePoints && typeof patch.valuePoints === "object") {
    for (const [k, v] of Object.entries(patch.valuePoints)) {
      const idx = Number(k);
      if (!Number.isFinite(idx) || !next.valuePoints[idx]) continue;
      const item: any = v;
      if (typeof item.title === "string") next.valuePoints[idx].title = item.title;
      if (typeof item.text === "string") next.valuePoints[idx].text = item.text;
      if (typeof item.accent === "string") next.valuePoints[idx].accent = item.accent;
    }
  }

  return next;
}

function computeGovernanceLocal(block: BlockData): Governance {
  const checks: Array<{ id: string; label: string; ok: boolean }> = [];

  checks.push({ id: "eyebrow_len", label: "Eyebrow ≤ 60 characters", ok: (block.eyebrow || "").length <= 60 });
  checks.push({ id: "headline_len", label: "Headline ≤ 80 characters", ok: (block.headline || "").length <= 80 });
  checks.push({ id: "subheading_len", label: "Subheading ≤ 220 characters", ok: (block.subheading || "").length <= 220 });

  checks.push({ id: "vp_count", label: "Exactly 4 value points", ok: Array.isArray(block.valuePoints) && block.valuePoints.length === 4 });

  const accents = ["blue", "green", "orange", "purple"];
  const accentOk =
    Array.isArray(block.valuePoints) &&
    block.valuePoints.length === 4 &&
    block.valuePoints.every((vp, i) => vp.accent === accents[i]);
  checks.push({ id: "accent_order", label: "Accent tokens enforced (blue/green/orange/purple)", ok: !!accentOk });

  const bannedWords = ["cheap", "guarantee", "best in class"];
  const joined = [
    block.eyebrow,
    block.headline,
    block.subheading,
    ...(block.valuePoints || []).flatMap((v) => [v.title, v.text]),
  ]
    .join(" ")
    .toLowerCase();
  const bannedHit = bannedWords.find((w) => joined.includes(w));
  checks.push({ id: "banned_words", label: "No banned claims/phrases", ok: !bannedHit });

  const passed = checks.filter((c) => c.ok).length;
  const score = Math.round((passed / checks.length) * 100);

  return { score, checks, bannedHit: bannedHit || null };
}

/** ---------------- Page ---------------- */

export default function CreateBlockPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("create");

  const [blockName, setBlockName] = useState("Why Choose Kiwa Agri-Food");
  const [usedFor, setUsedFor] = useState("Food, Feed & Agriculture");
  const [category, setCategory] = useState("Why Choose Us");
  const [prompt, setPrompt] = useState(
    [
      'Create a “Why Choose Kiwa Agri Food” content block.',
      "Include a strong headline, short introduction paragraph, and four value points.",
      "Each value point should use a different Kiwa brand colour accent.",
      "Include the supplied farmer image as a supporting visual.",
      "Maintain a professional, compliance-focused tone.",
    ].join("\n")
  );

  const GENERATE_DURATION_MS = 7000;

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Generated | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("Generating block structure… 0%");

  const [editable, setEditable] = useState<BlockData | null>(null);
  const [describe, setDescribe] = useState("");

  const [pendingPatch, setPendingPatch] = useState<any | null>(null);
  const [patchNotes, setPatchNotes] = useState<string[]>([]);
  const [changeLog, setChangeLog] = useState<string[]>([]);
  const [governance, setGovernance] = useState<Governance>(null);
  const [versions, setVersions] = useState<Array<{ ts: number; block: BlockData; notes: string[] }>>([]);

  const [approvalStatus, setApprovalStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");
  const [approvalId, setApprovalId] = useState<string | null>(null);

  const runIdRef = useRef(0);

  const previewDoc = useMemo(() => {
    if (!editable || !data) return "";
    const html = renderHtml(editable);

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>${data.css}</style>
</head>
<body>${html}</body>
</html>`;
  }, [editable, data]);

  async function onGenerate() {
    setError(null);
    setLoading(true);
    setStep("generating");

    setPendingPatch(null);
    setPatchNotes([]);
    setChangeLog([]);
    setVersions([]);
    setApprovalStatus("none");
    setApprovalId(null);

    const myRun = ++runIdRef.current;

    setProgress(0);
    setProgressLabel("Generating block structure… 0%");

    const START = performance.now();
    const tick = (now: number) => {
      if (runIdRef.current !== myRun) return;
      const elapsed = now - START;
      const pct = Math.min(100, Math.round((elapsed / GENERATE_DURATION_MS) * 100));
      setProgress(pct);
      setProgressLabel(`Generating block structure… ${pct}%`);
      if (pct < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    await new Promise((r) => setTimeout(r, GENERATE_DURATION_MS));
    if (runIdRef.current !== myRun) return;

    const mock: Generated = {
      name: blockName,
      css: `
.visionir-wrap{padding:40px 0;font-family:Inter,system-ui,Arial;}
.visionir-inner{max-width:1100px;margin:0 auto;padding:0 24px;}
.visionir-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:28px;align-items:center;}
.visionir-eyebrow{letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:#3b5bdb;font-weight:800;}
.visionir-h{margin:.35rem 0 0;font-size:44px;line-height:1.05;font-weight:900;color:#0f172a;}
.visionir-sub{margin:.85rem 0 0;color:#475569;font-size:15px;line-height:1.6;max-width:54ch;}
.visionir-cards{margin-top:18px;display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.visionir-card{border:1px solid #e2e8f0;border-radius:14px;padding:14px 14px 12px;background:#fff;}
.visionir-card .t{font-weight:900;color:#0f172a;margin:0 0 6px;font-size:14px;}
.visionir-card .p{margin:0;color:#475569;font-size:13px;line-height:1.5;}
.visionir-img img{width:100%;height:360px;object-fit:cover;border-radius:18px;box-shadow:0 18px 60px rgba(15,23,42,.15);}
.ac-blue{box-shadow:inset 3px 0 0 #3b5bdb;}
.ac-green{box-shadow:inset 3px 0 0 #16a34a;}
.ac-orange{box-shadow:inset 3px 0 0 #f59e0b;}
.ac-purple{box-shadow:inset 3px 0 0 #7c3aed;}
@media(max-width:900px){.visionir-grid{grid-template-columns:1fr}.visionir-h{font-size:36px}.visionir-img img{height:300px}}
      `.trim(),
      blockData: {
        eyebrow: "WHY CHOOSE KIWA AGRI-FOOD",
        headline: "Why Partner with Us",
        subheading:
          "From accredited certification to tailored technical support, we help you strengthen compliance, credibility, and growth.",
        imageUrl: "/farmer.jpg",
        valuePoints: [
          { title: "Accredited confidence", text: "UKAS-accredited certification delivered by technical specialists.", accent: "blue" },
          { title: "Practical support", text: "Clear guidance and responsive service across your audit journey.", accent: "green" },
          { title: "Risk reduction", text: "Robust processes that help protect your brand and supply chain.", accent: "orange" },
          { title: "Global credibility", text: "Recognised assurance that builds trust with buyers and regulators.", accent: "purple" },
        ],
      },
    };

    setData(mock);
    setEditable(mock.blockData);
    setGovernance(computeGovernanceLocal(mock.blockData));

    setLoading(false);
    setStep("review");
  }

  async function improveField(field: string, text: string, apply: (improved: string) => void) {
    const res = await fetch("/api/refine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "field", field, text }),
    });

    if (!res.ok) {
      console.error("Improve failed", await res.text());
      return;
    }

    const json = (await res.json()) as { field: string; improved: string };
    apply(json.improved ?? text);
  }

  async function requestDescribeChanges() {
    if (!editable) return;
    const note = describe.trim();
    if (!note) return;

    const res = await fetch("/api/refine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "describe", text: note, block: editable }),
    });

    if (!res.ok) {
      console.error("Describe failed", await res.text());
      return;
    }

    const json = (await res.json()) as { patch: any; notes?: string[]; governance?: Governance };

    setPendingPatch(json.patch);
    setPatchNotes(json.notes ?? []);
    setGovernance(json.governance ?? null);
  }

  function snapshot(notes: string[]) {
    if (!editable) return;
    setVersions((v) => [{ ts: Date.now(), block: structuredClone(editable), notes }, ...v]);
  }

  function applyPendingPatch() {
    if (!pendingPatch || !editable) return;

    snapshot(patchNotes.length ? patchNotes : ["Applied patch"]);

    const next = applyPatch(editable, pendingPatch);
    setEditable(next);

    setGovernance(computeGovernanceLocal(next));
    setChangeLog((p) => [...(patchNotes.length ? patchNotes : ["Applied patch"]), ...p]);

    setPendingPatch(null);
    setPatchNotes([]);
    setDescribe("");
  }

  function rejectPendingPatch() {
    setPendingPatch(null);
    setPatchNotes([]);
    setDescribe("");
    if (editable) setGovernance(computeGovernanceLocal(editable));
  }

  function restoreLatest() {
    const latest = versions[0];
    if (!latest) return;
    setEditable(structuredClone(latest.block));
    setGovernance(computeGovernanceLocal(latest.block));
    setChangeLog((p) => [`Restored previous version`, ...p]);
    setVersions((v) => v.slice(1));
  }

  async function submitForApproval() {
    if (!data || !editable) return;

    const html = renderHtml(editable);
    const embed = `<!-- Visionir Embed (MVP) -->
<style>${data.css}</style>
${html}`;

    const payload = {
      submittedBy: "Jamie",
      blockName,
      usedFor,
      category,
      block: editable,
      embed,
      governance: governance ?? computeGovernanceLocal(editable),
      changeLog: changeLog.slice(0, 50),
      createdAt: new Date().toISOString(),
    };

    const res = await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Approval submit failed", await res.text());
      return;
    }

    const json = (await res.json()) as { ok: boolean; approvalId: string; status: "pending" };

    setApprovalStatus("pending");
    setApprovalId(json.approvalId);
    setChangeLog((p) => [`Submitted for approval (#${json.approvalId})`, ...p]);

    router.push(`/approvals/${json.approvalId}`);
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <TopBar step={step} />

          {/* IMPORTANT: full width container for review */}
          {step === "review" ? (
            <ReviewEdit
              editable={editable!}
              setEditable={setEditable}
              previewDoc={previewDoc}
              describe={describe}
              setDescribe={setDescribe}
              improveField={improveField}
              requestDescribeChanges={requestDescribeChanges}
              pendingPatchExists={!!pendingPatch}
              onApplyPatch={applyPendingPatch}
              onRejectPatch={rejectPendingPatch}
              patchNotes={patchNotes}
              governance={governance ?? computeGovernanceLocal(editable!)}
              versionsCount={versions.length}
              onRestoreLatest={restoreLatest}
              approvalStatus={approvalStatus}
              approvalId={approvalId}
              onSubmitForApproval={submitForApproval}
              changeLog={changeLog}
            />
          ) : (
            <div className="px-6 py-10">
              <div className="mx-auto max-w-6xl">
                {step === "create" && (
                  <CreateCard
                    blockName={blockName}
                    usedFor={usedFor}
                    category={category}
                    prompt={prompt}
                    setBlockName={setBlockName}
                    setUsedFor={setUsedFor}
                    setCategory={setCategory}
                    setPrompt={setPrompt}
                    loading={loading}
                    error={error}
                    onGenerate={onGenerate}
                    onCancel={() => {
                      runIdRef.current++;
                      setError(null);
                      setData(null);
                      setEditable(null);
                      setLoading(false);
                      setProgress(0);
                      setProgressLabel("Generating block structure… 0%");
                    }}
                  />
                )}

                {step === "generating" && <Generating progress={progress} label={progressLabel} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------- Step 1 UI -------------------- */

function CreateCard(props: any) {
  return (
    <div className="mx-auto w-full max-w-[760px] rounded-[28px] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200">
      <div className="px-10 py-10">
        <Field label="Block Name">
          <Input value={props.blockName} onChange={props.setBlockName} />
        </Field>

        <Field label="Where will this block be used">
          <Input value={props.usedFor} onChange={props.setUsedFor} />
        </Field>

        <Field label="Category">
          <Input value={props.category} onChange={props.setCategory} />
        </Field>

        <Field label="AI Prompt">
          <Textarea value={props.prompt} onChange={props.setPrompt} />
        </Field>

        {props.error && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {props.error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={props.onGenerate}
            disabled={props.loading}
            className="h-11 min-w-[180px] rounded-xl bg-[#4f7dff] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#3f6eff] disabled:opacity-60"
          >
            {props.loading ? "Generating..." : "Generate Block"}
          </button>

          <button
            type="button"
            onClick={props.onCancel}
            className="h-11 min-w-[140px] rounded-xl bg-[#eef2ff] px-5 text-sm font-semibold text-[#3b5bdb] hover:bg-[#e6ebff]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Shared UI bits -------------------- */

function TopBar({ step }: { step: Step }) {
  const label =
    step === "create"
      ? "Step 1 of 3"
      : step === "generating"
      ? "Step 2 of 3 - Generating"
      : "Step 3 of 3 - Review & Edit";

  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100" aria-label="Menu">
            <span className="text-slate-600">≡</span>
          </button>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Create Block</p>
            <span className="text-slate-300">•</span>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <IconButton label="Search" glyph="⌕" />
          <IconButton label="Help" glyph="?" />
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="sticky top-0 h-screen w-[72px] border-r border-slate-200 bg-white">
      <div className="flex h-full flex-col items-center py-4">
        <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-[#eef2ff] text-[#3b5bdb] font-bold">
          V
        </div>

        <nav className="flex flex-1 flex-col items-center gap-2">
          <SideIcon active glyph="⌁" label="Dashboard" />
          <SideIcon glyph="▦" label="Blocks" />
          <SideIcon glyph="✓" label="Approvals" />
          <SideIcon glyph="≋" label="Activity" />
          <SideIcon glyph="⚙" label="Settings" />
        </nav>

        <div className="mt-auto grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200">
          <span className="text-xs font-semibold">ki</span>
        </div>
      </div>
    </aside>
  );
}

function SideIcon({ glyph, label, active }: { glyph: string; label: string; active?: boolean }) {
  return (
    <button
      className={[
        "relative grid h-10 w-10 place-items-center rounded-xl transition",
        active ? "bg-[#eef2ff] text-[#3b5bdb]" : "text-slate-500 hover:bg-slate-100",
      ].join(" ")}
      title={label}
      aria-label={label}
    >
      <span className="text-sm">{glyph}</span>
      {active ? <span className="absolute left-0 h-6 w-1 rounded-r bg-[#4f7dff]" /> : null}
    </button>
  );
}

function IconButton({ label, glyph }: { label: string; glyph: string }) {
  return (
    <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100" aria-label={label} title={label}>
      <span className="text-slate-600">{glyph}</span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <div className="mt-2">{children}</div>
      <div className="mt-5 h-px w-full bg-slate-200" />
    </div>
  );
}

function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-transparent bg-transparent px-0 py-1 text-[15px] text-slate-600 outline-none focus:text-slate-900"
    />
  );
}

function Textarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-28 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-[14px] leading-relaxed text-slate-700 outline-none focus:border-slate-300"
    />
  );
}