"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ComponentSchema } from "@/lib/component-schema";
import { hasPermission, type Role } from "@/lib/permissions";

type StatusFilter =
  | "all"
  | "approved"
  | "pending_approval"
  | "changes_requested"
  | "archived";

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

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
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

  async function updateStatus(
    id: string,
    action: "approve" | "request_changes" | "archive"
  ) {
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
      approved: blockTypes.filter((i) => i.status === "approved").length,
      pending_approval: blockTypes.filter((i) => i.status === "pending_approval").length,
      changes_requested: blockTypes.filter((i) => i.status === "changes_requested").length,
      archived: blockTypes.filter((i) => i.status === "archived").length,
    };
  }, [blockTypes]);

  if (!canView) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f6f7fb]">
        <div className="rounded-[28px] border bg-white p-8 text-center">
          <h1 className="text-lg font-semibold">Access restricted</h1>
          <p className="mt-2 text-sm text-slate-500">
            You don’t have permission to view block types.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-72px)] flex-col bg-[#f6f7fb]">
      {/* HEADER */}
      <div className="border-b bg-white px-8 py-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Block Type Library</h1>
            <p className="text-sm text-slate-500">
              Govern and approve reusable block types across your platform.
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => router.push(`/block-types/new?role=${role}`)}
              className="rounded-2xl bg-[#5b7cff] px-5 py-3 text-white font-semibold"
            >
              Create Block Type
            </button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-[1180px] mx-auto">

          {/* FILTERS */}
          <div className="grid md:grid-cols-5 gap-3 mb-5">
            {(Object.keys(counts) as StatusFilter[]).map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={cx(
                  "rounded-xl border px-4 py-3 text-left",
                  filter === item ? "border-[#5b7cff]" : "border-slate-200"
                )}
              >
                <div className="text-xs text-slate-500">{statusLabel(item)}</div>
                <div className="text-xl font-semibold">{counts[item]}</div>
              </button>
            ))}
          </div>

          {/* STATES */}
          {loading ? (
            <div className="p-6 bg-white rounded-xl text-center">
              Loading block types…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 bg-white rounded-xl text-center">
              <h2 className="font-semibold text-lg">No block types yet</h2>
              <p className="text-sm text-slate-500 mt-2">
                Create your first block type to start building governed components.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((bt) => (
                <div
                  key={bt.id}
                  className="bg-white border rounded-xl p-5"
                >
                  <div className="flex justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex gap-2 mb-2">
                        <StatusPill status={bt.status} />
                        <span className="text-xs text-slate-500">{bt.category}</span>
                      </div>

                      <h2 className="text-lg font-semibold">{bt.name}</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {bt.description}
                      </p>

                      <div className="flex gap-3 mt-3 text-xs text-slate-600">
                        <span>{bt.fields.length} fields</span>
                        <span>{bt.variants.length} variants</span>
                        <span>Submitted: {formatDate(bt.submittedAt)}</span>
                        <span>Approved: {formatDate(bt.approvedAt)}</span>
                      </div>

                      {bt.changesRequestedNotes && (
                        <div className="mt-3 text-sm text-red-600">
                          {bt.changesRequestedNotes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {canApprove && bt.status === "pending_approval" && (
                        <>
                          <button
                            onClick={() => updateStatus(bt.id, "approve")}
                            className="bg-emerald-600 text-white px-4 py-2 rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(bt.id, "request_changes")}
                            className="bg-red-50 text-red-700 px-4 py-2 rounded"
                          >
                            Request Changes
                          </button>
                        </>
                      )}

                      {role === "admin" && bt.status !== "archived" && (
                        <button
                          onClick={() => updateStatus(bt.id, "archive")}
                          className="bg-slate-100 px-4 py-2 rounded"
                        >
                          Archive
                        </button>
                      )}
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
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <BlockTypesPageContent />
    </Suspense>
  );
}