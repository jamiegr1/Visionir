"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ComponentSchema } from "@/lib/component-schema";
import { hasPermission, type Role } from "@/lib/permissions";

type StatusFilter = "all" | "approved" | "pending_approval" | "changes_requested" | "archived";

type BlockTypeStatus =
  | "draft"
  | "pending_approval"
  | "changes_requested"
  | "approved"
  | "archived";

type ComponentWithAudit = Omit<ComponentSchema, "status"> & {
  status: BlockTypeStatus;
  createdByUserId?: string;
  approvedByUserId?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  changesRequestedNotes?: string | null;
};

function isRole(value: string | null): value is Role {
  return value === "creator" || value === "approver" || value === "admin";
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cx(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
        status === "approved" && "bg-emerald-50 text-emerald-700",
        status === "pending_approval" && "bg-amber-50 text-amber-700",
        status === "changes_requested" && "bg-red-50 text-red-700",
        status === "archived" && "bg-slate-100 text-slate-600",
        status === "draft" && "bg-blue-50 text-blue-700"
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

function BlockTypesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = useMemo<Role>(() => {
    const value = searchParams.get("role");
    return isRole(value) ? value : "admin";
  }, [searchParams]);

  const canView = hasPermission(role, "block_type.view");
  const canCreate = hasPermission(role, "block_type.create");
  const canApprove = hasPermission(role, "block_type.approve");

  const [blockTypes, setBlockTypes] = useState<ComponentWithAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [error, setError] = useState<string | null>(null);

  async function loadBlockTypes() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/block-types?role=${role}`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to load block types.");
      }

      setBlockTypes(Array.isArray(json?.blockTypes) ? json.blockTypes : []);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, action: "approve" | "request_changes" | "archive") {
    const notes =
      action === "request_changes"
        ? window.prompt("What changes are required?") || "Changes requested."
        : undefined;

    try {
      const res = await fetch(`/api/block-types/${id}?role=${role}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to update block type.");
      }

      await loadBlockTypes();
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    }
  }

  useEffect(() => {
    if (canView) loadBlockTypes();
  }, [canView, role]);

  const filtered = useMemo(() => {
    if (filter === "all") return blockTypes;
    return blockTypes.filter((item) => item.status === filter);
  }, [blockTypes, filter]);

  const counts = useMemo(() => {
    return {
      all: blockTypes.length,
      approved: blockTypes.filter((item) => item.status === "approved").length,
      pending_approval: blockTypes.filter((item) => item.status === "pending_approval").length,
      changes_requested: blockTypes.filter((item) => item.status === "changes_requested").length,
      archived: blockTypes.filter((item) => item.status === "archived").length,
    };
  }, [blockTypes]);

  if (!canView) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-[#f6f7fb] px-6">
        <div className="w-full max-w-[520px] rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
          <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
            Access restricted
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Your current role does not have permission to view block types.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-72px)] flex-col overflow-hidden bg-[#f6f7fb] text-slate-900">
      <div className="shrink-0 border-b border-[#e8ebf3] bg-[#f6f7fb]/95 px-8 py-5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.04em] text-[#111827]">
              Block Type Library
            </h1>
            <p className="mt-1 text-[13px] leading-6 text-[#7d859d]">
              Manage approved, pending and requested block types used across pages and templates.
            </p>
          </div>

          {canCreate ? (
            <button
              type="button"
              onClick={() => router.push(`/block-types/new?role=${role}`)}
              className="rounded-2xl bg-[#5b7cff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3f5ff0]"
            >
              Create Block Type
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto w-full max-w-[1180px]">
          <div className="mb-5 grid gap-3 md:grid-cols-5">
            {(["all", "approved", "pending_approval", "changes_requested", "archived"] as StatusFilter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={cx(
                  "rounded-[22px] border px-4 py-3 text-left transition",
                  filter === item
                    ? "border-[#5b7cff] bg-white shadow-[0_10px_30px_rgba(63,95,240,0.08)]"
                    : "border-[#e8ecf4] bg-white/70 hover:bg-white"
                )}
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7d859d]">
                  {statusLabel(item)}
                </div>
                <div className="mt-1 text-[22px] font-semibold tracking-[-0.04em] text-[#111827]">
                  {counts[item]}
                </div>
              </button>
            ))}
          </div>

          {error ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-[28px] border border-[#e8ecf4] bg-white p-8 text-center text-sm font-medium text-slate-500">
              Loading block types…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[28px] border border-[#e8ecf4] bg-white p-8 text-center">
              <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-[#111827]">
                No block types found
              </h2>
              <p className="mt-2 text-sm text-[#7d859d]">
                Create a new block type or change the selected filter.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filtered.map((blockType) => (
                <div
                  key={blockType.id}
                  className="rounded-[28px] border border-[#e8ecf4] bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.035)]"
                >
                  <div className="flex items-start justify-between gap-5">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <StatusPill status={blockType.status} />
                        <span className="rounded-full bg-[#f4f7ff] px-2.5 py-1 text-[11px] font-semibold text-[#5b7cff]">
                          {blockType.category}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {blockType.visibility || "global"}
                        </span>
                      </div>

                      <h2 className="text-[20px] font-semibold tracking-[-0.04em] text-[#111827]">
                        {blockType.name}
                      </h2>

                      <p className="mt-2 max-w-[760px] text-[13px] leading-6 text-[#7d859d]">
                        {blockType.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-[#e8ecf4] bg-[#fafbff] px-3 py-1.5 text-[12px] font-medium text-[#55607d]">
                          {blockType.fields.length} fields
                        </span>
                        <span className="rounded-full border border-[#e8ecf4] bg-[#fafbff] px-3 py-1.5 text-[12px] font-medium text-[#55607d]">
                          {blockType.variants.length} variants
                        </span>
                        {blockType.useCaseLabel ? (
                          <span className="rounded-full border border-[#e8ecf4] bg-[#fafbff] px-3 py-1.5 text-[12px] font-medium text-[#55607d]">
                            {blockType.useCaseLabel}
                          </span>
                        ) : null}
                      </div>

                      {blockType.changesRequestedNotes ? (
                        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] leading-6 text-red-700">
                          {blockType.changesRequestedNotes}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-col gap-2">
                      {canApprove && blockType.status === "pending_approval" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => updateStatus(blockType.id, "approve")}
                            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(blockType.id, "request_changes")}
                            className="rounded-xl bg-red-50 px-4 py-2.5 text-[13px] font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            Request Changes
                          </button>
                        </>
                      ) : null}

                      {role === "admin" && blockType.status !== "archived" ? (
                        <button
                          type="button"
                          onClick={() => updateStatus(blockType.id, "archive")}
                          className="rounded-xl bg-slate-100 px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-200"
                        >
                          Archive
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BlockTypesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-0 items-center justify-center bg-[#f6f7fb] text-sm font-medium text-slate-500">
          Loading block type library…
        </div>
      }
    >
      <BlockTypesPageContent />
    </Suspense>
  );
}