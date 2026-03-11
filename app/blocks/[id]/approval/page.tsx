"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { BlockData } from "@/lib/types";
import { makePreviewHtml } from "@/lib/preview";

type BlockStatus = "draft" | "in_review" | "approved" | "rejected";

export default function BlockApprovalPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [editable, setEditable] = useState<BlockData | null>(null);
  const [status, setStatus] = useState<BlockStatus>("draft");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    async function loadBlock() {
      try {
        setLoading(true);

        const res = await fetch(`/api/blocks/${id}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.block?.data) {
          setEditable(null);
          return;
        }

        setEditable(json.block.data);
        setStatus((json.block.status as BlockStatus) || "draft");
      } catch (error) {
        console.error("Failed to load approval page:", error);
        setEditable(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      void loadBlock();
    }
  }, [id]);

  const previewDoc = useMemo(() => {
    if (!editable) return "<html><body></body></html>";
    return makePreviewHtml(editable);
  }, [editable]);

  async function updateStatus(nextStatus: BlockStatus) {
    const res = await fetch(`/api/blocks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: nextStatus,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(json?.error || "Failed to update status");
    }

    setStatus(nextStatus);
  }

  async function handleApprove() {
    try {
      setIsApproving(true);
      await updateStatus("approved");
    } catch (error) {
      console.error("Approve failed:", error);
      alert("Failed to approve block");
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    try {
      setIsRejecting(true);
      await updateStatus("rejected");
    } catch (error) {
      console.error("Reject failed:", error);
      alert("Failed to reject block");
    } finally {
      setIsRejecting(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!editable) return <div className="p-6">Block not found.</div>;

  return (
    <div className="min-h-screen bg-[#f6f5fb] text-slate-900">
      <div className="flex min-h-screen">
        {/* Left rail */}
        <aside className="hidden w-[86px] shrink-0 border-r border-slate-200 bg-white xl:flex xl:flex-col xl:items-center xl:justify-between">
          <div className="w-full px-3 pt-6">
            <div className="mb-8 flex justify-center">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400" />
            </div>

            <div className="space-y-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl ${
                    i === 1
                      ? "bg-blue-50 text-blue-600 ring-1 ring-blue-100"
                      : "text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <div className="h-4 w-4 rounded-sm border border-current" />
                </div>
              ))}
            </div>
          </div>

          <div className="w-full px-3 pb-5">
            <div className="mx-auto h-10 w-10 rounded-xl bg-white ring-1 ring-slate-200" />
          </div>
        </aside>

        {/* Timeline panel */}
        <aside className="w-full max-w-[360px] shrink-0 border-r border-slate-200 bg-white">
          <div className="px-8 py-10">
            <div className="mb-10">
              <div className="mb-8 h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400" />
              <p className="text-[18px] font-light text-slate-500">Block Submitted</p>
              <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
                Approval Timeline
              </h1>
            </div>

            <div className="rounded-[28px] bg-[#fbfbfe] p-6 ring-1 ring-slate-200/70">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[18px] font-semibold text-slate-900">Draft Created — Jamie</p>
                </div>
                <button
                  type="button"
                  className="text-slate-400"
                >
                  •••
                </button>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-3 text-[15px] font-medium text-emerald-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>AI Governance Checks Passed</span>
                </div>

                <div className="flex items-center gap-3 text-[15px] font-medium text-blue-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span>Submitted for Review</span>
                </div>

                <div className="flex items-center gap-3 text-[15px] font-medium text-amber-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span>
                    Brand Review —{" "}
                    {status === "approved"
                      ? "Approved"
                      : status === "rejected"
                      ? "Rejected"
                      : "Pending"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[15px] font-medium text-amber-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span>
                    Compliance Review —{" "}
                    {status === "approved"
                      ? "Approved"
                      : status === "rejected"
                      ? "Rejected"
                      : "Pending"}
                  </span>
                </div>

                <div
                  className={`flex items-center gap-3 text-[15px] font-medium ${
                    status === "approved" ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      status === "approved" ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  />
                  <span>Approved for Deployment</span>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={status !== "in_review" || isApproving}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isApproving ? "Approving..." : "Approve"}
                </button>

                <button
                  type="button"
                  onClick={handleReject}
                  disabled={status !== "in_review" || isRejecting}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRejecting ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <div className="flex h-screen flex-col">
            <div className="flex items-center justify-between px-8 pb-4 pt-8">
              <div>
                <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
                  Block Submitted for Approval
                </h2>
                <p className="mt-3 text-[15px] text-slate-500">
                  This block is now under governance review before publishing.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200">
                  📱
                </button>
                <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200">
                  💻
                </button>
                <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200">
                  🖥️
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 px-6 pb-4">
              <div className="flex h-full flex-col rounded-[34px] bg-transparent">
                <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto rounded-[34px] bg-[#f6f5fb] px-4 pb-4 pt-2">
                  <div className="w-full max-w-[1180px]">
                    <div className="mx-auto rounded-[42px] bg-white px-6 py-6 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
                      <div
                        className="overflow-hidden rounded-[36px] bg-white"
                        dangerouslySetInnerHTML={{ __html: previewDoc }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-slate-200/70 px-8 py-5 text-[13px] text-slate-500">
                  <span>This block is now under governance review before publishing.</span>
                  <span>
                    Version <span className="font-medium text-slate-700">1.0</span>
                  </span>
                  <span>
                    Status:{" "}
                    <span
                      className={
                        status === "approved"
                          ? "font-medium text-emerald-600"
                          : status === "rejected"
                          ? "font-medium text-rose-600"
                          : "font-medium text-amber-500"
                      }
                    >
                      {status === "approved"
                        ? "Approved"
                        : status === "rejected"
                        ? "Rejected"
                        : "Pending Review"}
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-slate-200/70 px-8 py-5 text-[13px] text-slate-500">
                  <span>
                    Brand Compliance: <span className="font-medium text-slate-700">100% ✓</span>
                  </span>
                  <span>
                    Accessibility: <span className="font-medium text-slate-700">WCAG AA ✓</span>
                  </span>
                  <span>
                    Design Tokens: <span className="font-medium text-slate-700">Locked</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}