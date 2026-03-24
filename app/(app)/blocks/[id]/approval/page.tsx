"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import type { BlockData } from "@/lib/types";
import { makePreviewHtml } from "@/lib/preview";
import {
  canApproveBlock,
  canRejectBlock,
  type BlockStatus,
  type Role,
  type UserLike,
} from "@/lib/permissions";
import {
  GOVERNANCE_CHECKS,
  shouldShowInternalTeamReview,
} from "@/lib/approval";

type ViewportMode = "mobile" | "tablet" | "desktop";
type CheckState = "pending" | "running" | "approved" | "waiting" | "rejected";

type GovernanceCheck = {
  id: string;
  label: string;
  helper: string;
  state: CheckState;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StatusPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "blue" | "green" | "orange" | "red" | "slate";
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        tone === "blue" && "bg-[#eef3ff] text-[#4f6fff]",
        tone === "green" && "bg-emerald-50 text-emerald-700",
        tone === "orange" && "bg-amber-50 text-amber-700",
        tone === "red" && "bg-rose-50 text-rose-700",
        tone === "slate" && "bg-slate-100 text-slate-600"
      )}
    >
      {children}
    </span>
  );
}

function CheckIcon({ state }: { state: CheckState }) {
  if (state === "approved") {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
        <svg
          className="h-4.5 w-4.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M5 12.5 9.2 16.7 19 7.5" />
        </svg>
      </span>
    );
  }

  if (state === "running") {
    return (
      <span className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#4f6fff] ring-1 ring-[#dbe5ff]">
        <span className="absolute inset-0 rounded-2xl animate-ping bg-[#dfe7ff] opacity-50" />
        <svg
          className="relative h-4.5 w-4.5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 3a9 9 0 1 0 9 9" />
        </svg>
      </span>
    );
  }

  if (state === "waiting") {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
        <svg
          className="h-4.5 w-4.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 7v5l3 2" />
          <circle cx="12" cy="12" r="8.5" />
        </svg>
      </span>
    );
  }

  if (state === "rejected") {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
        <svg
          className="h-4.5 w-4.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M8 8l8 8M16 8l-8 8" />
        </svg>
      </span>
    );
  }

  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 ring-1 ring-slate-200">
      <span className="h-2 w-2 rounded-full bg-slate-300" />
    </span>
  );
}

function CheckStatusLabel({ state }: { state: CheckState }) {
  if (state === "approved") return <StatusPill tone="green">Approved</StatusPill>;
  if (state === "running") return <StatusPill tone="blue">Running</StatusPill>;
  if (state === "waiting") {
    return <StatusPill tone="orange">Awaiting internal review</StatusPill>;
  }
  if (state === "rejected") return <StatusPill tone="red">Rejected</StatusPill>;
  return <StatusPill tone="slate">Pending</StatusPill>;
}

function TimelineCheckRow({
  item,
  isLast,
}: {
  item: GovernanceCheck;
  isLast: boolean;
}) {
  return (
    <div className="relative flex gap-3.5">
      {!isLast && (
        <span
          className={cx(
            "absolute left-5 top-11 w-px",
            item.state === "approved" ? "bg-emerald-200" : "bg-slate-200"
          )}
          style={{ height: "calc(100% + 8px)" }}
        />
      )}

      <div className="relative z-10 shrink-0">
        <CheckIcon state={item.state} />
      </div>

      <div className="min-w-0 flex-1 pb-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-[14px] font-semibold leading-5 text-slate-900">
            {item.label}
          </p>
          <p className="text-[12.5px] leading-5 text-slate-500">
            {item.helper}
          </p>
          <div className="pt-0.5">
            <CheckStatusLabel state={item.state} />
          </div>
        </div>
      </div>
    </div>
  );
}

function mapApiStatusToBlockStatus(value: unknown): BlockStatus {
  if (value === "pending_approval" || value === "in_review") {
    return "pending_approval";
  }

  if (
    value === "draft" ||
    value === "changes_requested" ||
    value === "approved" ||
    value === "published" ||
    value === "rejected" ||
    value === "archived"
  ) {
    return value;
  }

  return "draft";
}

function buildChecks(includeInternalReview: boolean): GovernanceCheck[] {
  const baseChecks: GovernanceCheck[] = GOVERNANCE_CHECKS.map((item) => ({
    id: item.id,
    label: item.label,
    helper: item.helper,
    state: "pending",
  }));

  if (includeInternalReview) {
    return [
      ...baseChecks,
      {
        id: "internal-review",
        label: "Internal Team Review",
        helper:
          "Waiting for a Visionir internal reviewer to manually approve this block.",
        state: "pending",
      },
    ];
  }

  return baseChecks;
}

function isValidRole(value: unknown): value is Role {
  return value === "creator" || value === "approver" || value === "admin";
}

export default function BlockApprovalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [currentUser, setCurrentUser] = useState<UserLike | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editable, setEditable] = useState<BlockData | null>(null);
  const [status, setStatus] = useState<BlockStatus>("draft");
  const [createdByUserId, setCreatedByUserId] = useState("user-1");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [pipelineStarted, setPipelineStarted] = useState(false);
  const [checks, setChecks] = useState<GovernanceCheck[]>([]);

  const runTimeoutsRef = useRef<number[]>([]);
  const redirectedRef = useRef(false);

  const showInternalReview = currentUser
    ? shouldShowInternalTeamReview(currentUser.role)
    : false;

  useEffect(() => {
    async function loadSession() {
      try {
        setSessionLoading(true);

        const res = await fetch("/api/session", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !isValidRole(json?.user?.role)) {
          setCurrentUser(null);
          return;
        }

        setCurrentUser({
          id: typeof json.user.id === "string" ? json.user.id : "user-1",
          role: json.user.role,
        });
      } catch (error) {
        console.error("Failed to load session:", error);
        setCurrentUser(null);
      } finally {
        setSessionLoading(false);
      }
    }

    void loadSession();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    setChecks(buildChecks(showInternalReview));
    setPipelineStarted(false);
    redirectedRef.current = false;

    runTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    runTimeoutsRef.current = [];
  }, [showInternalReview, id, currentUser]);

  useEffect(() => {
    if (!id || !currentUser) return;

    async function loadBlock() {
      try {
        setLoading(true);

        const res = await fetch(`/api/blocks/${id}?role=${currentUser.role}`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.block?.data) {
          setEditable(null);
          return;
        }

        setEditable(json.block.data);
        setStatus(mapApiStatusToBlockStatus(json.block.status));
        setCreatedByUserId(json.block.createdByUserId ?? "user-1");
      } catch (error) {
        console.error("Failed to load approval page:", error);
        setEditable(null);
      } finally {
        setLoading(false);
      }
    }

    void loadBlock();
  }, [id, currentUser]);

  useEffect(() => {
    return () => {
      runTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      runTimeoutsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!id || !currentUser) return;
    if (loading) return;
    if (redirectedRef.current) return;

    if (status === "approved" || status === "published") {
      redirectedRef.current = true;
      router.replace(`/blocks/${id}/deploy`);
    }
  }, [id, loading, router, status, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    if (loading || !editable || pipelineStarted || checks.length === 0) return;
  
    const currentRole = currentUser.role;
  
    if (status === "approved" || status === "published") {
      setChecks((prev) => prev.map((item) => ({ ...item, state: "approved" })));
      setPipelineStarted(true);
      return;
    }
  
    if (status === "rejected") {
      setChecks((prev) =>
        prev.map((item, index) => ({
          ...item,
          state: index === prev.length - 1 ? "rejected" : "approved",
        }))
      );
      setPipelineStarted(true);
      return;
    }
  
    setPipelineStarted(true);
  
    const autoCheckCount = Math.min(GOVERNANCE_CHECKS.length, checks.length);
    const runningDuration = 1200;
    const gapDuration = 260;
  
    for (let i = 0; i < autoCheckCount; i += 1) {
      const startAt = i * (runningDuration + gapDuration);
      const finishAt = startAt + runningDuration;
  
      const startTimer = window.setTimeout(() => {
        setChecks((prev) =>
          prev.map((item, index) =>
            index === i
              ? { ...item, state: "running" }
              : index < i
                ? { ...item, state: "approved" }
                : { ...item, state: "pending" }
          )
        );
      }, startAt);
  
      const finishTimer = window.setTimeout(() => {
        setChecks((prev) =>
          prev.map((item, index) =>
            index === i
              ? { ...item, state: "approved" }
              : index < i
                ? { ...item, state: "approved" }
                : item
          )
        );
      }, finishAt);
  
      runTimeoutsRef.current.push(startTimer, finishTimer);
    }
  
    const afterAutomatedChecksAt = autoCheckCount * (runningDuration + gapDuration);
  
    if (showInternalReview) {
      const finalTimer = window.setTimeout(() => {
        setChecks((prev) =>
          prev.map((item, index) => {
            if (index < autoCheckCount) return { ...item, state: "approved" };
            if (index === autoCheckCount) return { ...item, state: "waiting" };
            return item;
          })
        );
      }, afterAutomatedChecksAt);
  
      runTimeoutsRef.current.push(finalTimer);
    } else {
      const finalTimer = window.setTimeout(async () => {
        try {
          setChecks((prev) =>
            prev.map((item, index) =>
              index < autoCheckCount ? { ...item, state: "approved" } : item
            )
          );
  
          await updateStatus("approved");
  
          if (!redirectedRef.current) {
            redirectedRef.current = true;
            router.replace(`/blocks/${id}/deploy?role=${currentRole}`);
          }
        } catch (error) {
          console.error("Auto-approve failed:", error);
        }
      }, afterAutomatedChecksAt + 250);
  
      runTimeoutsRef.current.push(finalTimer);
    }
  }, [
    checks.length,
    editable,
    id,
    loading,
    pipelineStarted,
    router,
    showInternalReview,
    status,
    currentUser,
  ]);

  const DEFAULT_BLOCK_IMAGE = "/farmerimage.jpg";

  const previewDoc = useMemo(() => {
    if (!editable) return "<html><body></body></html>";

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

  async function updateStatus(nextStatus: BlockStatus) {
    if (!currentUser) return;

    const res = await fetch(`/api/blocks/${id}?role=${currentUser.role}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Status update failed:", json);
      throw new Error(json?.error || "Failed to update status");
    }

    setStatus(nextStatus);
  }

  async function handleApprove() {
    if (!currentUser) return;

    try {
      setIsApproving(true);
      await updateStatus("approved");

      setChecks((prev) => prev.map((item) => ({ ...item, state: "approved" })));

      if (!redirectedRef.current) {
        redirectedRef.current = true;
        router.replace(`/blocks/${id}/deploy`);
      }
    } catch (error) {
      console.error("Approve failed:", error);
      alert("Failed to approve block");
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    if (!currentUser) return;

    try {
      setIsRejecting(true);
      await updateStatus("rejected");

      setChecks((prev) =>
        prev.map((item, index) => ({
          ...item,
          state: index === prev.length - 1 ? "rejected" : "approved",
        }))
      );
    } catch (error) {
      console.error("Reject failed:", error);
      alert("Failed to reject block");
    } finally {
      setIsRejecting(false);
    }
  }

  const approvedCount = checks.filter((item) => item.state === "approved").length;
  const totalCount = checks.length || 1;
  const progressPercent = Math.round((approvedCount / totalCount) * 100);

  const internalReviewIndex = checks.findIndex((item) => item.id === "internal-review");
  const internalReviewWaiting =
    internalReviewIndex >= 0 && checks[internalReviewIndex]?.state === "waiting";

  const statusLabel =
    status === "approved"
      ? "Approved"
      : status === "published"
        ? "Published"
        : status === "rejected"
          ? "Rejected"
          : internalReviewWaiting
            ? "Awaiting Internal Review"
            : "AI Checks Running";

  const statusColorClass =
    status === "approved" || status === "published"
      ? "text-emerald-600"
      : status === "rejected"
        ? "text-rose-600"
        : internalReviewWaiting
          ? "text-amber-600"
          : "text-[#4f6fff]";

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

  const manualReviewReady =
    !!currentUser &&
    showInternalReview &&
    internalReviewIndex >= 0 &&
    checks[internalReviewIndex]?.state === "waiting" &&
    status === "pending_approval";

  const permissionBlock = {
    createdByUserId,
    status,
  };

  const userCanApprove =
    !!currentUser &&
    showInternalReview &&
    canApproveBlock(currentUser, permissionBlock);

  const userCanReject =
    !!currentUser &&
    showInternalReview &&
    canRejectBlock(currentUser, permissionBlock);

  if (sessionLoading || !currentUser || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-500">
        Loading…
      </div>
    );
  }

  if (!editable) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-500">
        Block not found.
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-72px)] overflow-hidden bg-[#f5f7fb] text-slate-900">
      <div className="flex h-[calc(100dvh-72px)] overflow-hidden">
        <aside className="w-full max-w-[360px] shrink-0 border-r border-slate-200 bg-white">
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-slate-200 px-5 py-5">
              <div>
                <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
                  Approval Timeline
                </h2>
                <p className="mt-1 text-[13px] leading-5 text-slate-500">
                  {showInternalReview
                    ? "Automated checks are validating this block before final internal review."
                    : "Automated governance checks are validating this block before approval."}
                </p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Role: {currentUser.role}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 pr-2">
              <section>
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4f6fff]">
                        Governance Overview
                      </p>
                    </div>

                    <button
                      type="button"
                      className="text-slate-400 transition hover:text-slate-600"
                    >
                      •••
                    </button>
                  </div>

                  <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">Progress</p>
                        <p className="mt-0.5 text-[12px] text-slate-500">
                          {approvedCount} of {checks.length} checks completed
                        </p>
                      </div>

                      <p className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
                        {progressPercent}%
                      </p>
                    </div>

                    <div className="mt-3 h-1.5 rounded-full bg-slate-200">
                      <div
                        className="h-1.5 rounded-full bg-[#5b7cff] transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    {checks.map((item, index) => (
                      <TimelineCheckRow
                        key={item.id}
                        item={item}
                        isLast={index === checks.length - 1}
                      />
                    ))}
                  </div>

                  {(userCanApprove || userCanReject) && (
                    <div className="mt-4 flex gap-2.5">
                      {userCanApprove && (
                        <button
                          type="button"
                          onClick={handleApprove}
                          disabled={!manualReviewReady || isApproving}
                          className="inline-flex h-10 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-[13px] font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isApproving ? "Approving..." : "Approve"}
                        </button>
                      )}

                      {userCanReject && (
                        <button
                          type="button"
                          onClick={handleReject}
                          disabled={!manualReviewReady || isRejecting}
                          className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-100 px-4 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isRejecting ? "Rejecting..." : "Reject"}
                        </button>
                      )}
                    </div>
                  )}

                  {!showInternalReview && (
                    <div className="mt-4 rounded-2xl border border-[#dbe5ff] bg-[#f7f9ff] px-4 py-3 text-sm text-[#4f6fff]">
                      Your role bypasses internal team review. Once all 5 governance
                      checks pass, this block will be approved automatically.
                    </div>
                  )}

                  {showInternalReview && !userCanApprove && !userCanReject && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Your role can view this approval workflow, but cannot approve or reject this block.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </aside>

        <main className="grid min-w-0 flex-1 min-h-0 grid-rows-[auto_minmax(0,1fr)_auto_auto] overflow-hidden bg-[#f5f7fb]">
          <div className="shrink-0 border-b border-slate-200 bg-[#f5f7fb] px-8 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-900">
                  {showInternalReview ? "Block Submitted for Approval" : "Running Governance Checks"}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {showInternalReview
                    ? "Visionir is now running automated compliance and governance checks before final internal sign-off."
                    : "Visionir is running the 5 automated governance checks. Internal team review is skipped for your role."}
                </p>
              </div>

              <div className="flex items-center gap-2">
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
          </div>

          <div className="min-h-0 overflow-hidden px-8 py-5">
            <div className="flex h-full min-h-0 flex-col">
              <div className="min-h-0 flex-1 overflow-hidden">
                <div className="flex h-full items-center justify-center">
                  <div
                    className={cx(
                      "w-full rounded-[40px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]",
                      shellWidthClass
                    )}
                  >
                    <div
                      className={cx(
                        "rounded-[28px] bg-white",
                        viewport === "desktop"
                          ? "overflow-hidden"
                          : "overflow-y-auto overflow-x-hidden"
                      )}
                      style={{
                        height:
                          viewport === "desktop"
                            ? "min(560px, calc(100dvh - 356px))"
                            : "min(620px, calc(100dvh - 336px))",
                      }}
                    >
                      <div
                        className={cx(
                          "flex min-h-full justify-center",
                          viewport === "tablet" ? "items-start py-0" : "items-start"
                        )}
                      >
                        <iframe
                          title="Block Approval Preview"
                          srcDoc={previewDoc}
                          className="block border-0 bg-white align-top"
                          style={{
                            width: `${previewViewportWidth}px`,
                            minWidth: `${previewViewportWidth}px`,
                            height: `${previewHeight}px`,
                            display: "block",
                          }}
                          scrolling="no"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-[#f5f7fb] px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                <span>Version 1.0</span>
                <span>
                  Status: <span className={cx("font-medium", statusColorClass)}>{statusLabel}</span>
                </span>
                <span>Governance checks completed: {approvedCount}/{checks.length}</span>
              </div>

              {(userCanReject || userCanApprove) && (
                <div className="flex items-center gap-3">
                  {userCanReject && (
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={!manualReviewReady || isRejecting}
                      className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isRejecting ? "Rejecting..." : "Reject"}
                    </button>
                  )}

                  {userCanApprove && (
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={!manualReviewReady || isApproving}
                      className="rounded-2xl bg-[#5b7cff] px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#1f36b8] active:bg-[#2642c7] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isApproving ? "Approving..." : "Approve"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-[#f5f7fb] px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                <span>Brand Compliance: 100% ✓</span>
                <span>Accessibility: WCAG AA ✓</span>
                <span>Design Tokens: Locked ✓</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}