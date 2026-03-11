"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Generating from "./_components/Generating";
import type { BlockData } from "@/lib/types";

type Step = "form" | "generating";

type GenerateResponse = {
  name?: string;
  blockData?: BlockData;
  css?: string;
  notes?: string[];
};

const progressLabels = [
  "Analysing prompt...",
  "Applying Kiwa governance...",
  "Validating accessibility...",
  "Generating layout structure...",
  "Rendering preview...",
  "Finalising block...",
];

export default function NewBlockPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("form");

  const [blockName, setBlockName] = useState("Why Choose Kiwa Agri-Food");
  const [location, setLocation] = useState("Kiwa Agri-Food");
  const [prompt, setPrompt] = useState(
    'Create a "Why Choose Kiwa Agri-Food" content block. Include a strong headline, short introduction paragraph, and four value points. Each value point should use a different Kiwa brand colour accent. Include the supplied farmer image as a supporting visual. Maintain a professional, compliance-focused tone.'
  );

  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const progressLabel = useMemo(() => {
    if (progress < 15) return progressLabels[0];
    if (progress < 30) return progressLabels[1];
    if (progress < 45) return progressLabels[2];
    if (progress < 65) return progressLabels[3];
    if (progress < 85) return progressLabels[4];
    return progressLabels[5];
  }, [progress]);

  useEffect(() => {
    if (step !== "generating") return;
    if (progress >= 92) return;

    const timer = window.setInterval(() => {
      setProgress((p) => Math.min(p + Math.floor(Math.random() * 8) + 4, 92));
    }, 220);

    return () => window.clearInterval(timer);
  }, [step, progress]);

  async function handleGenerate() {
    setError(null);
    setIsGenerating(true);
    setStep("generating");
    setProgress(8);

    try {
      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockName, location, prompt }),
      });

      const generateJson = (await generateRes.json().catch(() => ({}))) as GenerateResponse;

      if (!generateRes.ok || !generateJson?.blockData) {
        throw new Error("Failed to generate block");
      }

      setProgress(96);

      const createRes = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: generateJson.blockData }),
      });

      const createJson = await createRes.json().catch(() => ({}));

      if (!createRes.ok || !createJson?.block?.id) {
        throw new Error(createJson?.error || "Failed to save generated block");
      }

      setProgress(100);

      window.setTimeout(() => {
        router.push(`/blocks/${createJson.block.id}`);
      }, 350);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
      setIsGenerating(false);
      setStep("form");
      setProgress(0);
    }
  }

  if (step === "generating") {
    return (
      <main className="min-h-screen bg-[#f5f7fb] px-6 py-10 md:px-10">
        <Generating progress={progress} label={progressLabel} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-6 py-10 md:px-10">
      <div className="mx-auto max-w-[1180px]">
        <div className="rounded-[36px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)] ring-1 ring-slate-200 overflow-hidden">
          <div className="grid lg:grid-cols-[1.05fr_.95fr]">
            <section className="px-8 py-10 md:px-12 md:py-12">
              <div className="max-w-[640px]">
                <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                  Visionir · Governed Block Creation
                </div>

                <h1 className="mt-5 text-[40px] leading-[1.05] font-semibold text-slate-900 md:text-[52px]">
                  Generate a governed content block
                </h1>

                <p className="mt-4 max-w-[58ch] text-[15px] leading-7 text-slate-600">
                  Enter the block context, location, and creative prompt. Visionir will generate
                  the content structure, apply governance rules, and prepare the block for review.
                </p>

                <div className="mt-8 grid gap-5">
                  <Field label="Block name">
                    <input
                      value={blockName}
                      onChange={(e) => setBlockName(e.target.value)}
                      placeholder="Why Choose Kiwa Agri-Food"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                    />
                  </Field>

                  <Field label="Placement / location">
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Homepage · Agri-Food section"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300"
                    />
                  </Field>

                  <Field label="AI prompt">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the content block you want to create..."
                      className="h-48 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-900 outline-none transition focus:border-slate-300"
                    />
                  </Field>
                </div>

                {error ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={
                      isGenerating ||
                      !blockName.trim() ||
                      !location.trim() ||
                      !prompt.trim()
                    }
                    className="rounded-2xl bg-[#4f7dff] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3f6eff] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGenerating ? "Generating..." : "Generate block"}
                  </button>

                  <p className="text-xs text-slate-500">
                    Brand rules, accessibility checks, and design tokens are applied automatically.
                  </p>
                </div>
              </div>
            </section>

            <aside className="border-t border-slate-200 bg-slate-50 px-8 py-10 lg:border-l lg:border-t-0 md:px-10 md:py-12">
              <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">Generation overview</p>

                <div className="mt-5 space-y-4">
                  <InfoRow
                    title="Governance"
                    text="Checks brand alignment, restricted language, token usage, and structural consistency."
                  />
                  <InfoRow
                    title="Accessibility"
                    text="Applies WCAG-aware layout and content patterns suitable for enterprise publishing."
                  />
                  <InfoRow
                    title="CMS readiness"
                    text="Creates a structured content block ready for review, approval, and deployment."
                  />
                </div>

                <div className="mt-6 rounded-2xl bg-[#f6f8fd] p-5 ring-1 ring-slate-200">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Current request
                  </p>

                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div>
                      <span className="font-semibold text-slate-900">Block:</span>{" "}
                      {blockName || "—"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">Location:</span>{" "}
                      {location || "—"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">Prompt length:</span>{" "}
                      {prompt.trim().length} characters
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoRow({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}