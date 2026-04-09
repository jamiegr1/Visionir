"use client";

type Props = {
  progress: number;
  label: string;
};

export default function Generating({ progress, label }: Props) {
  return (
    <div className="mx-auto w-full max-w-[900px] rounded-[34px] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.10)] ring-1 ring-slate-200">
      <div className="px-10 py-14">
        <div className="text-center">
          <h2 className="text-[42px] leading-tight font-semibold text-slate-900">
            Generating Block
          </h2>

          <p className="mt-3 text-sm text-slate-500">
            Visionir is applying governance, accessibility and design rules
            before rendering your preview.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          <div className="rounded-2xl bg-[#f6f8fd] ring-1 ring-slate-200 px-7 py-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-900">
                Processing Checklist
              </p>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                {Math.min(100, Math.max(0, Math.round(progress)))}%
              </span>
            </div>

            <div className="mt-5 grid gap-y-3 gap-x-10 text-sm text-slate-700 md:grid-cols-2">
              <Item done={progress >= 8} text="Analysing prompt intent" />
              <Item done={progress >= 22} text="Applying typography system" />
              <Item done={progress >= 34} text="Enforcing colour tokens" />
              <Item done={progress >= 48} text="Checking governance constraints" />
              <Item done={progress >= 62} text="Validating WCAG AA accessibility" />
              <Item done={progress >= 78} text="Generating layout structure" />
              <Item done={progress >= 90} text="Rendering live preview" />
              <Item done={progress >= 100} text="Finalising block output" />
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          <div className="rounded-2xl bg-[#f6f8fd] ring-1 ring-slate-200 px-7 py-6">
            <p className="text-sm font-semibold text-slate-900">
              Governance Panel
            </p>

            <div className="mt-4 grid gap-y-4 gap-x-10 text-sm text-slate-700 md:grid-cols-2">
              <GovItem
                active={progress >= 15}
                text="Brand Compliance Target: 100%"
              />
              <GovItem
                active={progress >= 30}
                text="Restricted Scripts: Enabled"
              />
              <GovItem
                active={progress >= 45}
                text="Accessibility Standard: WCAG AA"
              />
              <GovItem active={progress >= 60} text="Design Tokens: Locked" />
              <GovItem
                active={progress >= 75}
                text="Component Governance: Active"
              />
              <GovItem
                active={progress >= 90}
                text="Preview Rendering: Approved"
              />
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs font-medium tracking-[0.08em] text-slate-500 uppercase">
            {label}
          </p>

          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#5b7cff] transition-[width] duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Building a governed, on-brand block preview for review.
          </p>
        </div>
      </div>
    </div>
  );
}

function Item({ done, text }: { done: boolean; text: string }) {
  return (
    <div
      className={`flex items-center gap-2 transition ${
        done ? "opacity-100" : "opacity-50"
      }`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
          done
            ? "bg-emerald-100 text-emerald-700"
            : "bg-white text-slate-400 ring-1 ring-slate-200"
        }`}
      >
        {done ? "✓" : "•"}
      </span>
      <span>{text}</span>
    </div>
  );
}

function GovItem({
  text,
  active,
}: {
  text: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 transition ${
        active ? "opacity-100" : "opacity-45"
      }`}
    >
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
          active
            ? "bg-[#5b7cff] text-white"
            : "bg-white text-slate-300 ring-1 ring-slate-200"
        }`}
      >
        ●
      </span>
      <span>{text}</span>
    </div>
  );
}