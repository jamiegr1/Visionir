"use client";

type Props = {
  progress: number;
  label: string;
};

export default function Generating({ progress, label }: Props) {
  return (
    <div className="mx-auto w-full max-w-[840px] rounded-[34px] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.10)] ring-1 ring-slate-200">
      <div className="px-10 py-14">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-[42px] leading-tight font-semibold text-slate-900">
            Generating Block
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            Applying Kiwa UK governance rules and rendering preview.
          </p>
        </div>

        {/* Panels */}
        <div className="mt-10 space-y-6">
          {/* Processing Checklist */}
          <div className="rounded-2xl bg-[#f6f8fd] ring-1 ring-slate-200 px-7 py-6">
            <p className="text-sm font-semibold text-slate-900">Processing Checklist</p>

            <div className="mt-4 grid gap-y-3 gap-x-10 md:grid-cols-2 text-sm text-slate-700">
              <Item done={progress >= 10} text="Analysing content intent" />
              <Item done={progress >= 35} text="Validating WCAG AA accessibility" />
              <Item done={progress >= 20} text="Applying Kiwa typography system" />
              <Item done={progress >= 55} text="Optimising layout structure" />
              <Item done={progress >= 30} text="Enforcing colour tokens" />
              <Item done={progress >= 75} text="Rendering live preview" />
            </div>
          </div>

          {/* Divider line like your wireframe */}
          <div className="h-px bg-slate-200" />

          {/* Governance Panel */}
          <div className="rounded-2xl bg-[#f6f8fd] ring-1 ring-slate-200 px-7 py-6">
            <p className="text-sm font-semibold text-slate-900">Governance Panel</p>

            <div className="mt-4 grid gap-y-4 gap-x-10 md:grid-cols-2 text-sm text-slate-700">
              <GovItem text="Brand Compliance Target: 100%" />
              <GovItem text="Restricted Scripts: Enabled" />
              <GovItem text="Accessibility Standard: WCAG AA" />
              <GovItem text="Design Tokens: Locked" />
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-10 text-center">
          <p className="text-xs text-slate-500">
            {label}
          </p>

          <div className="mt-4 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Item({ done, text }: { done: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 ${done ? "opacity-100" : "opacity-50"}`}>
      <span className="text-slate-400">{done ? "✓" : "•"}</span>
      <span>{text}</span>
    </div>
  );
}

function GovItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white text-[10px]">
        ●
      </span>
      <span>{text}</span>
    </div>
  );
}