import { NextResponse } from "next/server";

type Accent = "blue" | "green" | "orange" | "purple";
const ACCENTS: Accent[] = ["blue", "green", "orange", "purple"];

type BlockData = {
  eyebrow: string;
  headline: string;
  subheading: string;
  imageUrl?: string;
  valuePoints: Array<{ title: string; text: string; accent: Accent }>;
};

function cleanSpaces(s: string) {
  return (s || "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .replace(/\s+\,/g, ",")
    .trim();
}

function clamp(s: string, max: number) {
  const t = cleanSpaces(s);
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

function improveText(input: string) {
  const s = cleanSpaces(input);
  if (!s) return s;

  return cleanSpaces(
    s
      .replace(/\bvery\b/gi, "")
      .replace(/\breally\b/gi, "")
      .replace(/\bjust\b/gi, "")
      .replace(/\bhelp\b/gi, "support")
      .replace(/\bstrong\b/gi, "robust")
      .replace(/\bconfidence\b/gi, "assurance")
      .replace(/\bmake sure\b/gi, "ensure")
      .replace(/\bclear\b/gi, "straightforward")
  );
}

/** Field improve that preserves newlines */
function improveFieldText(field: string, text: string) {
  if (text.includes("\n")) {
    const [first, ...rest] = text.split("\n");
    const second = rest.join("\n");
    const improved1 = clamp(improveText(first), 80);
    const improved2 = clamp(improveText(second), 200);
    return `${improved1}\n${improved2}`.trim();
  }

  const max =
    field === "eyebrow" ? 60 : field === "headline" ? 80 : field === "subheading" ? 220 : 240;

  return clamp(improveText(text), max);
}

function governBlock(block: BlockData) {
  const next = structuredClone(block);

  next.eyebrow = clamp(next.eyebrow ?? "", 60);
  next.headline = clamp(next.headline ?? "", 80);
  next.subheading = clamp(next.subheading ?? "", 220);

  if (!Array.isArray(next.valuePoints)) next.valuePoints = [];
  while (next.valuePoints.length < 4) {
    next.valuePoints.push({
      title: "Value point",
      text: "Description",
      accent: ACCENTS[next.valuePoints.length % ACCENTS.length],
    });
  }
  if (next.valuePoints.length > 4) next.valuePoints = next.valuePoints.slice(0, 4);

  next.valuePoints = next.valuePoints.map((vp, i) => ({
    title: clamp(vp?.title ?? "", 60),
    text: clamp(vp?.text ?? "", 180),
    accent: ACCENTS[i],
  }));

  return next;
}

function computeGovernance(block: BlockData) {
  const checks: Array<{ id: string; label: string; ok: boolean }> = [];

  checks.push({ id: "eyebrow_len", label: "Eyebrow ≤ 60 characters", ok: (block.eyebrow || "").length <= 60 });
  checks.push({ id: "headline_len", label: "Headline ≤ 80 characters", ok: (block.headline || "").length <= 80 });
  checks.push({ id: "subheading_len", label: "Subheading ≤ 220 characters", ok: (block.subheading || "").length <= 220 });

  checks.push({ id: "vp_count", label: "Exactly 4 value points", ok: Array.isArray(block.valuePoints) && block.valuePoints.length === 4 });

  const accentsOk =
    Array.isArray(block.valuePoints) &&
    block.valuePoints.length === 4 &&
    block.valuePoints.every((vp, i) => vp.accent === ACCENTS[i]);

  checks.push({ id: "accent_order", label: "Accent tokens enforced (blue/green/orange/purple)", ok: !!accentsOk });

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

function applyPatchToBlock(prev: BlockData, patch: any): BlockData {
  const next = structuredClone(prev);

  if (typeof patch?.eyebrow === "string") next.eyebrow = patch.eyebrow;
  if (typeof patch?.headline === "string") next.headline = patch.headline;
  if (typeof patch?.subheading === "string") next.subheading = patch.subheading;

  if (Array.isArray(patch?.valuePoints)) {
    next.valuePoints = patch.valuePoints;
  } else if (patch?.valuePoints && typeof patch.valuePoints === "object") {
    for (const [k, v] of Object.entries(patch.valuePoints)) {
      const idx = Number(k);
      if (!Number.isFinite(idx) || !next.valuePoints?.[idx]) continue;
      const item: any = v;
      if (typeof item.title === "string") next.valuePoints[idx].title = item.title;
      if (typeof item.text === "string") next.valuePoints[idx].text = item.text;
      if (typeof item.accent === "string") next.valuePoints[idx].accent = item.accent;
    }
  }

  return next;
}

/** --------- Describe Instruction Parser --------- */

function extractQuoted(s: string) {
  // "..." or '...'
  const m = s.match(/["']([^"']+)["']/);
  return m ? m[1] : null;
}

function parseSetField(note: string, field: "eyebrow" | "headline" | "subheading") {
  // supports:
  // headline: "Text"
  // set headline to "Text"
  const re1 = new RegExp(`${field}\\s*:\\s*(.+)$`, "i");
  const re2 = new RegExp(`set\\s+${field}\\s+to\\s+(.+)$`, "i");

  const m = note.match(re1) || note.match(re2);
  if (!m) return null;

  const raw = m[1].trim();
  const q = extractQuoted(raw);
  return cleanSpaces(q ?? raw);
}

function parseReplace(note: string) {
  // replace "a" with "b"
  const m = note.match(/replace\s+["']([^"']+)["']\s+with\s+["']([^"']+)["']/i);
  if (!m) return null;
  return { from: m[1], to: m[2] };
}

function parseRemove(note: string) {
  // remove "word"
  const m = note.match(/remove\s+["']([^"']+)["']/i);
  if (!m) return null;
  return m[1];
}

function parseRewriteValuePoint(note: string) {
  // rewrite value point 2 to: "..."
  const m = note.match(/rewrite\s+(?:value\s+point|vp|point)\s*(\d)\s*(?:to|:)\s*(.+)$/i);
  if (!m) return null;
  const idx = Number(m[1]) - 1;
  if (!Number.isFinite(idx) || idx < 0 || idx > 3) return null;

  const raw = m[2].trim();
  const q = extractQuoted(raw);
  const text = cleanSpaces(q ?? raw);

  // If they give "Title — Body" split it
  const parts = text.split("—").map((p) => p.trim());
  if (parts.length >= 2) {
    return { idx, title: clamp(parts[0], 60), text: clamp(parts.slice(1).join("—").trim(), 180) };
  }

  // otherwise treat as body
  return { idx, title: null, text: clamp(text, 180) };
}

function shorten(s: string, max: number) {
  const t = cleanSpaces(s);
  if (t.length <= max) return t;
  // naive sentence cut
  const cut = t.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf("."), cut.lastIndexOf(";"), cut.lastIndexOf("—"));
  const out = lastStop > 60 ? cut.slice(0, lastStop + 1) : cut;
  return clamp(out, max);
}

function buildPatchFromDescribe(note: string, block?: BlockData) {
  const patch: any = {};
  const notes: string[] = [];

  if (!block) {
    return { patch: {}, notes: ["No block context provided; no changes proposed"] };
  }

  const n = note.trim();
  const lower = n.toLowerCase();

  // 1) Direct set field commands
  const setEyebrow = parseSetField(n, "eyebrow");
  if (setEyebrow) {
    patch.eyebrow = clamp(setEyebrow, 60);
    notes.push("Set eyebrow");
  }

  const setHeadline = parseSetField(n, "headline");
  if (setHeadline) {
    patch.headline = clamp(setHeadline, 80);
    notes.push("Set headline");
  }

  const setSubheading = parseSetField(n, "subheading");
  if (setSubheading) {
    patch.subheading = clamp(setSubheading, 220);
    notes.push("Set subheading");
  }

  // 2) Replace / Remove (applied across all copy fields)
  const rep = parseReplace(n);
  if (rep) {
    const applyRep = (s: string) => s.replaceAll(rep.from, rep.to);
    patch.eyebrow = clamp(applyRep(block.eyebrow), 60);
    patch.headline = clamp(applyRep(block.headline), 80);
    patch.subheading = clamp(applyRep(block.subheading), 220);
    patch.valuePoints = block.valuePoints.map((vp, i) => ({
      title: clamp(applyRep(vp.title), 60),
      text: clamp(applyRep(vp.text), 180),
      accent: ACCENTS[i],
    }));
    notes.push(`Replaced "${rep.from}" → "${rep.to}"`);
  }

  const rm = parseRemove(n);
  if (rm) {
    const re = new RegExp(`\\b${rm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const applyRm = (s: string) => cleanSpaces(s.replace(re, ""));
    patch.eyebrow = clamp(applyRm(block.eyebrow), 60);
    patch.headline = clamp(applyRm(block.headline), 80);
    patch.subheading = clamp(applyRm(block.subheading), 220);
    patch.valuePoints = block.valuePoints.map((vp, i) => ({
      title: clamp(applyRm(vp.title), 60),
      text: clamp(applyRm(vp.text), 180),
      accent: ACCENTS[i],
    }));
    notes.push(`Removed "${rm}"`);
  }

  // 3) Shorten / formalise / compliance emphasis
  if (lower.includes("shorten") || lower.includes("more concise")) {
    patch.subheading = shorten(block.subheading, 160);
    notes.push("Shortened subheading");
  }

  if (lower.includes("more formal") || lower.includes("more corporate") || lower.includes("enterprise")) {
    patch.eyebrow = "CERTIFICATION AND ASSURANCE FOR FOOD, FEED AND AGRICULTURE";
    patch.headline = "Assurance You Can Rely On";
    patch.subheading = clamp(improveText(block.subheading), 220);
    notes.push("Applied corporate tone");
  }

  if (lower.includes("compliance")) {
    const base = clamp(improveText(patch.subheading ?? block.subheading), 220);
    patch.subheading = base.toLowerCase().includes("compliance")
      ? base
      : clamp(`${base} Focused on compliance and assurance.`, 220);
    notes.push("Emphasised compliance");
  }

  if (lower.includes("ukas") || lower.includes("accredit")) {
    patch.valuePoints = {
      0: {
        title: "UKAS-accredited assurance",
        text: "Independent certification delivered under robust accreditation and technical governance.",
      },
    };
    notes.push("Emphasised accreditation (VP1)");
  }

  // 4) Rewrite a specific value point
  const rewrite = parseRewriteValuePoint(n);
  if (rewrite) {
    patch.valuePoints = patch.valuePoints && typeof patch.valuePoints === "object" ? patch.valuePoints : {};
    patch.valuePoints[rewrite.idx] = {
      ...(rewrite.title ? { title: rewrite.title } : {}),
      ...(rewrite.text ? { text: rewrite.text } : {}),
    };
    notes.push(`Rewrote value point ${rewrite.idx + 1}`);
  }

  // 5) Fallback: if nothing matched, do a safe “polish everything”
  if (notes.length === 0 && Object.keys(patch).length === 0) {
    patch.eyebrow = clamp(improveText(block.eyebrow), 60);
    patch.headline = clamp(improveText(block.headline), 80);
    patch.subheading = clamp(improveText(block.subheading), 220);
    patch.valuePoints = block.valuePoints.map((vp, i) => ({
      title: clamp(improveText(vp.title), 60),
      text: clamp(improveText(vp.text), 180),
      accent: ACCENTS[i],
    }));
    notes.push("Applied governed polish to all copy");
  }

  return { patch, notes };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const mode = (body as any)?.mode;
  const text = typeof (body as any)?.text === "string" ? (body as any).text : "";
  const field = typeof (body as any)?.field === "string" ? (body as any).field : "";
  const block = (body as any)?.block as BlockData | undefined;

  if (mode === "field") {
    const improved = improveFieldText(field, text);
    return NextResponse.json({ field, improved });
  }

  if (mode === "describe") {
    const { patch, notes } = buildPatchFromDescribe(text, block);

    let governance = null;
    if (block) {
      const after = governBlock(applyPatchToBlock(block, patch));
      governance = computeGovernance(after);
    }

    return NextResponse.json({ patch, notes, governance });
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST { mode: field|describe, field?, text, block? }" });
}