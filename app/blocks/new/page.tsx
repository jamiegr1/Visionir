"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Generating from "./_components/Generating";
import type { BlockData } from "@/lib/types";

type Step = "context" | "instructions" | "generating";
type ImageSourceMode = "none" | "upload" | "gallery";

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

const governanceChecks = [
  "Enforce Brand Typography",
  "Enforce Colour System",
  "Enforce Spacing Guidelines",
  "Enforce WCAG AA Accessibility",
  "Optimise for Core Web Vitals",
  "Kiwa Language & Tone",
  "Validate Semantic HTML Structure",
  "Ensure Mobile Responsiveness",
  "Asset Performance Optimisation",
];

const contentLengthOptions = ["Short", "Standard", "Detailed"];

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
    <div className="relative flex h-12 w-full items-center justify-center">
      {active ? (
        <span className="absolute -right-[14px] top-1/2 h-[45px] w-[3px] -translate-y-1/2 rounded-full bg-[#4f6fff]" />
      ) : null}

      <button
        type="button"
        className={cx(
          "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200",
          active
            ? "bg-[#f2f5ff] text-[#5b7cff]"
            : "text-[#8f98b3] hover:bg-[#f6f8fc] hover:text-[#6f7895]"
        )}
      >
        {children}
      </button>
    </div>
  );
}

function LeftSidebar() {
  return (
    <aside className="flex w-[78px] shrink-0 flex-col items-center border-r border-[#e8ebf3] bg-white py-5">
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

      <div className="flex flex-1 flex-col items-center gap-4">
        <NavIcon active>
          <svg
            className="h-[18px] w-[18px]"
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
            className="h-[18px] w-[18px]"
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
            className="h-[18px] w-[18px]"
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
            className="h-[18px] w-[18px]"
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
            className="h-[18px] w-[18px]"
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
            className="h-[18px] w-[18px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M5 7h14M5 12h14M5 17h8" />
          </svg>
        </NavIcon>

        <NavIcon>
          <svg
            className="h-[18px] w-[18px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <rect x="5" y="5" width="14" height="14" rx="3" />
            <path d="M8 8h8v8H8z" />
          </svg>
        </NavIcon>

        <NavIcon>
          <svg
            className="h-[18px] w-[18px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M6 19V5M12 19V9M18 19V12" />
          </svg>
        </NavIcon>
      </div>
    </aside>
  );
}

function TopBar({
  title,
  stepLabel,
}: {
  title: string;
  stepLabel: string;
}) {
  return (
    <div className="sticky top-0 z-40 shrink-0 border-b border-[#e8ebf3] bg-[#f6f7fb]/95 px-8 py-4 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#edf0f6] bg-white text-[#98a1ba] transition hover:text-slate-700"
          >
            <svg
              className="h-[18px] w-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M5 7h14M5 12h14M5 17h14" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-[17px] font-semibold tracking-[-0.02em] text-[#111827] md:text-[18px]">
              {title}
            </h1>
            <span className="text-[#b8c0d6]">•</span>
            <span className="text-[13px] font-medium text-[#7d859d]">
              {stepLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#edf0f6] bg-white text-[#98a1ba] transition hover:text-slate-700"
          >
            <svg
              className="h-[16px] w-[16px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="11" cy="11" r="6" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </button>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#edf0f6] bg-white text-[#98a1ba] transition hover:text-slate-700"
          >
            <svg
              className="h-[16px] w-[16px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressHeader({
  currentStep,
  title,
  subtitle,
}: {
  currentStep: 1 | 2 | 3;
  title: string;
  subtitle: string;
}) {
  const percent = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;

  return (
    <div className="mb-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <div className="text-[20px] font-semibold tracking-[-0.03em] text-[#111827]">
            {title}
          </div>
          <p className="mt-1 text-[13px] text-[#7d859d]">{subtitle}</p>
        </div>

        <div className="shrink-0 rounded-full border border-[#ebeef5] bg-[#fafbfc] px-3 py-1.5 text-[12px] font-medium text-[#7b849d]">
          Step {currentStep} of 3
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-[#e6eaf2]">
          <div
            className="h-full rounded-full bg-[#3F5FF0] transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        <span className="text-[12px] font-medium text-[#98a1ba]">
          {percent}%
        </span>
      </div>
    </div>
  );
}

function FormRow({
  label,
  children,
  multiline = false,
  helper,
}: {
  label: string;
  children: React.ReactNode;
  multiline?: boolean;
  helper?: string;
}) {
  return (
    <div
      className={cx(
        "border-t border-[#e9edf5] px-6 first:border-t-0",
        multiline ? "py-4" : "py-3"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="text-[14px] font-medium text-[#20263a]">{label}</div>
        {helper ? (
          <div className="text-[12px] font-medium text-[#98a1ba]">{helper}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-[#e3e7f2] bg-[#fafbff] px-4 py-3 text-[14px] font-medium text-[#2c3348] outline-none transition placeholder:text-[#b6bdd2] hover:border-[#d2d8ea] focus:border-[#5b7cff] focus:bg-white focus:shadow-[0_0_0_4px_rgba(91,124,255,0.08)]"
    />
  );
}

function SegmentedOptions({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => {
        const selected = value === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cx(
              "rounded-xl border px-4 py-3 text-center text-[13px] font-semibold transition-all duration-200",
              selected
                ? "border-[#3F5FF0] bg-[#eef2ff] text-[#2e4fd3]"
                : "border-[#e3e7f2] bg-[#fafbff] text-[#55607d] hover:border-[#cfd6eb] hover:bg-white"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function ImageSourceSelector({
  mode,
  setMode,
  uploadedFileName,
  onFileChange,
}: {
  mode: ImageSourceMode;
  setMode: (mode: ImageSourceMode) => void;
  uploadedFileName: string;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <button
        type="button"
        onClick={() => setMode("none")}
        className={cx(
          "flex items-start justify-between gap-3 rounded-[16px] border px-4 py-3 text-left transition-all",
          mode === "none"
            ? "border-[#5b7cff] bg-[#f4f7ff]"
            : "border-[#e6eaf3] bg-white hover:border-[#d7def1] hover:bg-[#fafbff]"
        )}
      >
        <div>
          <div className="text-[13px] font-semibold text-[#20263a]">
            No Image
          </div>

          <p className="mt-1.5 text-[11px] leading-4 text-[#7d859d]">
            Generate this block without an accompanying image.
          </p>
        </div>

        <span
          className={cx(
            "mt-0.5 h-4 w-4 shrink-0 rounded-full border transition-all",
            mode === "none"
              ? "border-[#5b7cff] bg-[#5b7cff] shadow-[inset_0_0_0_4px_white]"
              : "border-[#cbd4ea] bg-white"
          )}
        />
      </button>

      <div
        onClick={() => setMode("upload")}
        className={cx(
          "flex cursor-pointer items-start justify-between gap-3 rounded-[16px] border px-4 py-3 transition-all",
          mode === "upload"
            ? "border-[#5b7cff] bg-[#f4f7ff]"
            : "border-[#e6eaf3] bg-white hover:border-[#d7def1] hover:bg-[#fafbff]"
        )}
      >
        <div className="w-full">
          <div className="flex items-start justify-between gap-3">
            <div className="text-[13px] font-semibold text-[#20263a]">
              Upload Brand Image
            </div>

            <span
              className={cx(
                "mt-0.5 h-4 w-4 shrink-0 rounded-full border transition-all",
                mode === "upload"
                  ? "border-[#5b7cff] bg-[#5b7cff] shadow-[inset_0_0_0_4px_white]"
                  : "border-[#cbd4ea] bg-white"
              )}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <label
              className={cx(
                "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-all",
                mode === "upload"
                  ? "border-[#5b7cff] bg-[#5b7cff] text-white hover:bg-[#496bf4]"
                  : "border-[#d9deea] bg-[#f7f9fc] text-[#4f5d7b] hover:bg-[#eef2f8]"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
              >
                <path
                  d="M12 16V6m0 0-4 4m4-4 4 4M5 18h14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              Choose File

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              />
            </label>

            <div className="text-[11px] font-medium text-[#8d96af]">
              {uploadedFileName || "No file selected"}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setMode("gallery")}
        className={cx(
          "flex items-start justify-between gap-3 rounded-[16px] border px-4 py-3 text-left transition-all",
          mode === "gallery"
            ? "border-[#5b7cff] bg-[#f4f7ff]"
            : "border-[#e6eaf3] bg-white hover:border-[#d7def1] hover:bg-[#fafbff]"
        )}
      >
        <div>
          <div className="text-[13px] font-semibold text-[#20263a]">
            Auto Select From Brand Gallery
          </div>

          <p className="mt-1.5 text-[11px] leading-4 text-[#7d859d]">
            Automatically select the most suitable image from your brand
            gallery.
          </p>
        </div>

        <span
          className={cx(
            "mt-0.5 h-4 w-4 shrink-0 rounded-full border transition-all",
            mode === "gallery"
              ? "border-[#5b7cff] bg-[#5b7cff] shadow-[inset_0_0_0_4px_white]"
              : "border-[#cbd4ea] bg-white"
          )}
        />
      </button>
    </div>
  );
}

export default function NewBlockPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("context");

  const [blockName, setBlockName] = useState("Why Choose Kiwa Agri-Food");
  const [blockType, setBlockType] = useState("Why Choose Us");
  const [location, setLocation] = useState("Food, Feed & Agriculture");
  const [contentLength, setContentLength] = useState("Standard");

  const [imageSourceMode, setImageSourceMode] =
    useState<ImageSourceMode>("none");
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);

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

  function handleContinue() {
    setError(null);
    setStep("instructions");
  }

  function handleBack() {
    setError(null);
    setStep("context");
  }

  async function handleGenerate() {
    setError(null);
    setIsGenerating(true);
    setStep("generating");
    setProgress(8);

    try {
      const enrichedPrompt = `
Block Name: ${blockName}
Block Type: ${blockType}
Location / Business Area: ${location}
Content Length: ${contentLength}
Image Source: ${
        imageSourceMode === "none"
          ? "No Image"
          : imageSourceMode === "upload"
            ? uploadedImageFile?.name
              ? `Provided Brand Image (${uploadedImageFile.name})`
              : "Provided Brand Image"
            : "Visionir Brand Gallery Selection"
      }

Generation Request:
${prompt}
      `.trim();

      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockName,
          location,
          category: blockType,
          prompt: enrichedPrompt,
        }),
      });

      const generateJson =
        (await generateRes.json().catch(() => ({}))) as GenerateResponse;

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
      setStep("instructions");
      setProgress(0);
    }
  }

  if (step === "generating") {
    return (
      <div className="h-screen overflow-hidden bg-[#f6f7fb] text-slate-900">
        <div className="flex h-screen">
          <LeftSidebar />

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f6f7fb]">
            <TopBar title="Generating" stepLabel="Step 2 of 3" />

            <div className="flex flex-1 items-center justify-center px-8 py-8">
              <Generating progress={progress} label={progressLabel} />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f6f7fb] text-slate-900">
      <div className="flex h-screen">
        <LeftSidebar />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f6f7fb]">
          <TopBar
            title="Create Block"
            stepLabel={step === "context" ? "Step 1 of 3" : "Step 2 of 3"}
          />

          <div className="flex flex-1 items-center justify-center px-8 py-6">
            <div className="mx-auto w-full max-w-[900px] rounded-[30px] bg-white px-7 pt-6 pb-8 shadow-[0_10px_35px_rgba(15,23,42,0.04)] ring-1 ring-[#eef1f6]">
              {step === "context" ? (
                <>
                  <ProgressHeader
                    currentStep={1}
                    title="Block Context"
                    subtitle="Define the core block details before moving into generation instructions."
                  />

                  <div className="overflow-hidden rounded-[22px] border border-[#e8ecf4] bg-white">
                    <FormRow label="Block Name">
                      <TextInput
                        value={blockName}
                        onChange={setBlockName}
                        placeholder="Why Choose Kiwa Agri-Food"
                      />
                    </FormRow>

                    <FormRow label="Block Type">
                      <TextInput
                        value={blockType}
                        onChange={setBlockType}
                        placeholder="Why Choose Us"
                      />
                    </FormRow>

                    <FormRow label="Where will this block be used">
                      <TextInput
                        value={location}
                        onChange={setLocation}
                        placeholder="Food, Feed & Agriculture"
                      />
                    </FormRow>

                    <FormRow label="Content Length">
                      <SegmentedOptions
                        value={contentLength}
                        onChange={setContentLength}
                        options={contentLengthOptions}
                      />
                    </FormRow>

                    <FormRow label="Image Source" multiline>
                      <ImageSourceSelector
                        mode={imageSourceMode}
                        setMode={setImageSourceMode}
                        uploadedFileName={uploadedImageFile?.name || ""}
                        onFileChange={setUploadedImageFile}
                      />
                    </FormRow>
                  </div>

                  {error ? (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}

                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="min-w-[120px] rounded-lg bg-[#eef2fb] px-6 py-3 text-sm font-semibold text-[#7380b3] transition-all duration-200 hover:bg-[#dfe6fb] hover:text-[#4b5ea8] hover:shadow-md"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleContinue}
                      disabled={
                        !blockName.trim() ||
                        !blockType.trim() ||
                        !location.trim()
                      }
                      className="min-w-[170px] rounded-lg bg-[#5b7cff] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#3f5ff0] hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <ProgressHeader
                    currentStep={2}
                    title="AI Instructions"
                    subtitle="Provide the generation prompt and review the governance controls applied to the output."
                  />

                  <div className="overflow-hidden rounded-[22px] border border-[#e8ecf4] bg-white">
                    <FormRow label="AI Prompt" multiline helper="Required">
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the content block you want to create..."
                        className="min-h-[140px] w-full rounded-xl border border-[#e3e7f2] bg-[#fafbff] px-4 py-3 text-[14px] leading-[1.7] text-[#2c3348] outline-none transition placeholder:text-[#b6bdd2] hover:border-[#d2d8ea] focus:border-[#5b7cff] focus:bg-white focus:shadow-[0_0_0_4px_rgba(91,124,255,0.08)]"
                      />
                    </FormRow>
                  </div>

                  <div className="mt-5 rounded-[22px] bg-[#f8f9fc] px-6 py-5 ring-1 ring-[#eceff5]">
                    <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#111827]">
                      Governance & Output Controls
                    </h3>
                    <p className="mt-2 text-[13px] text-[#7d859d]">
                      All generated blocks are validated against organisational
                      design, accessibility, performance, and content standards.
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-x-8 gap-y-4">
                      {governanceChecks.map((item) => (
                        <div
                          key={item}
                          className="flex min-w-0 items-center gap-3"
                        >
                          <span className="relative h-[18px] w-[18px] shrink-0 rounded-full bg-[#5b7cff]">
                            <span className="absolute left-1/2 top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                          </span>
                          <span className="text-[13px] font-medium leading-[1.35] text-[#2c3348]">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {error ? (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}

                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="min-w-[120px] rounded-lg bg-[#eef2fb] px-6 py-3 text-sm font-semibold text-[#7380b3] transition-all duration-200 hover:bg-[#dfe6fb] hover:text-[#4b5ea8] hover:shadow-md"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
                      className="min-w-[170px] rounded-lg bg-[#5b7cff] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#3f5ff0] hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isGenerating ? "Generating..." : "Generate Block"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
